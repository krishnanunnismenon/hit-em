import type { StudyEvent } from "../domain/types";
import { cue, note, type SoundCue } from "./score";
export function knockoutCues(variant: number, pan: number): SoundCue[] {
  switch (variant % 6) {
    case 0:
      return [cue("slide", 1050, 0.48, 0.12, 0, pan, 190)];
    case 1:
      return [0, 0.15, 0.31].map((at, i) =>
        cue("boing", 210 - i * 28, 0.16, 0.12, at, pan, 90),
      );
    case 2:
      return [0, 0.13, 0.26, 0.39].map((at, i) =>
        cue("keys", note(74 + i * 3), 0.12, 0.1, at, (i - 1.5) / 3),
      );
    case 3:
      return [
        cue("whoosh", 2500, 0.18, 0.09, 0, pan),
        cue("slide", 380, 0.3, 0.13, 0.08, pan, 1400),
      ];
    case 4:
      return [
        cue("brass", note(74), 0.14, 0.1, 0, pan),
        cue("brass", note(70), 0.24, 0.1, 0.19, pan),
      ];
    default:
      return [
        cue("boing", 180, 0.25, 0.13, 0, pan, 440),
        cue("slide", 750, 0.25, 0.1, 0.28, pan, 180),
      ];
  }
}
/** Every cue follows a real combat event; misses and feints never get a contact thump. */
export function eventCues(e: StudyEvent, fallVariant = 0): SoundCue[] {
  const pan = e.side === "player" ? -0.17 : 0.17;
  const p = Math.max(1, Math.min(4, e.power));
  const v = ((e.id % 7) - 3) * 0.015;
  if (e.type === "strike")
    return [
      cue(
        "whoosh",
        { jab: 2200, cross: 1500, hook: 1000, uppercut: 1700 }[
          e.attack ?? "jab"
        ],
        0.075 + p * 0.014,
        0.035 + p * 0.006,
        0.04,
        pan,
      ),
    ];
  if (e.type === "knockout")
    return knockoutCues(fallVariant, e.recipient === "player" ? -0.2 : 0.2);
  if (e.type === "fall-impact")
    return [
      cue("thud", 72 + v * 80, 0.3, 0.32, 0, pan, 32),
      cue("slap", 440, 0.16, 0.18, 0, pan),
      cue(
        fallVariant === 1 || fallVariant === 5 ? "boing" : "rim",
        110 + (fallVariant % 3) * 50,
        0.19,
        0.075,
        0.055,
        pan,
        55,
      ),
    ];
  if (e.type === "notice") {
    if (e.text === "SUPER ACTIVE")
      return [0, 4, 7, 12].map((n, i) =>
        cue("bell", note(74 + n), 0.25, 0.075, i * 0.085, (i - 1.5) / 4),
      );
    return [];
  }
  if (e.outcome === "whiff")
    return [
      cue("whoosh", 2400, 0.13, 0.06, 0, pan),
      cue("slide", 430, 0.12, 0.035, 0.03, pan, 230),
    ];
  if (e.outcome === "block" && e.text === "PERFECT GUARD")
    return [
      cue("thud", 170, 0.065, 0.19, 0, pan, 90),
      cue("bell", 1174, 0.14, 0.07, 0.015, pan),
    ];
  if (e.outcome === "block")
    return [
      cue("thud", 170, 0.065, 0.16 + p * 0.014, 0, pan, 90),
      cue("slap", 1850, 0.07, 0.07, 0, pan),
    ];
  const frequency = { jab: 150, cross: 108, hook: 85, uppercut: 120 }[
    e.attack ?? "jab"
  ];
  const out = [
    cue(
      "thud",
      frequency * (1 + v),
      0.1 + p * 0.021,
      0.17 + p * 0.037,
      0,
      pan,
      36,
    ),
    cue(
      "slap",
      900 + frequency * 4,
      0.055 + p * 0.008,
      0.1 + p * 0.017,
      0,
      pan,
    ),
  ];
  if (e.outcome === "counter")
    out.push(cue("bell", 880 * (1 + v), 0.17, 0.07, 0.025, pan));
  if ((e.stunFor ?? 0) > 0) {
    const recipientPan = e.recipient === "player" ? -0.35 : 0.35;
    out.push(cue("boing", 175, 0.18, 0.075, 0.035, recipientPan, 280));
    for (let i = 0; i < 5; i++)
      out.push(
        cue(
          "chirp",
          1200 + (i % 3) * 310,
          0.085,
          0.037,
          0.15 + i * 0.16,
          recipientPan * (i % 2 ? -1 : 1),
          2000 + i * 60,
        ),
      );
  }
  return out;
}
