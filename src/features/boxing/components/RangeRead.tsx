import type { StudySnapshot } from "../domain/types";

/** A timing cue from the exact gameplay range, not a guessed rendered glove position. */
export function RangeRead({ state }: { state: StudySnapshot }) {
  if (!state.spacing.enabled || state.knockout) return null;
  const { distance, reach, inRange, intent, guard } = state.spacing;
  const point = Math.min(
    228,
    Math.max(12, 12 + ((distance - 1.1) / 1.65) * 216),
  );
  const threshold = 12 + ((reach - 1.1) / 1.65) * 216;
  const miss =
    state.event?.type === "impact" &&
    state.event.side === "player" &&
    state.event.outcome === "whiff";
  return (
    <section
      className={
        "range-read" +
        (inRange && !state.opportunity.blocked ? " in-range" : "")
      }
      aria-label="Punch timing"
    >
      <div className="range-words">
        <strong aria-live="polite">{state.opportunity.title}</strong>
        <span>
          {intent} · {guard}
        </span>
      </div>
      <svg className="range-gauge" viewBox="0 0 240 40" aria-hidden="true">
        <text x="12" y="10">
          YOU
        </text>
        <text x="228" y="10" textAnchor="end">
          RIVAL
        </text>
        <path d="M12 25h216" className="range-track" />
        <path d={`M12 25h${threshold - 12}`} className="reach-band" />
        <path d={`M${threshold} 17v16`} className="reach-limit" />
        <circle cx="12" cy="25" r="5" className="you-marker" />
        <circle cx={point} cy="25" r="6" className="rival-marker" />
      </svg>
      <span className="range-tip">
        {miss
          ? state.event?.missReason === "moved-away"
            ? "Last punch missed — they stepped away."
            : state.event?.missReason === "evaded"
              ? "Last punch missed — they slipped the line."
              : "Last punch missed — outside reach."
          : state.opportunity.tip}
      </span>
    </section>
  );
}
