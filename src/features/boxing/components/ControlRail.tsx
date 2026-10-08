import { ATTACKS, STANCES } from "../../../../shared/input";
import type { StudySnapshot, StudyCommand } from "../domain/types";
interface Props {
  state: StudySnapshot;
  dispatch: (command: StudyCommand) => void;
  onPunch: () => void;
  disabled: boolean;
}
const title = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
export function ControlRail({ state, dispatch, onPunch, disabled }: Props) {
  const wheels = [
    {
      name: "Attack",
      wheel: "attack" as const,
      options: [...ATTACKS],
      index: ATTACKS.indexOf(state.selection.attack),
      keys: "A / D",
    },
    {
      name: "Stance",
      wheel: "stance" as const,
      options: [...STANCES],
      index: STANCES.indexOf(state.selection.stance),
      keys: "J / L",
    },
    {
      name: "Power",
      wheel: "power" as const,
      options: ["1", "2", "3", "4"],
      index: state.selection.power - 1,
      keys: "← / →",
    },
  ];
  return (
    <section className="control-rail" aria-label="Boxing controls">
      {wheels.map((w) => (
        <div className={"wheel wheel-" + w.wheel} key={w.wheel}>
          <div className="wheel-title">
            <h2>{w.name}</h2>
            <span>{w.keys}</span>
          </div>
          <div className="wheel-body">
            <div className="dial-wrap">
              <button
                className={"dial" + (w.wheel === "power" ? " dial-punch" : "")}
                aria-label={
                  w.wheel === "power" ? "Punch" : `Next ${w.name.toLowerCase()}`
                }
                disabled={
                  disabled ||
                  (w.wheel === "power" &&
                    (state.phase !== "sparring" ||
                      state.recover ||
                      state.stamina < 7 + state.selection.power * 5))
                }
                onClick={() =>
                  w.wheel === "power"
                    ? onPunch()
                    : dispatch({ type: "turn", wheel: w.wheel, delta: 1 })
                }
              >
                <span className="dial-ticks" aria-hidden="true" />
                <span
                  className="dial-face"
                  style={{ transform: `rotate(${-40 + w.index * 80}deg)` }}
                >
                  <span className="dial-pointer" />
                </span>
              </button>
              {w.wheel === "power" ? (
                <span className="dial-action">
                  {state.recover
                    ? "Recovering"
                    : state.stamina < 7 + state.selection.power * 5
                      ? "Recover stamina"
                      : "Press to punch"}
                </span>
              ) : (
                <span className="dial-action">Turn to select</span>
              )}
            </div>
            <div
              className="wheel-options"
              role="group"
              aria-label={w.name + " selection"}
            >
              {w.options.map((option, index) => (
                <button
                  key={option}
                  className={w.index === index ? "selected" : ""}
                  aria-pressed={w.index === index}
                  disabled={disabled}
                  onClick={() =>
                    dispatch({ type: "select", wheel: w.wheel, index })
                  }
                >
                  <span className="option-mark" aria-hidden="true" />
                  {title(option)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div className="energy-panel">
        <Meter label="Stamina" value={state.stamina} color="green" />
        <Meter
          label={
            state.superSeconds > 0
              ? `Super · ${state.superSeconds.toFixed(1)}s`
              : "Super"
          }
          value={
            state.superSeconds > 0
              ? (state.superSeconds / 8) * 100
              : state.superCharge
          }
          color="yellow"
        />
        <span className="energy-note">
          {state.superCharge >= 100
            ? "Turn stance to Super"
            : state.superSeconds > 0
              ? "Make it count."
              : "Good timing builds power."}
        </span>
      </div>
    </section>
  );
}
function Meter({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="energy-meter">
      <div className="meter-label">
        <span>{label}</span>
        <span>
          {Math.round(value)}
          <small>%</small>
        </span>
      </div>
      <div
        className={"meter-track " + color}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        <span style={{ transform: `scaleX(${value / 100})` }} />
        <i aria-hidden="true" />
      </div>
    </div>
  );
}
