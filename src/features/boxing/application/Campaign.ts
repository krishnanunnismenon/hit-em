import { readMix, type AudioMix } from "../audio/mix";
import { OPPONENTS, type OpponentId } from "../domain/opponent";
import { isDifficulty, type Difficulty } from "../domain/difficulty";
export const ROSTER: readonly OpponentId[] = ["quickstep", "brick", "encore"];
export interface Progress {
  version: 1;
  cleared: number;
}
export interface Preferences {
  version: 1;
  sound: boolean;
  audio: AudioMix;
  difficulty: Difficulty;
  reduced: boolean | null;
}
export const SAVE_KEY = "basement-boxing.progress.v1";
export const SETTINGS_KEY = "basement-boxing.settings.v1";
export function progressKey(difficulty: Difficulty) {
  return difficulty === "standard" ? SAVE_KEY : `${SAVE_KEY}.ring-sense`;
}
export function readProgress(raw: string | null): Progress {
  try {
    const value = JSON.parse(raw ?? "null");
    if (
      value?.version === 1 &&
      Number.isInteger(value.cleared) &&
      value.cleared >= 0 &&
      value.cleared <= ROSTER.length
    )
      return { version: 1, cleared: value.cleared };
  } catch {
    /* Malformed or future saves start safely. */
  }
  return { version: 1, cleared: 0 };
}
export function readPreferences(raw: string | null): Preferences {
  try {
    const value = JSON.parse(raw ?? "null");
    if (
      value?.version === 1 &&
      typeof value.sound === "boolean" &&
      (value.reduced === null || typeof value.reduced === "boolean") &&
      (value.difficulty === undefined || isDifficulty(value.difficulty))
    )
      return {
        version: 1,
        sound: value.sound,
        audio: readMix(value.audio),
        reduced: value.reduced,
        difficulty: value.difficulty ?? "standard",
      };
  } catch {
    /* Defaults also work when storage is unavailable. */
  }
  return {
    version: 1,
    sound: false,
    audio: readMix(null),
    reduced: null,
    difficulty: "standard",
  };
}
export function completeBout(progress: Progress, id: OpponentId): Progress {
  return ROSTER[progress.cleared] === id
    ? { version: 1, cleared: progress.cleared + 1 }
    : progress;
}
export function currentRival(progress: Progress) {
  return ROSTER[Math.min(progress.cleared, ROSTER.length - 1)];
}
export function loadLocal(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function saveLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function campaignTitle(progress: Progress) {
  return progress.cleared === 3
    ? "The basement is yours."
    : OPPONENTS[currentRival(progress)].name;
}
