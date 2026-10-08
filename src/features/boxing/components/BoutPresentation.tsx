import { OPPONENTS } from "../domain/opponent";
import { ROSTER, type Progress } from "../application/Campaign";
import type { StudySnapshot } from "../domain/types";
import { Icon } from "./Icons";
import { DifficultyPicker } from "./DifficultyPicker";
import type { Difficulty } from "../domain/difficulty";
export function BoutIntro({
  state,
  progress,
  ready,
  practice,
  onStart,
  onRestart,
  onDifficulty,
}: {
  state: StudySnapshot;
  progress: Progress;
  ready: boolean;
  practice: boolean;
  onStart: () => void;
  onRestart: () => void;
  onDifficulty: (difficulty: Difficulty) => void;
}) {
  const profile = OPPONENTS[state.opponent.id],
    finished = !practice && progress.cleared === 3;
  return (
    <div className="stage-message entrance-message bout-intro">
      <h1>
        {practice ? (
          <>
            FIND YOUR
            <br />
            FOOTING.
          </>
        ) : finished ? (
          <>
            THE BASEMENT
            <br />
            IS YOURS.
          </>
        ) : (
          profile.name
        )}
      </h1>
      <p>
        {practice
          ? "No damage. Try an opening, then take it to the moving fight."
          : finished
            ? "Three rivals down. The next encore is up to you."
            : profile.intro}
      </p>
      {!practice && !finished && (
        <p className="bout-lesson">{profile.lesson}</p>
      )}
      {!practice && (
        <DifficultyPicker value={state.difficulty} onChange={onDifficulty} />
      )}
      <button
        className="primary-button"
        disabled={!ready}
        onClick={finished ? onRestart : onStart}
      >
        <Icon name={finished ? "reset" : "play"} />
        {!ready
          ? "Preparing ring"
          : finished
            ? "Start a new run"
            : practice
              ? "Start practice"
              : progress.cleared
                ? "Continue campaign"
                : "Enter the ring"}
        <kbd>Space</kbd>
      </button>
      <a className="bout-link" href={practice ? "/" : "/?practice=1"}>
        {practice ? "Back to campaign" : "Warm up in practice"}
      </a>
      {!practice && (
        <ol className="bout-roster" aria-label="Campaign opponents">
          {ROSTER.map((id, i) => (
            <li key={id} className={i === progress.cleared ? "current" : ""}>
              <span className="bout-number">{i + 1}</span>
              <span>
                <strong>{OPPONENTS[id].shortName}</strong>
                <small>{OPPONENTS[id].style}</small>
              </span>
              <b>
                {i < progress.cleared
                  ? "Won"
                  : i === progress.cleared
                    ? "Next"
                    : "Later"}
              </b>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
export function BoutResult({
  state,
  final,
  onRetry,
  onNext,
  onRestart,
}: {
  state: StudySnapshot;
  final: boolean;
  onRetry: () => void;
  onNext: () => void;
  onRestart: () => void;
}) {
  const won = state.phase === "victory",
    total =
      state.fightStats.landed +
      state.fightStats.blocked +
      state.fightStats.missed;
  return (
    <div className="pause-shade">
      <div className="stage-message result-message">
        <span className="result-stamp">
          {won ? "K.O." : "STILL IN THE GAME."}
        </span>
        <h1>
          {won
            ? final
              ? "ALL THREE.\nALL YOURS."
              : "YOUR BOUT."
            : "BACK ON\nYOUR FEET?"}
        </h1>
        <p>
          {won
            ? final
              ? "Pip, Bram and Juno. A full house of bad decisions."
              : `${OPPONENTS[state.opponent.id].shortName} needs a breather. You earned yours.`
            : OPPONENTS[state.opponent.id].lesson}
        </p>
        <dl className="bout-score">
          <div>
            <dt>Landed</dt>
            <dd>
              {state.fightStats.landed}/{total}
            </dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>
              {total ? Math.round((state.fightStats.landed / total) * 100) : 0}%
            </dd>
          </div>
          <div>
            <dt>Health left</dt>
            <dd>{state.playerHealth}</dd>
          </div>
        </dl>
        <button
          className="primary-button"
          onClick={won ? (final ? onRestart : onNext) : onRetry}
        >
          <Icon name={won && !final ? "play" : "reset"} />
          {won
            ? final
              ? "Run it back"
              : "Meet the next rival"
            : "Try this bout again"}
        </button>
        {won && (
          <button className="text-button" onClick={onRetry}>
            Rematch {OPPONENTS[state.opponent.id].shortName}
          </button>
        )}
        <a className="bout-link" href="/?practice=1">
          Practice the openings
        </a>
      </div>
    </div>
  );
}
