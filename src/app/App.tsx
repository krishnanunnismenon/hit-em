import { useControllerConnection } from "../features/boxing/hooks/useControllerConnection";
import { OPPONENTS } from "../features/boxing/domain/opponent";
import { DifficultyPicker } from "../features/boxing/components/DifficultyPicker";
import type { Difficulty } from "../features/boxing/domain/difficulty";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { StudyController } from "../features/boxing/application/StudyController";
import { FightAudio } from "../features/boxing/audio/FightAudio";
import { AudioSettings } from "../features/boxing/components/AudioSettings";
import { RingViewport } from "../features/boxing/components/RingViewport";
import { ControlRail } from "../features/boxing/components/ControlRail";
import { ImpactWord } from "../features/boxing/components/ImpactWord";
import { Icon } from "../features/boxing/components/Icons";
import { useKeyboardControls } from "../features/boxing/hooks/useKeyboardControls";
import type { SceneStats } from "../features/boxing/scene/BoxingScene";
import {
  poseProbeAge,
  readPoseProbe,
} from "../features/boxing/domain/poseProbe";
import { RangeRead } from "../features/boxing/components/RangeRead";
import { TechniqueLab } from "../features/boxing/components/TechniqueLab";
import {
  BoutIntro,
  BoutResult,
} from "../features/boxing/components/BoutPresentation";
import {
  readProgress,
  readPreferences,
  completeBout,
  currentRival,
  loadLocal,
  saveLocal,
  progressKey,
  SETTINGS_KEY,
  ROSTER,
} from "../features/boxing/application/Campaign";
import "../styles/app.css";
export function App() {
  const [preferences] = useState(() =>
    readPreferences(loadLocal(SETTINGS_KEY)),
  );
  const [progress, setProgress] = useState(() =>
    readProgress(loadLocal(progressKey(preferences.difficulty))),
  );
  const [poseProbe] = useState(() =>
    import.meta.env.DEV ? readPoseProbe(window.location.search) : null,
  );
  const [lab] = useState(
    () =>
      new URLSearchParams(window.location.search).get("practice") === "1" ||
      (import.meta.env.DEV &&
        new URLSearchParams(window.location.search).get("motionLab") === "1"),
  );
  const [sequencing, setSequencing] = useState(false);
  const [controller] = useState(() => {
    const value = new StudyController(lab || !!poseProbe);
    if (!lab && !poseProbe)
      value.dispatch({
        type: "encounter",
        id: currentRival(progress),
        campaign: true,
        difficulty: preferences.difficulty,
      });
    if (poseProbe) {
      value.dispatch({
        type: "select",
        wheel: "stance",
        index: ["defensive", "offensive", "neutral", "super"].indexOf(
          poseProbe.stance ?? "neutral",
        ),
      });
      value.dispatch({
        type: "select",
        wheel: "attack",
        index: ["jab", "cross", "hook", "uppercut"].indexOf(poseProbe.attack),
      });
      value.dispatch({
        type: "select",
        wheel: "power",
        index: poseProbe.power - 1,
      });
    }
    return value;
  });
  const [audio] = useState(() => new FightAudio());
  const audioStatus = useSyncExternalStore(audio.subscribe, audio.getSnapshot);
  const [mix, setMix] = useState(preferences.audio);
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const hardware = useControllerConnection(controller, state);
  const [ready, setReady] = useState(false),
    [sound, setSound] = useState(preferences.sound),
    [settings, setSettings] = useState(false),
    [stats, setStats] = useState<SceneStats | null>(null);
  const [motionPreference, setMotionPreference] = useState(preferences.reduced);
  const [reduced, setReduced] = useState(
    () =>
      preferences.reduced ??
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const impactAnchor = useRef<HTMLDivElement>(null);
  const contact = useCallback((x: number, y: number) => {
    if (impactAnchor.current) {
      impactAnchor.current.style.left = x + "px";
      impactAnchor.current.style.top = y + "px";
    }
  }, []);
  const resumeAfterSettings = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null),
    settingsButton = useRef<HTMLButtonElement>(null);
  const punch = useCallback(() => {
    if (sound) void audio.unlock().catch(() => {});
    controller.dispatch({ type: "punch" });
  }, [audio, controller, sound]);
  useKeyboardControls(
    controller,
    punch,
    !poseProbe &&
      !sequencing &&
      !state.knockout &&
      !(state.phase === "ready" && progress.cleared === 3 && !lab),
  );
  useEffect(() => {
    audio.update(controller.state);
    const unsubscribe = controller.subscribe(() =>
      audio.update(controller.state),
    );
    const events = controller.onEvent((e) => audio.play(e, controller.state));
    const visibility = () => audio.setHidden(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => {
      unsubscribe();
      events();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [controller, audio]);
  useEffect(() => {
    if (!sound) return;
    const unlock = () => {
      if (!audio.getSnapshot().unlocked) void audio.unlock().catch(() => {});
    };
    document.addEventListener("pointerdown", unlock, { capture: true });
    document.addEventListener("keydown", unlock, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", unlock, { capture: true });
      document.removeEventListener("keydown", unlock, { capture: true });
    };
  }, [audio, sound]);
  useEffect(() => {
    audio.configure(sound, mix);
    saveLocal(SETTINGS_KEY, {
      version: 1,
      sound,
      audio: mix,
      reduced: motionPreference,
      difficulty: lab || poseProbe ? preferences.difficulty : state.difficulty,
    });
  }, [
    sound,
    mix,
    motionPreference,
    audio,
    state.difficulty,
    lab,
    poseProbe,
    preferences.difficulty,
  ]);
  useEffect(() => {
    if (state.phase !== "victory" || lab || poseProbe) return;
    setProgress((previous) => {
      const next = completeBout(previous, state.opponent.id);
      saveLocal(progressKey(state.difficulty), next);
      return next;
    });
  }, [state.phase, state.opponent.id, state.difficulty, lab, poseProbe]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = (e: MediaQueryListEvent) => {
      if (motionPreference === null) setReduced(e.matches);
    };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, [motionPreference]);
  useEffect(() => {
    if (settings) {
      resumeAfterSettings.current = controller.state.phase === "sparring";
      controller.dispatch({ type: "pause" });
      dialog.current?.showModal();
    } else if (dialog.current?.open) {
      dialog.current.close();
      settingsButton.current?.focus();
      if (resumeAfterSettings.current) controller.dispatch({ type: "resume" });
    }
  }, [settings, controller]);
  useEffect(() => () => audio.dispose(), [audio]);
  const start = () => {
    if (sound) void audio.unlock().catch(() => {});
    controller.dispatch({ type: "start" });
  };
  const restartCampaign = () => {
    const next = { version: 1 as const, cleared: 0 };
    setProgress(next);
    saveLocal(progressKey(state.difficulty), next);
    controller.dispatch({ type: "reset" });
    controller.dispatch({ type: "encounter", id: "quickstep", campaign: true });
  };
  const resetBout = () => {
    setSequencing(false);
    controller.dispatch({ type: "reset" });
    if (!lab && !poseProbe)
      controller.dispatch({
        type: "encounter",
        id: currentRival(progress),
        campaign: true,
      });
  };
  const nextBout = () => {
    controller.dispatch({
      type: "encounter",
      id: currentRival(progress),
      campaign: true,
    });
  };
  const changeDifficulty = (difficulty: Difficulty) => {
    if (
      lab ||
      poseProbe ||
      state.phase !== "ready" ||
      state.difficulty === difficulty
    )
      return;
    const next = readProgress(loadLocal(progressKey(difficulty)));
    setProgress(next);
    controller.dispatch({
      type: "encounter",
      id: currentRival(next),
      campaign: true,
      difficulty,
    });
  };
  const enableSound = (enabled: boolean) => {
    audio.configure(enabled, mix);
    setSound(enabled);
    if (enabled) void audio.unlock().catch(() => setSound(false));
  };
  const active = state.phase === "sparring";
  const retry = () => {
    controller.dispatch({ type: "retry" });
  };
  return (
    <main
      className={
        "boxing-app" +
        (reduced ? " reduced-motion" : "") +
        (lab ? " in-technique-lab" : "")
      }
      data-phase={state.phase}
    >
      <section className="fight-stage" aria-label="Underground boxing ring">
        <RingViewport
          key={state.opponent.id}
          controller={controller}
          reduced={reduced}
          onReady={setReady}
          onStats={setStats}
          onContact={contact}
        />
        <header className="fight-hud">
          <div className="fighter-meter player-meter">
            <div className="fighter-name">
              <span>You</span>
              <small>Blue corner</small>
            </div>
            <Health
              value={state.playerHealth}
              label="Your health"
              color="blue"
            />
          </div>
          <div className="round-mark">
            <span>ROUND</span>
            <strong>
              {lab
                ? "—"
                : String(ROSTER.indexOf(state.opponent.id) + 1).padStart(
                    2,
                    "0",
                  )}
            </strong>
            <small>
              {state.knockout
                ? "KNOCKOUT"
                : lab
                  ? "PRACTICE"
                  : state.difficulty === "ring-sense"
                    ? "RING SENSE"
                    : "OF THREE"}
            </small>
          </div>
          <div className="fighter-meter rival-meter">
            <div className="fighter-name">
              <span>{OPPONENTS[state.opponent.id].shortName}</span>
              <small>Red corner</small>
            </div>
            <Health
              value={state.rivalHealth}
              max={state.rivalMaxHealth}
              label="Rival health"
              color="red"
            />
          </div>
        </header>
        <div className="stage-tools">
          <button
            ref={settingsButton}
            className="icon-button"
            aria-label="Open settings"
            onClick={() => setSettings(true)}
          >
            <Icon name="settings" />
          </button>
          <button
            className="icon-button"
            aria-label={
              sound && audioStatus.unlocked ? "Mute sound" : "Enable sound"
            }
            aria-pressed={sound && audioStatus.unlocked}
            onClick={() => enableSound(!(sound && audioStatus.unlocked))}
          >
            <Icon name={sound && audioStatus.unlocked ? "sound" : "mute"} />
          </button>
          <button
            className="icon-button"
            disabled={
              state.phase === "ready" ||
              state.phase === "victory" ||
              state.phase === "loss"
            }
            aria-label={active ? "Pause sparring" : "Resume sparring"}
            onClick={() =>
              controller.dispatch({ type: active ? "pause" : "resume" })
            }
          >
            <Icon name={active ? "pause" : "play"} />
          </button>
        </div>
        {active && (
          <div
            className={
              "fight-cue" + (state.superSeconds > 0 ? " super-cue" : "")
            }
            aria-live="polite"
          >
            {state.superSeconds > 0 ? "SUPER ACTIVE" : state.cue}
          </div>
        )}
        <ImpactWord ref={impactAnchor} event={state.event} reduced={reduced} />
        {state.phase === "ready" && !poseProbe && (
          <BoutIntro
            state={state}
            progress={progress}
            ready={ready}
            practice={lab}
            onStart={start}
            onRestart={restartCampaign}
            onDifficulty={changeDifficulty}
          />
        )}
        {state.phase === "paused" && !settings && (
          <div className="pause-shade">
            <div className="stage-message">
              <h1>
                TAKE A<br />
                BREATHER.
              </h1>
              <p>Your corner is waiting.</p>
              <button
                className="primary-button"
                onClick={() => controller.dispatch({ type: "resume" })}
              >
                <Icon name="play" />
                Back to the ring<kbd>P</kbd>
              </button>
              <button
                className="text-button"
                onClick={() => {
                  resetBout();
                }}
              >
                Reset session
              </button>
            </div>
          </div>
        )}
        {(state.phase === "victory" || state.phase === "loss") && (
          <BoutResult
            state={state}
            final={ROSTER.indexOf(state.opponent.id) === 2}
            onRetry={retry}
            onNext={nextBout}
            onRestart={restartCampaign}
          />
        )}
        <div className="stage-caption">
          <span className="live-dot" aria-hidden="true" />
          {!ready
            ? "Loading ring"
            : poseProbe
              ? `Pose fixture · ${poseProbe.attack} · ${poseProbe.stance ?? "neutral"} · ${poseProbe.phase} · ${poseProbe.outcome} · power ${poseProbe.power} · ${poseProbeAge(poseProbe).toFixed(3)} s`
              : lab
                ? state.spacing.enabled
                  ? state.scenario
                    ? "Opening study · no damage"
                    : "Spacing rehearsal · no damage"
                  : "Technique lab · no damage · Super available"
                : `${state.opponent.style} · bout ${ROSTER.indexOf(state.opponent.id) + 1} of 3`}
        </div>
      </section>
      <RangeRead state={state} />
      <ControlRail
        state={state}
        dispatch={controller.dispatch}
        onPunch={punch}
        disabled={!ready || !!poseProbe || sequencing || !!state.knockout}
      />
      {lab && (
        <TechniqueLab
          controller={controller}
          ready={ready}
          sequencing={sequencing}
          setSequencing={setSequencing}
        />
      )}
      <footer className="session-footer">
        <p>
          {state.phase === "ready"
            ? "Set your attack, stance and power. Press Space or tap Punch."
            : "Read the gap and the guard. Make it count."}
        </p>
        <div>
          <span className="keyboard-hint">Space to punch · P to pause</span>
          <button
            className="footer-button"
            onClick={() => {
              resetBout();
            }}
          >
            <Icon name="reset" width="14" height="14" />
            Reset
          </button>
        </div>
      </footer>
      <div className="sr-only" role="status" aria-live="polite">
        {state.event?.type !== "strike" ? state.event?.text : ""}
      </div>
      <dialog
        ref={dialog}
        className="settings-dialog"
        onCancel={(e) => {
          e.preventDefault();
          setSettings(false);
        }}
      >
        <div className="dialog-heading">
          <h2>Your corner</h2>
          <button
            className="icon-button"
            aria-label="Close settings"
            onClick={() => setSettings(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="dialog-intro">
          Three bouts in the basement. Read the guard, manage your stamina and
          choose when to commit.
        </p>
        {!lab && !poseProbe && (
          <DifficultyPicker
            value={state.difficulty}
            onChange={changeDifficulty}
            disabled={state.phase !== "ready"}
          />
        )}
        <label className="setting-row">
          <span>
            Reduced motion<small>Gentler feedback. No camera shake.</small>
          </span>
          <input
            type="checkbox"
            checked={reduced}
            onChange={(e) => {
              setReduced(e.target.checked);
              setMotionPreference(e.target.checked);
            }}
          />
        </label>
        <AudioSettings
          audio={audio}
          status={audioStatus}
          enabled={sound}
          mix={mix}
          onEnable={enableSound}
          onMix={setMix}
          open={settings}
          rival={state.opponent.id}
        />
        <div className="controls-guide">
          <h3>Keyboard controls</h3>
          <p>
            <span>Attack</span>
            <kbd>A / D</kbd>
          </p>
          <p>
            <span>Stance</span>
            <kbd>J / L</kbd>
          </p>
          <p>
            <span>Power</span>
            <kbd>← / →</kbd>
          </p>
          <p>
            <span>Punch</span>
            <kbd>Space</kbd>
          </p>
          <p>
            <span>Pause / resume</span>
            <kbd>P / Esc</kbd>
          </p>
        </div>
        {!lab && (
          <p className="lab-entry">
            <a href="/?practice=1">
              Open practice — compare punches, footwork and falls
            </a>
          </p>
        )}
        <div className="controller-connection">
          <h3>Physical controls</h3>
          <p role="status">
            {hardware.simulated
              ? "Simulated controller · no ESP32 connected"
              : hardware.message}
          </p>
          <p>
            Power switch: G4 and GND. Connect after wiring and uploading the
            boxing firmware.
          </p>
          <button
            className="footer-button"
            onClick={
              hardware.linked
                ? hardware.disconnect
                : () => void hardware.connect()
            }
          >
            {hardware.linked ? "Disconnect controller" : "Connect controller"}
          </button>
          {hardware.simulated && (
            <div
              className="simulation-buttons"
              role="group"
              aria-label="Simulated controller"
            >
              <button
                onClick={() =>
                  hardware.simulate({ type: "turn", wheel: "attack", delta: 1 })
                }
              >
                Turn Attack
              </button>
              <button
                onClick={() =>
                  hardware.simulate({ type: "turn", wheel: "stance", delta: 1 })
                }
              >
                Turn Stance
              </button>
              <button
                onClick={() =>
                  hardware.simulate({ type: "turn", wheel: "power", delta: 1 })
                }
              >
                Turn Power
              </button>
              <button onClick={() => hardware.simulate({ type: "punch" })}>
                Press Power
              </button>
            </div>
          )}
        </div>
        <details className="performance-details">
          <summary>Motion-study measurements</summary>
          <p>
            {stats
              ? `${stats.fps} fps · p95 ${stats.p95} ms · ${stats.drawCalls} draws · ${stats.triangles.toLocaleString()} triangles · ${stats.samples} frames / ${stats.sampledSeconds}s · input p95 ${stats.inputP95} ms (${stats.inputSamples} commands)`
              : "Start sparring to collect frame samples."}
          </p>
          <p>
            Input timing measures a browser command to render submission, not
            USB or display latency. Physical controls follow the design review.
          </p>
        </details>
        <button
          className="primary-button"
          onClick={() => {
            setSettings(false);
          }}
        >
          Done
        </button>
      </dialog>
    </main>
  );
}
function Health({
  value,
  label,
  color,
  max = 100,
}: {
  value: number;
  label: string;
  color: string;
  max?: number;
}) {
  return (
    <div
      className={"health-track " + color}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <span style={{ transform: `scaleX(${value / max})` }} />
      <small>
        {value}
        <span> / {max}</span>
      </small>
    </div>
  );
}
