import {
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  type Difficulty,
} from "../domain/difficulty";
export function DifficultyPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="difficulty-picker"
      role="group"
      aria-label="Fight difficulty"
    >
      <span className="difficulty-title">Fight difficulty</span>
      <div className="difficulty-buttons">
        {DIFFICULTIES.map((difficulty) => (
          <button
            key={difficulty}
            type="button"
            aria-pressed={value === difficulty}
            disabled={disabled}
            onClick={() => onChange(difficulty)}
          >
            {DIFFICULTY_LABEL[difficulty]}
          </button>
        ))}
      </div>
      <p aria-live="polite">
        {disabled
          ? "Finish or reset this bout to change difficulty."
          : value === "ring-sense"
            ? "Reads your habits. Counters heavy windups. Same health and damage."
            : "Room to learn the guard, find your range and recover."}
      </p>
    </div>
  );
}
