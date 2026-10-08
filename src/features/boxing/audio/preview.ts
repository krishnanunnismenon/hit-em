import { AudioRenderer } from "./AudioRenderer";
import { eventCues } from "./cues";
import { type AudioMix } from "./mix";
import { cue, scoreStep, resultCues, TEMPO } from "./score";
import type { StudyEvent } from "../domain/types";
export const PREVIEW_SECONDS = 12;
/** The same graph/instruments as the game, rendered locally; no media downloads or external service. */
export async function renderSoundCheck(mix: AudioMix): Promise<AudioBuffer> {
  const c = new OfflineAudioContext(2, 48000 * PREVIEW_SECONDS, 48000);
  const r = new AudioRenderer(c, mix),
    step = 60 / TEMPO.quickstep / 4;
  for (let i = 0; i * step < PREVIEW_SECONDS - 0.2; i++) {
    const t = 0.08 + i * step,
      mood = t < 8.1 ? "fight" : t < 9.8 ? "knockout" : "result";
    for (const sound of scoreStep("quickstep", mood, i, 0.4))
      r.render(sound, t, "music");
  }
  for (let t = 0; t < 11; t += 1.7)
    r.render(cue("room", 360, 1.95, 0.035), t, "ambience");
  const events: Array<[number, StudyEvent]> = [
    [
      1.2,
      {
        id: 1,
        type: "impact",
        side: "player",
        attack: "jab",
        outcome: "hit",
        power: 1,
        text: "",
      },
    ],
    [
      2.2,
      {
        id: 2,
        type: "impact",
        side: "rival",
        attack: "cross",
        outcome: "hit",
        power: 2,
        text: "",
      },
    ],
    [
      3.3,
      {
        id: 3,
        type: "impact",
        side: "player",
        attack: "hook",
        outcome: "counter",
        power: 3,
        recipient: "rival",
        stunFor: 1.65,
        text: "",
      },
    ],
    [
      4.8,
      {
        id: 4,
        type: "impact",
        side: "player",
        attack: "uppercut",
        outcome: "hit",
        power: 4,
        text: "",
      },
    ],
    [
      6.1,
      {
        id: 5,
        type: "impact",
        side: "rival",
        attack: "cross",
        outcome: "block",
        power: 3,
        text: "",
      },
    ],
    [
      7,
      {
        id: 6,
        type: "impact",
        side: "player",
        attack: "hook",
        outcome: "whiff",
        power: 2,
        text: "",
      },
    ],
    [
      8.2,
      {
        id: 7,
        type: "knockout",
        side: "player",
        recipient: "rival",
        power: 4,
        text: "",
      },
    ],
    [
      9.38,
      {
        id: 8,
        type: "fall-impact",
        side: "player",
        recipient: "rival",
        power: 4,
        text: "",
      },
    ],
  ];
  for (const [time, event] of events) {
    r.duck(
      time,
      event.type === "knockout" ? 0.18 : 0.45,
      event.type === "knockout" ? 1.7 : 0.24,
    );
    for (const sound of eventCues(event, 3)) r.render(sound, time, "effects");
  }
  for (const sound of resultCues(true)) r.render(sound, 9.85, "effects");
  r.render(cue("clap", 2100, 0.095, 0.13, 0, -0.35), 9.7, "ambience");
  r.render(cue("clap", 1800, 0.095, 0.13, 0, 0.35), 9.85, "ambience");
  const buffer = await c.startRendering();
  r.dispose();
  return buffer;
}
export function waveFile(buffer: AudioBuffer): Uint8Array<ArrayBuffer> {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const bytes = new Uint8Array(44 + length),
    view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++)
      bytes[offset + i] = value.charCodeAt(i);
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + length, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
  view.setUint16(32, buffer.numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, length, true);
  for (let i = 0; i < buffer.length; i++)
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(
        44 + (i * buffer.numberOfChannels + ch) * 2,
        Math.round(sample * (sample < 0 ? 32768 : 32767)),
        true,
      );
    }
  return bytes;
}
