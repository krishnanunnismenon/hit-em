import type { OpponentId } from "../domain/opponent";
export type AudioLayer = "music" | "effects" | "ambience";
export type Voice =
  | "kick"
  | "snare"
  | "hat"
  | "bass"
  | "keys"
  | "brass"
  | "bell"
  | "whoosh"
  | "thud"
  | "slap"
  | "rim"
  | "chirp"
  | "slide"
  | "boing"
  | "scuff"
  | "room"
  | "clap";
export interface SoundCue {
  voice: Voice;
  at: number;
  duration: number;
  gain: number;
  frequency: number;
  end?: number;
  pan: number;
}
export type ScoreMood = "corner" | "fight" | "super" | "knockout" | "result";
export const TEMPO: Record<OpponentId, number> = {
  quickstep: 110,
  brick: 94,
  encore: 122,
};
export const GROOVE: Record<OpponentId, string> = {
  quickstep: "Pip’s two-step",
  brick: "Bram’s basement stomp",
  encore: "Juno’s crooked encore",
};
export const note = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export function cue(
  voice: Voice,
  frequency: number,
  duration: number,
  gain: number,
  at = 0,
  pan = 0,
  end?: number,
): SoundCue {
  return { voice, frequency, duration, gain, at, pan, end };
}
// Original eight-bar D-minor/blues arrangement: Dm9, G9, F6, A7. No recorded samples.
const ROOTS = [38, 38, 43, 43, 41, 41, 45, 45];
const HARMONIES = [
  [15, 19, 22, 26],
  [15, 19, 22, 26],
  [16, 19, 22, 26],
  [16, 19, 22, 26],
  [16, 19, 21, 26],
  [16, 19, 21, 26],
  [16, 19, 22, 25],
  [16, 19, 22, 25],
];
const BASS_LINES: Record<OpponentId, readonly number[]> = {
  quickstep: [0, 0, 7, 10, 12, 7, 3, 1],
  brick: [0, 0, 0, 7, 10, 7, 0, -2],
  encore: [0, 10, 7, 12, 3, 6, 7, -1],
};
const HORNS: Record<OpponentId, readonly number[]> = {
  quickstep: [74, 77, 79, 77, 74, 72, 69, 72],
  brick: [62, 65, 62, 60, 57, 60, 62, 65],
  encore: [81, 77, 74, 80, 79, 77, 72, 73],
};
export function scoreStep(
  id: OpponentId,
  mood: ScoreMood,
  index: number,
  intensity: number,
): SoundCue[] {
  const sixteenth = 60 / TEMPO[id] / 4;
  const bar = Math.floor(index / 16),
    beat = index % 16;
  const root = ROOTS[bar % ROOTS.length];
  const busy = mood === "fight" || mood === "super";
  const out: SoundCue[] = [];
  if (mood === "knockout")
    return beat === 0 ? [cue("bass", note(root), 0.25, 0.09)] : [];
  if (mood === "corner" || mood === "result") {
    if (beat === 0 || beat === 10)
      out.push(cue("bass", note(root), 0.28, 0.12));
    if (beat === 4 && bar % 2 === 0)
      for (const interval of HARMONIES[bar % 8])
        out.push(
          cue(
            "keys",
            note(root + interval),
            0.7,
            0.026,
            0,
            (interval - 17) / 20,
          ),
        );
    return out;
  }
  if (
    beat === 0 ||
    beat === 8 ||
    (beat === 11 && bar % 2 === 0) ||
    (id === "brick" && beat === 6)
  )
    out.push(cue("kick", 105, 0.2, 0.32));
  if (beat === 4 || beat === 12) out.push(cue("snare", 1750, 0.13, 0.2));
  if (beat === 7 || (beat === 15 && bar % 2))
    out.push(cue("snare", 2300, 0.065, 0.045));
  if (beat % 2 === 0 || (mood === "super" && beat % 4 === 3))
    out.push(
      cue(
        "hat",
        6900,
        beat === 14 && bar % 4 === 3 ? 0.13 : 0.035,
        beat % 4 === 0 ? 0.065 : 0.04,
        beat % 2 ? 0.015 : 0,
        -0.25,
      ),
    );
  const bassBeats =
    id === "brick" ? [0, 3, 6, 8, 11, 14] : [0, 3, 6, 8, 10, 13, 15];
  const bassIndex = bassBeats.indexOf(beat);
  if (bassIndex >= 0)
    out.push(
      cue(
        "bass",
        note(root + BASS_LINES[id][(bassIndex + bar) % 8]),
        sixteenth * (beat === 0 ? 2.5 : 1.3),
        0.2,
      ),
    );
  if (beat === 2 || beat === 10)
    for (const interval of HARMONIES[bar % 8].slice(0, 3))
      out.push(
        cue(
          "keys",
          note(root + interval),
          0.19,
          0.026,
          0,
          (interval - 18) / 12,
        ),
      );
  // The melody answers in alternate bars; fills and sparse bars prevent a one-bar loop.
  const hornBeats = bar % 2 === 0 ? [5, 7, 10] : [2, 6];
  const hornIndex = hornBeats.indexOf(beat);
  if (busy && hornIndex >= 0) {
    const midi = HORNS[id][(bar * 3 + hornIndex) % 8];
    const weight =
      mood === "super" ? 0.085 : 0.047 + Math.min(1, intensity) * 0.018;
    out.push(
      cue(
        "brass",
        note(midi),
        sixteenth * (hornIndex === 0 ? 1.7 : 0.95),
        weight,
        0.014,
        0.3,
      ),
    );
    if (mood === "super" && hornIndex === 0)
      out.push(
        cue("brass", note(midi - 12), sixteenth * 1.6, 0.045, 0.025, -0.3),
      );
  }
  if (bar % 4 === 3 && beat >= 13)
    out.push(
      cue("rim", 900 + beat * 20, 0.05, 0.055, 0, beat % 2 ? 0.35 : -0.35),
    );
  return out;
}
export function resultCues(won: boolean): SoundCue[] {
  const melody = won ? [62, 65, 69, 74, 72, 74] : [69, 68, 65, 62];
  return melody.map((midi, i) =>
    cue(
      won ? "brass" : "slide",
      note(midi),
      i === melody.length - 1 ? 0.55 : 0.16,
      0.1,
      i * 0.19,
      0,
      won ? undefined : note(midi - 2),
    ),
  );
}
