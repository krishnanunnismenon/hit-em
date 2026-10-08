import { useEffect, useState, useSyncExternalStore } from "react";
import type { StudyController } from "../application/StudyController";
import { ATTACKS, STANCES } from "../../../../shared/input";
import { footworkPlan } from "../domain/footwork";
import { RingRecorder } from "./RingRecorder";
import type { FighterSide, Outcome } from "../domain/types";
import { KNOCKOUT_STYLES, knockoutStyle } from "../domain/knockout";
import { SCENARIOS, type ScenarioId } from "../domain/tactics";
import { TECHNIQUE_NAMES } from "../domain/technique";

/** Explicit opt-in development rehearsal, using the same commands, engine and physical rig as sparring. */
export function TechniqueLab({
  controller,
  ready,
  sequencing,
  setSequencing,
}: {
  controller: StudyController;
  ready: boolean;
  sequencing: boolean;
  setSequencing: (value: boolean) => void;
}) {
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const [slow, setSlow] = useState(false),
    [count, setCount] = useState(0),
    [scope, setScope] = useState<"all" | "current" | "falls">("all"),
    [comparedSetup, setComparedSetup] = useState(""),
    [recipient, setRecipient] = useState<FighterSide>("rival"),
    [outcome, setOutcome] = useState<Outcome>("hit"),
    [fall, setFall] = useState(-1);
  useEffect(() => {
    controller.setPlaybackRate(slow ? 0.5 : 1);
  }, [controller, slow]);
  useEffect(() => {
    if (!sequencing) return;
    const chosen = { ...controller.state.selection };
    const total = scope === "falls" ? 6 : scope === "all" ? 192 : 3;
    let next = 0,
      waitUntil = 0;
    controller.dispatch({ type: "reset" });
    controller.dispatch({ type: "start" });
    const timer = window.setInterval(() => {
      const s = controller.state;
      if (s.phase !== "sparring" || s.playerStrike || s.time < waitUntil)
        return;
      if (next >= total) {
        setSequencing(false);
        return;
      }
      if (scope === "falls") {
        controller.dispatch({
          type: "preview-knockout",
          recipient,
          variant: next,
        });
        waitUntil = s.time + knockoutStyle(next).duration + 0.55;
        next++;
        setCount(next);
        return;
      }
      const combination = next % 64;
      const attack =
          scope === "all" ? combination % 4 : ATTACKS.indexOf(chosen.attack),
        stance =
          scope === "all"
            ? Math.floor(combination / 16)
            : STANCES.indexOf(chosen.stance),
        power =
          scope === "all" ? Math.floor(combination / 4) % 4 : chosen.power - 1;
      controller.dispatch({ type: "select", wheel: "attack", index: attack });
      controller.dispatch({ type: "select", wheel: "stance", index: stance });
      controller.dispatch({ type: "select", wheel: "power", index: power });
      controller.dispatch({ type: "punch" });
      const accepted = controller.state.playerStrike;
      if (!accepted) return;
      waitUntil = s.time + accepted.duration + 0.45;
      next++;
      setCount(next);
    }, 80);
    return () => window.clearInterval(timer);
  }, [controller, sequencing, setSequencing, scope, recipient]);
  const technique = state.technique ?? {
    ...state.selection,
    stance: state.stance,
    variant: state.punches % 3,
  };
  const footwork = footworkPlan(
    technique.attack,
    technique.stance,
    technique.power,
    technique.variant,
  );
  const total = scope === "falls" ? 6 : scope === "all" ? 192 : 3;
  const setupKey = `${state.selection.attack}/${state.selection.stance}/${state.selection.power}`;
  const complete =
    count === total &&
    (scope === "falls" ? !!state.knockout : state.punches >= total) &&
    (scope !== "current" || comparedSetup === setupKey);
  const begin = (value: "all" | "current" | "falls") => {
    setComparedSetup(setupKey);
    setCount(0);
    setScope(value);
    setSequencing(true);
    document.querySelector(".fight-stage")?.scrollIntoView({ block: "start" });
  };
  return (
    <section className="technique-lab" aria-label="Technique lab">
      <div className="lab-techniques">
        <div>
          <strong>
            {state.knockout
              ? knockoutStyle(state.knockout.variant).name
              : TECHNIQUE_NAMES[technique.stance][technique.attack]}
          </strong>
          <span>
            {state.knockout
              ? `${state.knockout.recipient === "player" ? "You" : "Rival"} · knockout fall`
              : `${technique.stance} · power ${technique.power}`}
            {sequencing
              ? ` · ${count}/${total}`
              : complete
                ? ` · ${total}/${total} complete`
                : " · rehearsal"}
          </span>
          <span className="lab-footwork">
            {state.knockout ? (
              "Six falls. Each a little less dignified."
            ) : (
              <>
                {state.technique ? "Now" : "Next"}: {footwork.name} · style{" "}
                {technique.variant + 1}/3
              </>
            )}
          </span>
        </div>
        <div className="lab-actions">
          <label>
            <input
              type="checkbox"
              checked={slow}
              onChange={(e) => setSlow(e.target.checked)}
            />{" "}
            Half speed
          </label>
          <button
            disabled={!ready}
            onClick={() => (sequencing ? setSequencing(false) : begin("all"))}
          >
            {sequencing ? "Stop sequence" : "Play all 192"}
          </button>
          <button
            disabled={!ready || sequencing}
            onClick={() => begin("current")}
          >
            Try 3 footwork styles
          </button>
          <label>
            <input
              type="checkbox"
              checked={state.spacing.enabled && !state.scenario}
              disabled={
                !ready ||
                sequencing ||
                !!state.knockout ||
                state.phase === "paused" ||
                !!state.technique
              }
              onChange={(e) => {
                controller.dispatch({
                  type: "spacing-lab",
                  enabled: e.target.checked,
                });
                document
                  .querySelector(".fight-stage")
                  ?.scrollIntoView({ block: "start" });
              }}
            />
            Live spacing
          </label>
          <RingRecorder ready={ready} seconds={26} />
          <a href="/">Back to sparring</a>
        </div>
      </div>
      <div className="lab-reactions" role="group" aria-label="Opening studies">
        <label>
          Opening study{" "}
          <select
            aria-label="Opening study"
            value={state.scenario ?? (state.spacing.enabled ? "live" : "free")}
            disabled={
              !ready ||
              sequencing ||
              !!state.knockout ||
              state.phase === "paused" ||
              !!state.technique
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "free") controller.dispatch({ type: "reset" });
              else if (value === "live")
                controller.dispatch({ type: "spacing-lab", enabled: true });
              else
                controller.dispatch({
                  type: "scenario-lab",
                  scenario: value as ScenarioId,
                });
              document
                .querySelector(".fight-stage")
                ?.scrollIntoView({ block: "start" });
            }}
          >
            <option value="free">Free technique</option>
            <option value="live">Live spacing</option>
            {Object.entries(SCENARIOS).map(([key, scenario]) => (
              <option key={key} value={key}>
                {scenario.label}
              </option>
            ))}
          </select>
        </label>
        <small>
          {state.scenario === "recovery"
            ? "Held recovery window. Compare counters without damage."
            : state.scenario
              ? "Fixed situation. Compare punches and stances without damage."
              : "Study a guard opening, then try it in the moving fight."}
        </small>
      </div>
      <div
        className="lab-reactions"
        role="group"
        aria-label="Receiving reactions"
      >
        <span>Receiving reactions</span>
        <label>
          Boxer{" "}
          <select
            value={recipient}
            disabled={sequencing}
            onChange={(e) => setRecipient(e.target.value as FighterSide)}
          >
            <option value="rival">Rival</option>
            <option value="player">You</option>
          </select>
        </label>
        <label>
          Contact{" "}
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as Outcome)}
          >
            <option value="hit">Hit</option>
            <option value="block">Guard</option>
            <option value="counter">Stun</option>
            <option value="whiff">Miss</option>
          </select>
        </label>
        <button
          disabled={
            !ready || sequencing || state.phase === "paused" || !!state.knockout
          }
          onClick={() =>
            controller.dispatch({
              type: "preview-reaction",
              recipient,
              outcome,
            })
          }
        >
          Preview reaction
        </button>
        <small>Uses the selected punch and power. No damage.</small>
      </div>
      <div className="lab-reactions" role="group" aria-label="Knockout falls">
        <span>Knockout falls</span>
        <label>
          Fall
          <select
            value={fall}
            disabled={sequencing}
            onChange={(e) => setFall(Number(e.target.value))}
          >
            <option value={-1}>Next — escalating</option>
            {KNOCKOUT_STYLES.map((style, index) => (
              <option value={index} key={style.name}>
                {style.name}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={!ready || sequencing || state.phase === "paused"}
          onClick={() => {
            setCount(0);
            controller.dispatch({
              type: "preview-knockout",
              recipient,
              ...(fall >= 0 ? { variant: fall } : {}),
            });
            document
              .querySelector(".fight-stage")
              ?.scrollIntoView({ block: "start" });
          }}
        >
          Preview fall
        </button>
        <button disabled={!ready || sequencing} onClick={() => begin("falls")}>
          Play 6 falls
        </button>
        <small>Uses Boxer above. Reset to get back on your feet.</small>
      </div>
      <span className="sr-only">
        {ATTACKS.length} punches, {STANCES.length} stances, four power levels
        and three footwork styles: 192 combinations. Rehearsal has no opponent
        attacks or damage. Live spacing adds stance movement and reach-based
        misses.
      </span>
    </section>
  );
}
