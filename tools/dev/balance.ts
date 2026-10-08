import { writeFile } from "node:fs/promises";
import { ATTACKS, STANCES, type Attack, type Stance } from "../../shared/input";
import {
  command,
  createStudy,
  step,
  FIXED_STEP,
} from "../../src/features/boxing/domain/study";
import {
  OPPONENTS,
  type OpponentId,
} from "../../src/features/boxing/domain/opponent";
import {
  evaluatePunch,
  punchContext,
} from "../../src/features/boxing/domain/tactics";
const campaign = process.argv.includes("--campaign");
const difficulty = process.argv.includes("--ring-sense")
  ? "ring-sense"
  : "standard";
const decisionInterval = campaign ? 0.7 : 0.28;
const timeout = campaign ? 240 : 180;
const strategies = ["tactical", "mixed", "heavy-jab", "held-defence"] as const;
const runs = [];
for (const id of Object.keys(OPPONENTS) as OpponentId[])
  for (const strategy of strategies)
    for (let seed = 1; seed <= 16; seed++) {
      const s = createStudy(false, seed * 7919, id, campaign, difficulty);
      command(s, { type: "start" });
      let decisionsAt = 0,
        contact = 0,
        miss = 0,
        block = 0,
        damage = 0,
        stunSeconds = 0,
        used = new Set<string>();
      for (
        let frame = 0;
        frame < timeout * 60 && s.phase === "sparring";
        frame++
      ) {
        if (s.time >= decisionsAt && !s.knockout) {
          decisionsAt = s.time + decisionInterval;
          let stance: Stance = "offensive",
            attack: Attack = "jab",
            power = 2;
          if (strategy === "held-defence") stance = "defensive";
          else if (strategy === "heavy-jab") power = 4;
          else if (strategy === "mixed") attack = ATTACKS[s.punches % 4];
          else {
            const incoming =
              s.rivalStrike &&
              !s.rivalStrike.resolved &&
              s.rivalStrike.contactAt - (s.time - s.rivalStrike.started) < 0.28;
            stance = incoming
              ? "defensive"
              : s.staggerUntil > s.time
                ? "offensive"
                : "neutral";
            const candidates = ATTACKS.map((a) => ({
              a,
              r: evaluatePunch(
                punchContext(s, "player", { attack: a, power: 2, stance }),
              ),
            }));
            const best = candidates.sort((a, b) => b.r.damage - a.r.damage)[0];
            attack = best.a;
            if (best.r.outcome === "block" || best.r.outcome === "whiff") {
              stance = "offensive";
              attack =
                s.spacing.guard === "high"
                  ? "hook"
                  : s.spacing.guard === "wide"
                    ? "uppercut"
                    : "jab";
            }
            if (s.staggerUntil > s.time && s.stamina > 45) power = 3;
          }
          command(s, {
            type: "select",
            wheel: "attack",
            index: ATTACKS.indexOf(attack),
          });
          command(s, {
            type: "select",
            wheel: "stance",
            index: STANCES.indexOf(stance),
          });
          command(s, { type: "select", wheel: "power", index: power - 1 });
          if (
            strategy !== "held-defence" &&
            (!s.rivalStrike ||
              strategy !== "tactical" ||
              s.rivalStrike.resolved ||
              s.staggerUntil > s.time)
          ) {
            const assessment = evaluatePunch(
              punchContext(s, "player", { attack, power, stance: s.stance }),
            );
            if (strategy !== "tactical" || assessment.damage > 0)
              command(s, { type: "punch" });
          }
        }
        if (s.stunUntil.rival > s.time) stunSeconds += FIXED_STEP;
        for (const e of step(s, FIXED_STEP))
          if (e.type === "impact" && e.side === "player") {
            contact++;
            used.add(e.attack!);
            damage += e.damage ?? 0;
            if (e.outcome === "whiff") miss++;
            if (e.outcome === "block") block++;
          }
      }
      runs.push({
        id,
        strategy,
        seed,
        result: s.phase,
        seconds: +s.time.toFixed(2),
        health: s.playerHealth,
        rivalHealth: s.rivalHealth,
        punches: s.punches,
        contacts: contact,
        misses: miss,
        blocks: block,
        damage,
        attacksUsed: used.size,
        rivalThrows: s.opponent.thrown,
        rivalStunSeconds: +stunSeconds.toFixed(2),
      });
    }
const median = (values: number[]) =>
  values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
const summary = [];
for (const id of Object.keys(OPPONENTS))
  for (const strategy of strategies) {
    const row = runs.filter((r) => r.id === id && r.strategy === strategy);
    summary.push({
      id,
      strategy,
      wins: row.filter((r) => r.result === "victory").length,
      losses: row.filter((r) => r.result === "loss").length,
      timeouts: row.filter((r) => r.result === "sparring").length,
      medianSeconds: median(row.map((r) => r.seconds)),
      medianHealth: median(row.map((r) => r.health)),
      medianRivalThrows: median(row.map((r) => r.rivalThrows)),
      meanStunFraction: +(
        row.reduce(
          (n, r) => n + r.rivalStunSeconds / Math.max(1, r.seconds),
          0,
        ) / row.length
      ).toFixed(3),
    });
  }
const path = process.argv[2] ?? ".impeccable/review/balance-baseline.json";
await writeFile(
  path,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      method: `192 deterministic synthetic runs; 16 seeds × 3 rivals × 4 policies, decisions at ${decisionInterval * 1000}ms intervals, timeout ${timeout} seconds. Automated current-state policies are not human or hardware playtests.`,
      campaign,
      difficulty,
      summary,
      runs,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(summary, null, 2));
