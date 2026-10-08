import {
  createOpponent,
  chooseOpponentAction,
  recordOpponentAttack,
  nextOpponentBeat,
  OPPONENTS,
  type OpponentId,
} from "./opponent";
import { ATTACKS, STANCES } from "../../../../shared/input";
import type {
  StudyCommand,
  StudyEvent,
  StudyState,
  Strike,
  StudySnapshot,
  Outcome,
} from "./types";
import { footworkPlan } from "./footwork";
import { knockoutStyle } from "./knockout";
import {
  createSpacing,
  advanceSpacing,
  gap,
  PUNCH_REACH,
  playerOutcome,
  resolveRange,
  rivalAttack,
  spacingRandom,
  spacingRead,
} from "./spacing";
import {
  createExchange,
  assessPlayer,
  evaluatePunch,
  punchContext,
  recordExchange,
  opportunityRead,
  SCENARIOS,
} from "./tactics";
import { commitContact, resolveContact, applyContact } from "./contact";
import { isDifficulty, observeOpponent, type Difficulty } from "./difficulty";
export const FIXED_STEP = 1 / 60;
export function createStudy(
  training = false,
  seed = 1299,
  id: OpponentId = "quickstep",
  campaign = false,
  difficulty: Difficulty = "standard",
): StudyState {
  return {
    training,
    difficulty: training ? "standard" : difficulty,
    opponent: createOpponent(id),
    spacing: createSpacing(!training, seed),
    exchanges: { player: createExchange(), rival: createExchange() },
    time: 0,
    phase: "ready",
    selection: { attack: "jab", stance: "neutral", power: 2 },
    stance: "neutral",
    playerHealth: 100,
    rivalHealth: training || !campaign ? 100 : OPPONENTS[id].health,
    rivalMaxHealth: training || !campaign ? 100 : OPPONENTS[id].health,
    campaign,
    fightStats: { landed: 0, blocked: 0, missed: 0, received: 0 },
    stamina: 100,
    superCharge: training ? 100 : 0,
    superUntil: 0,
    playerStrike: null,
    rivalStrike: null,
    lastDefence: -10,
    nextRival: 4,
    staggerUntil: 0,
    staggerReadyAt: { player: 0, rival: 0 },
    stunUntil: { player: 0, rival: 0 },
    hitStop: 0,
    knockout: null,
    knockouts: 0,
    punches: 0,
    eventId: 0,
    lastEvent: null,
  };
}
export function wrap(index: number, length: number) {
  return ((index % length) + length) % length;
}
export function strikeDuration(
  attack: Strike["attack"],
  power: number,
  stance: Strike["stance"] = "neutral",
  variant = 0,
) {
  return (
    { jab: 0.55, cross: 0.7, hook: 0.8, uppercut: 0.86 }[attack] +
    (power - 1) * 0.105 +
    footworkPlan(attack, stance, power, variant).recovery
  );
}
function emit(s: StudyState, value: Omit<StudyEvent, "id">) {
  const e = { ...value, id: ++s.eventId };
  s.lastEvent = e;
  return e;
}
function beginKnockout(
  s: StudyState,
  recipient: "player" | "rival",
  preview = false,
  variant = s.knockouts % 6,
): StudyEvent {
  const source = recipient === "rival" ? s.playerStrike : s.rivalStrike;
  const chosen = ((Math.trunc(variant) % 6) + 6) % 6;
  const style = knockoutStyle(chosen);
  s.knockout = {
    recipient,
    variant: chosen,
    attack: source?.attack ?? s.selection.attack,
    power: source?.power ?? s.selection.power,
    started: s.time,
    duration: style.duration,
    nextImpact: 0,
    preview,
  };
  s.knockouts++;
  s.opponent.feint = null;
  s.playerStrike = s.rivalStrike = null;
  s.hitStop = 0;
  s.superUntil = 0;
  s.stunUntil.player = s.stunUntil.rival = 0;
  s.stunUntil[recipient] = s.time + style.duration;
  return emit(s, {
    type: "knockout",
    side: recipient === "player" ? "rival" : "player",
    recipient,
    attack: s.knockout.attack,
    power: s.knockout.power,
    preview,
    text: "K.O.!",
  });
}
export function command(s: StudyState, c: StudyCommand): StudyEvent[] {
  if (c.type === "encounter") {
    if (
      !(c.id in OPPONENTS) ||
      (c.difficulty !== undefined && !isDifficulty(c.difficulty)) ||
      s.phase === "sparring" ||
      s.phase === "paused"
    )
      return [];
    Object.assign(
      s,
      createStudy(
        s.training,
        s.spacing.initialSeed,
        c.id,
        c.campaign ?? s.campaign,
        c.difficulty ?? s.difficulty,
      ),
    );
    return [];
  }
  if (c.type === "reset") {
    Object.assign(
      s,
      createStudy(
        s.training,
        s.spacing.initialSeed,
        s.opponent.id,
        s.campaign,
        s.difficulty,
      ),
    );
    return [];
  }
  if (c.type === "retry") {
    if (s.phase !== "victory" && s.phase !== "loss") return [];
    const history = s.knockouts,
      seed = s.spacing.initialSeed;
    Object.assign(
      s,
      createStudy(
        s.training,
        s.spacing.initialSeed,
        s.opponent.id,
        s.campaign,
        s.difficulty,
      ),
    );
    s.spacing.random = (seed + history * 7919) >>> 0;
    s.knockouts = history;
    s.phase = "sparring";
    return [];
  }
  if (c.type === "spacing-lab") {
    if (!s.training || s.knockout || s.phase === "paused") return [];
    const seed = s.spacing.initialSeed;
    Object.assign(s, createStudy(true, seed));
    s.spacing = createSpacing(c.enabled, seed, c.enabled);
    s.phase = "sparring";
    return [];
  }
  if (c.type === "scenario-lab") {
    if (!s.training || s.knockout || s.phase === "paused") return [];
    const seed = s.spacing.initialSeed,
      scenario = SCENARIOS[c.scenario];
    Object.assign(s, createStudy(true, seed));
    s.spacing = createSpacing(true, seed, false, scenario.distance);
    s.spacing.rehearsal = c.scenario;
    s.spacing.guard = s.spacing.guardNext = scenario.guard;
    s.selection.attack = scenario.attack;
    s.phase = "sparring";
    return [];
  }
  if (c.type === "preview-knockout") {
    if (!s.training || (s.phase !== "ready" && s.phase !== "sparring"))
      return [];
    s.phase = "sparring";
    return [beginKnockout(s, c.recipient, true, c.variant)];
  }
  if (c.type === "start" && s.phase === "ready") {
    s.phase = "sparring";
    return [];
  }
  if (c.type === "pause" && s.phase === "sparring") {
    s.phase = "paused";
    return [];
  }
  if (c.type === "resume" && s.phase === "paused") {
    s.phase = "sparring";
    return [];
  }
  // Explicit laboratory input uses the same event adapter, never changes fight damage.
  if (c.type === "preview-reaction") {
    if (
      !s.training ||
      s.knockout ||
      (s.phase !== "ready" && s.phase !== "sparring")
    )
      return [];
    s.phase = "sparring";
    s.playerStrike = s.rivalStrike = null;
    const stunFor = c.outcome === "counter" ? 1.65 : 0;
    s.stunUntil[c.recipient] = s.time + stunFor;
    return [
      emit(s, {
        type: "impact",
        side: c.recipient === "player" ? "rival" : "player",
        recipient: c.recipient,
        attack: s.selection.attack,
        outcome: c.outcome,
        power: s.selection.power,
        stunFor,
        text:
          c.outcome === "counter"
            ? "STUNNED!"
            : c.outcome === "block"
              ? "GUARD"
              : c.outcome === "whiff"
                ? "MISSED"
                : "POW!",
      }),
    ];
  }
  if (c.type === "select" || c.type === "turn") {
    if (s.knockout || s.phase === "victory" || s.phase === "loss") return [];
    const wheel = c.wheel;
    const current =
      wheel === "attack"
        ? ATTACKS.indexOf(s.selection.attack)
        : wheel === "stance"
          ? STANCES.indexOf(s.selection.stance)
          : s.selection.power - 1;
    const index = wrap(c.type === "select" ? c.index : current + c.delta, 4);
    if (wheel === "attack") s.selection.attack = ATTACKS[index];
    if (wheel === "power") s.selection.power = index + 1;
    if (wheel === "stance") {
      s.selection.stance = STANCES[index];
      if (s.selection.stance === "super") {
        if (
          s.superCharge >= 100 &&
          s.superUntil <= s.time &&
          s.phase === "sparring"
        ) {
          s.superUntil = s.time + 8;
          s.superCharge = 0;
          s.stance = "super";
          return [
            emit(s, {
              type: "notice",
              side: "player",
              power: 0,
              text: "SUPER ACTIVE",
            }),
          ];
        }
        if (s.superUntil > s.time) s.stance = "super";
        else
          return [
            emit(s, {
              type: "notice",
              side: "player",
              power: 0,
              text: "BUILD YOUR SUPER",
            }),
          ];
      } else {
        if (
          s.stance !== s.selection.stance &&
          s.selection.stance === "defensive"
        )
          s.lastDefence = s.time;
        s.stance = s.selection.stance;
      }
    }
    return [];
  }
  if (
    c.type !== "punch" ||
    s.phase !== "sparring" ||
    s.playerStrike ||
    s.knockout ||
    s.stunUntil.player > s.time
  )
    return [];
  const cost = 7 + s.selection.power * 5;
  if (s.stamina < cost)
    return [
      emit(s, {
        type: "notice",
        side: "player",
        power: 0,
        text: "CATCH YOUR BREATH",
      }),
    ];
  s.stamina -= cost;
  const outcome =
    s.training && !s.spacing.enabled
      ? "hit"
      : playerOutcome(s, s.selection.attack);
  const assessment = assessPlayer(s, { ...s.selection, stance: s.stance });
  s.spacing.player.vx = s.spacing.player.vz = 0;
  s.playerStrike = {
    attack: s.selection.attack,
    stance: s.stance,
    power: s.selection.power,
    variant: s.punches % 3,
    started: s.time,
    duration: strikeDuration(
      s.selection.attack,
      s.selection.power,
      s.stance,
      s.punches % 3,
    ),
    contactAt: 0.19 + (s.selection.power - 1) * 0.035,
    resolved: false,
    outcome,
    assessment,
    reach: PUNCH_REACH[s.selection.attack],
    distanceAtStart: gap(s.spacing),
  };
  if (s.spacing.enabled)
    s.playerStrike.contact = commitContact(s, "player", s.playerStrike);
  s.punches++;
  return [
    emit(s, {
      type: "strike",
      side: "player",
      power: s.selection.power,
      text: s.selection.attack.toUpperCase(),
    }),
  ];
}
export function step(s: StudyState, dt: number): StudyEvent[] {
  if (s.phase !== "sparring") return [];
  if (s.knockout) {
    s.time += dt;
    const k = s.knockout,
      style = knockoutStyle(k.variant),
      events: StudyEvent[] = [];
    while (
      k.nextImpact < style.impacts.length &&
      s.time - k.started + 1e-9 >= style.impacts[k.nextImpact]
    ) {
      k.nextImpact++;
      events.push(
        emit(s, {
          type: "fall-impact",
          side: k.recipient === "player" ? "rival" : "player",
          recipient: k.recipient,
          power: k.power,
          text: style.word,
        }),
      );
    }
    if (!k.preview && s.time - k.started + 1e-9 >= k.duration)
      s.phase = k.recipient === "rival" ? "victory" : "loss";
    return events;
  }
  // Also handle exhausted health supplied by a deterministic combat fixture.
  if (s.rivalHealth <= 0 || s.playerHealth <= 0)
    return [beginKnockout(s, s.rivalHealth <= 0 ? "rival" : "player")];
  if (s.hitStop > 0) {
    s.hitStop = Math.max(0, s.hitStop - dt);
    return [];
  }
  s.time += dt;
  const events: StudyEvent[] = [];
  s.stamina = s.training
    ? 100
    : Math.min(
        100,
        s.stamina +
          dt *
            (s.playerStrike
              ? 5
              : s.stance === "neutral"
                ? 17
                : s.stance === "offensive" || s.stance === "super"
                  ? 12
                  : 14),
      );
  if (s.training) s.superCharge = 100;
  if (s.superUntil > 0 && s.time >= s.superUntil) {
    s.superUntil = 0;
    if (s.stance === "super") s.stance = "neutral";
  }
  if (
    s.opponent.feint &&
    s.time - s.opponent.feint.started >= s.opponent.feint.duration
  )
    s.opponent.feint = null;
  observeOpponent(s);
  advanceSpacing(s, dt);
  if (
    !s.training &&
    s.time >= s.nextRival &&
    !s.rivalStrike &&
    !s.opponent.feint &&
    s.staggerUntil <= s.time &&
    gap(s.spacing) <= 1.5 &&
    s.spacing.rivalStamina >= 17
  ) {
    const plan = chooseOpponentAction(s, () => spacingRandom(s.spacing));
    const attack = plan.attack,
      index = ATTACKS.indexOf(attack);
    if (plan.feint) {
      s.spacing.rivalStamina -= 4;
      s.opponent.awareness.busyUntil = s.time + 0.95;
      s.opponent.feints++;
      s.opponent.feint = {
        attack,
        stance: "neutral",
        power: 1,
        variant: index % 3,
        started: s.time,
        duration: 0.6,
        contactAt: 0.8,
        resolved: false,
        outcome: "whiff",
      };
      s.nextRival = s.time + 0.95 + spacingRandom(s.spacing) * 0.3;
    } else {
      s.spacing.rivalStamina -= 7 + plan.power * 5;
      s.spacing.rival.vx = s.spacing.rival.vz = 0;
      s.rivalStrike = {
        attack,
        stance: s.opponent.id === "brick" ? "offensive" : "neutral",
        power: plan.power,
        variant: s.opponent.thrown % 3,
        started: s.time,
        duration: plan.windup + plan.recovery,
        contactAt: plan.windup,
        resolved: false,
        outcome: gap(s.spacing) <= PUNCH_REACH[attack] ? "hit" : "whiff",
        reach: PUNCH_REACH[attack],
        distanceAtStart: gap(s.spacing),
      };
      if (s.spacing.enabled)
        s.rivalStrike.contact = commitContact(s, "rival", s.rivalStrike);
      recordOpponentAttack(s, s.rivalStrike);
      s.nextRival = nextOpponentBeat(s, s.rivalStrike, () =>
        spacingRandom(s.spacing),
      );
      events.push(
        emit(s, {
          type: "strike",
          side: "rival",
          power: plan.power,
          text: attack.toUpperCase(),
        }),
      );
    }
  }

  const a = s.playerStrike;
  if (a && !a.resolved && s.time - a.started >= a.contactAt) {
    a.resolved = true;
    const assessment = assessPlayer(s, a);
    const ranged = resolveRange(s.spacing, a);
    a.outcome =
      ranged === "whiff"
        ? "whiff"
        : s.training && !s.spacing.enabled
          ? "hit"
          : assessment.outcome;
    if (s.spacing.enabled)
      a.outcome = applyContact(a, resolveContact(s, "player", a, a.outcome));
    a.assessment = {
      ...assessment,
      outcome: a.outcome,
      damage:
        a.outcome === "whiff" || a.outcome === "block" ? 0 : assessment.damage,
    };
    let stunFor = 0;
    if (a.outcome === "hit" || a.outcome === "counter") {
      s.rivalHealth = Math.max(
        0,
        s.rivalHealth - (s.training ? 0 : a.assessment.damage),
      );
      s.superCharge = Math.min(
        100,
        s.superCharge + (a.outcome === "counter" ? 24 : 16),
      );
      if (
        (a.outcome === "counter" || a.power === 4) &&
        s.time >= s.staggerReadyAt.rival
      ) {
        stunFor = 1.65;
        s.staggerReadyAt.rival = s.time + 4.8;
        s.stunUntil.rival = s.time + 1.65;
        s.staggerUntil = s.time + 1.65;
        s.rivalStrike = null;
        s.opponent.feint = null;
      }
      s.hitStop = a.power >= 3 ? 0.04 : 0;
    }
    const words = {
      hit: ["THWACK!", "KRAK!", "POW!"],
      block: ["BLOCKED", "GUARD", "BLOCKED"],
      whiff: ["MISS!", "MISS!", "MISS!"],
      counter: ["COUNTER!", "KRAK!", "COUNTER!"],
    };
    events.push(
      emit(s, {
        type: "impact",
        side: "player",
        recipient: "rival",
        attack: a.attack,
        damage: s.training ? 0 : a.assessment.damage,
        reason:
          a.outcome === "whiff"
            ? ranged === "whiff"
              ? "Outside reach"
              : "Evaded the line"
            : a.assessment.reason,
        missReason:
          a.outcome === "whiff"
            ? a.distanceAtStart! > a.reach!
              ? "out-of-reach"
              : ranged === "whiff"
                ? "moved-away"
                : "evaded"
            : undefined,
        stunFor,
        outcome: a.outcome,
        power: a.power,
        text: words[a.outcome][a.variant],
      }),
    );
    if (a.outcome === "block") s.fightStats.blocked++;
    else if (a.outcome === "whiff") s.fightStats.missed++;
    else s.fightStats.landed++;
    recordExchange(s, "player", a);
  }
  if (s.rivalHealth <= 0) {
    events.push(beginKnockout(s, "rival"));
    return events;
  }
  const b = s.rivalStrike;
  if (b && !b.resolved && s.time - b.started >= b.contactAt) {
    b.resolved = true;
    const missed = resolveRange(s.spacing, b) === "whiff";
    const perfect =
      !missed && s.stance === "defensive" && s.time - s.lastDefence < 0.95;
    const assessment = evaluatePunch(punchContext(s, "rival", b));
    const guarded = s.stance === "defensive" && assessment.outcome === "block";
    const caught =
      !missed &&
      !guarded &&
      !perfect &&
      !!s.playerStrike &&
      !s.playerStrike.resolved &&
      s.playerStrike.power >= 3;
    b.outcome = missed
      ? "whiff"
      : guarded || perfect
        ? "block"
        : caught
          ? "counter"
          : assessment.outcome;
    if (s.spacing.enabled)
      b.outcome = applyContact(b, resolveContact(s, "rival", b, b.outcome));
    const missedContact = b.outcome === "whiff";
    const stunning =
      !missedContact &&
      b.outcome === "counter" &&
      s.time >= s.staggerReadyAt.player;
    if (stunning) {
      s.staggerReadyAt.player = s.time + 4.8;
      s.stunUntil.player = s.time + 1.65;
      s.playerStrike = null;
    }
    if (perfect && !missedContact) {
      s.superCharge = Math.min(100, s.superCharge + 26);
      if (s.time >= s.staggerReadyAt.rival) {
        s.staggerUntil = s.time + 1.65;
        s.staggerReadyAt.rival = s.time + 4.8;
      }
    }
    const damage =
      missedContact || perfect
        ? 0
        : guarded
          ? 3
          : Math.max(
              1,
              Math.round(
                assessment.damage *
                  (caught ? 1.2 : s.stance === "defensive" ? 0.65 : 1),
              ),
            );
    if (damage) {
      s.playerHealth = Math.max(0, s.playerHealth - damage);
      s.fightStats.received++;
    }
    b.assessment = { ...assessment, outcome: b.outcome, damage };
    events.push(
      emit(s, {
        type: "impact",
        side: "rival",
        recipient: "player",
        attack: b.attack,
        damage,
        reason: perfect
          ? "Timed defence"
          : guarded
            ? "Centre covered"
            : assessment.reason,
        missReason: missedContact
          ? b.distanceAtStart! > b.reach!
            ? "out-of-reach"
            : missed
              ? "moved-away"
              : "evaded"
          : undefined,
        stunFor: stunning ? 1.65 : 0,
        outcome: b.outcome,
        power: b.power,
        text: missed
          ? "MISS!"
          : perfect
            ? "PERFECT GUARD"
            : guarded
              ? "GUARD"
              : caught
                ? "CAUGHT!"
                : "OOF!",
      }),
    );
    recordExchange(s, "rival", b);
  }
  if (a && s.time - a.started >= a.duration) s.playerStrike = null;
  if (b && s.time - b.started >= b.duration) s.rivalStrike = null;
  if (s.playerHealth <= 0) events.push(beginKnockout(s, "player"));
  return events;
}
export function snapshot(s: StudyState): StudySnapshot {
  return {
    training: s.training,
    difficulty: s.difficulty,
    opponent: {
      id: s.opponent.id,
      name: OPPONENTS[s.opponent.id].name,
      style: OPPONENTS[s.opponent.id].style,
      feinting: !!s.opponent.feint,
    },
    spacing: spacingRead(s),
    opportunity: opportunityRead(s),
    scenario: s.spacing.rehearsal,
    phase: s.phase,
    selection: { ...s.selection },
    stance: s.stance,
    playerHealth: s.playerHealth,
    rivalMaxHealth: s.rivalMaxHealth,
    campaign: s.campaign,
    fightStats: { ...s.fightStats },
    rivalHealth: s.rivalHealth,
    stamina: Math.round(s.stamina),
    superCharge: Math.round(s.superCharge),
    superSeconds: Math.max(0, s.superUntil - s.time),
    recover: !!s.playerStrike || !!s.knockout || s.stunUntil.player > s.time,
    knockout: s.knockout ? { ...s.knockout } : null,
    technique: s.playerStrike
      ? {
          attack: s.playerStrike.attack,
          stance: s.playerStrike.stance,
          power: s.playerStrike.power,
          variant: s.playerStrike.variant,
        }
      : null,
    event: s.lastEvent,
    punches: s.punches,
    cue: s.knockout
      ? s.knockout.preview
        ? "KNOCKOUT REHEARSAL — RESET TO BOX"
        : "KNOCKOUT!"
      : s.stunUntil.player > s.time
        ? "STUNNED — FIND YOUR FEET"
        : s.staggerUntil > s.time
          ? "OPENING — MAKE IT COUNT"
          : s.rivalStrike && !s.rivalStrike.resolved
            ? "INCOMING " + s.rivalStrike.attack.toUpperCase()
            : s.opponent.feint
              ? "RIVAL TESTING YOUR GUARD"
              : s.stamina < 22
                ? "TAKE A BREATH"
                : s.superCharge >= 100
                  ? "SUPER READY"
                  : "READ THE GUARD",
  };
}
