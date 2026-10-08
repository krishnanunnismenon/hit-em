import { test } from "node:test";
import assert from "node:assert/strict";
import { eventCues, knockoutCues } from "./cues";
import { scoreStep, resultCues, TEMPO, cue } from "./score";
import { readMix, DEFAULT_MIX } from "./mix";
import { MusicClock, EventGate } from "./transport";
import { readPreferences } from "../application/Campaign";
import { createStudy, command, step } from "../domain/study";
import { FightAudio } from "./FightAudio";
import { AudioRenderer, MAX_VOICES } from "./AudioRenderer";
import { waveFile } from "./preview";
import type { StudyEvent } from "../domain/types";
const impact = (override: Partial<StudyEvent> = {}): StudyEvent => ({
  id: 7,
  type: "impact",
  side: "player",
  recipient: "rival",
  power: 2,
  attack: "jab",
  outcome: "hit",
  text: "POW",
  ...override,
});
test("sound palettes distinguish techniques, scale power and never give misses/feints a contact thump", () => {
  const shapes = new Set(
    ["jab", "cross", "hook", "uppercut"].map((attack) =>
      JSON.stringify(
        eventCues(impact({ attack: attack as StudyEvent["attack"] })),
      ),
    ),
  );
  assert.equal(shapes.size, 4);
  const weak = eventCues(impact({ power: 1 })),
    strong = eventCues(impact({ power: 4 }));
  assert.ok(
    strong[0].gain > weak[0].gain && strong[0].duration > weak[0].duration,
  );
  assert.ok(
    eventCues(impact({ outcome: "whiff" })).every(
      (c) => c.voice !== "thud" && c.voice !== "slap",
    ),
  );
  assert.deepEqual(eventCues(impact({ type: "notice", text: "FEINT" })), []);
  assert.equal(
    eventCues(impact({ outcome: "block" })).some((c) => c.voice === "chirp"),
    false,
  );
  assert.ok(
    eventCues(impact({ outcome: "block", text: "PERFECT GUARD" })).some(
      (c) => c.voice === "bell",
    ),
  );
  for (const side of ["player", "rival"] as const)
    assert.equal(
      eventCues(impact({ side, stunFor: 1.65 })).filter(
        (c) => c.voice === "chirp",
      ).length,
      5,
    );
});
test("six comic falls have distinct signatures; impacts follow landing events and win/loss tags differ", () => {
  assert.equal(
    new Set(
      Array.from({ length: 6 }, (_, i) => JSON.stringify(knockoutCues(i, 0))),
    ).size,
    6,
  );
  for (let i = 0; i < 6; i++)
    assert.ok(
      eventCues(impact({ type: "knockout" }), i).every(
        (c) => c.voice !== "thud",
      ),
    );
  assert.ok(
    eventCues(impact({ type: "fall-impact" })).some((c) => c.voice === "thud"),
  );
  assert.notDeepEqual(resultCues(true), resultCues(false));
});
test("rival scores have eight-bar variation, quieter corner/KO layers, and bounded finite cues", () => {
  const profiles = [];
  for (const id of ["quickstep", "brick", "encore"] as const) {
    const fight = Array.from({ length: 128 }, (_, i) =>
      scoreStep(id, "fight", i, 0.7),
    );
    const corner = Array.from({ length: 128 }, (_, i) =>
      scoreStep(id, "corner", i, 0),
    );
    const ko = Array.from({ length: 128 }, (_, i) =>
      scoreStep(id, "knockout", i, 0),
    );
    assert.ok(
      fight.flat().length > corner.flat().length &&
        corner.flat().length > ko.flat().length,
    );
    assert.notDeepEqual(fight.slice(0, 16), fight.slice(16, 32));
    profiles.push(JSON.stringify(fight));
    for (const mood of [
      "corner",
      "fight",
      "super",
      "knockout",
      "result",
    ] as const)
      for (let i = 0; i < 256; i++)
        for (const c of scoreStep(id, mood, i, 1)) {
          assert.ok(
            [c.at, c.duration, c.gain, c.frequency, c.pan].every(
              Number.isFinite,
            ),
          );
          assert.ok(
            c.frequency >= 20 &&
              c.gain <= 0.6 &&
              c.duration > 0 &&
              c.duration <= 3 &&
              Math.abs(c.pan) <= 0.75,
          );
        }
    assert.ok(TEMPO[id] >= 90 && TEMPO[id] <= 125);
  }
  assert.equal(new Set(profiles).size, 3);
});
test("music stalls skip stale notes rather than fast-forward; duplicate events are suppressed and a new bout resets the gate", () => {
  const clock = new MusicClock();
  clock.reset(0);
  assert.equal(clock.plan(0, 110)[0].step, 0);
  const planned = clock.plan(9, 110);
  assert.ok(planned.length <= 3 && planned.every((p) => p.at >= 9));
  assert.equal(clock.plan(9, 110).length, 0);
  const gate = new EventGate();
  assert.equal(gate.accept(1), true);
  assert.equal(gate.accept(1), false);
  assert.equal(gate.accept(0), false);
  gate.reset();
  assert.equal(gate.accept(1), true);
});
test("legacy audio settings migrate; malformed and out-of-range volumes do not affect other preferences", () => {
  assert.deepEqual(
    readPreferences('{"version":1,"sound":true,"reduced":null}').audio,
    DEFAULT_MIX,
  );
  assert.deepEqual(readMix({ music: Infinity, effects: -5, ambience: 2 }), {
    music: 0.42,
    effects: 0,
    ambience: 1,
  });
  const prefs = readPreferences(
    '{"version":1,"sound":true,"reduced":false,"difficulty":"ring-sense","audio":{"music":0,"effects":0.5,"ambience":0.1}}',
  );
  assert.equal(prefs.difficulty, "ring-sense");
  assert.equal(prefs.sound, true);
  assert.equal(prefs.audio.music, 0);
});
// Lightweight lifecycle fake; actual waveform rendering is verified separately with browser OfflineAudioContext.
class Param {
  value = 0;
  setValueAtTime(v: number) {
    this.value = v;
    return this;
  }
  exponentialRampToValueAtTime() {
    return this;
  }
  linearRampToValueAtTime() {
    return this;
  }
  setTargetAtTime() {
    return this;
  }
  setValueCurveAtTime() {
    return this;
  }
  cancelScheduledValues() {
    return this;
  }
}
class Node {
  gain = new Param();
  pan = new Param();
  frequency = new Param();
  Q = new Param();
  detune = new Param();
  playbackRate = new Param();
  threshold = new Param();
  knee = new Param();
  ratio = new Param();
  attack = new Param();
  release = new Param();
  type = "";
  curve = null;
  buffer = null;
  loop = false;
  onended: (() => void) | null = null;
  disconnected = false;
  connect(n: Node) {
    return n;
  }
  disconnect() {
    this.disconnected = true;
  }
  start() {}
  stop() {}
  setPeriodicWave() {}
}
class Context {
  state = "suspended";
  currentTime = 0;
  sampleRate = 8000;
  destination = new Node();
  nodes: Node[] = [];
  createGain() {
    return this.node();
  }
  createBiquadFilter() {
    return this.node();
  }
  createDynamicsCompressor() {
    return this.node();
  }
  createWaveShaper() {
    return this.node();
  }
  createStereoPanner() {
    return this.node();
  }
  createConvolver() {
    return this.node();
  }
  createOscillator() {
    return this.node();
  }
  createBufferSource() {
    return this.node();
  }
  createPeriodicWave() {
    return {};
  }
  createBuffer(channels: number, length: number) {
    const data = Array.from(
      { length: channels },
      () => new Float32Array(length),
    );
    return { getChannelData: (ch: number) => data[ch] };
  }
  node() {
    const n = new Node();
    this.nodes.push(n);
    return n;
  }
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
  async close() {
    this.state = "closed";
  }
}
test("the voice ceiling limits simultaneous sources, ended voices disconnect, and disposal releases the shared graph", () => {
  const c = new Context(),
    r = new AudioRenderer(c as unknown as AudioContext, DEFAULT_MIX);
  for (let i = 0; i < MAX_VOICES; i++)
    assert.equal(r.render(cue("thud", 100, 0.2, 0.1), 0, "effects"), true);
  assert.equal(r.render(cue("thud", 100, 0.2, 0.1), 0, "effects"), false);
  const voiced = c.nodes.filter((n) => n.onended);
  assert.equal(voiced.length, MAX_VOICES);
  for (const n of voiced) n.onended!();
  assert.ok(voiced.every((n) => n.disconnected));
  assert.equal(r.render(cue("thud", 100, 0.2, 0.1), 0, "effects"), true);
  r.dispose();
  assert.ok(c.nodes.every((n) => n.disconnected));
  assert.equal(r.render(cue("thud", 100, 0.2, 0.1), 0, "effects"), false);
});
test("muted audio allocates no context; enabled pause/hidden/mute suspend it and audio cannot change combat state", async () => {
  const c = new Context();
  let contexts = 0;
  const audio = new FightAudio(() => {
      contexts++;
      return c as unknown as AudioContext;
    }),
    s = createStudy();
  const before = structuredClone(s);
  audio.update(s);
  audio.play(impact(), s);
  await audio.unlock();
  assert.equal(contexts, 0);
  assert.deepEqual(s, before);
  audio.configure(true, DEFAULT_MIX);
  await audio.unlock();
  assert.equal(contexts, 1);
  assert.equal(c.state, "running");
  command(s, { type: "start" });
  audio.update(s);
  for (let i = 0; i < 60; i++) step(s, 1 / 60);
  const active = structuredClone(s);
  audio.play(impact({ id: 8 }), s);
  assert.deepEqual(s, active);
  command(s, { type: "pause" });
  audio.update(s);
  assert.equal(c.state, "suspended");
  command(s, { type: "resume" });
  audio.update(s);
  assert.equal(c.state, "running");
  audio.setHidden(true);
  assert.equal(c.state, "suspended");
  audio.setHidden(false);
  assert.equal(c.state, "running");
  audio.configure(false, DEFAULT_MIX);
  assert.equal(c.state, "suspended");
  audio.dispose();
  assert.equal(c.state, "closed");
});
test("sound-check WAV export is stereo PCM with the correct duration and bounded samples", () => {
  const data = [
    new Float32Array([-2, 0, 0.5, 2]),
    new Float32Array([0.25, 0, -0.5, 0]),
  ];
  const bytes = waveFile({
      length: 4,
      numberOfChannels: 2,
      sampleRate: 48000,
      getChannelData: (ch: number) => data[ch],
    } as AudioBuffer),
    view = new DataView(bytes.buffer);
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), "RIFF");
  assert.equal(view.getUint16(22, true), 2);
  assert.equal(view.getUint32(24, true), 48000);
  assert.equal(view.getUint32(40, true), 16);
  assert.equal(view.getInt16(44, true), -32768);
  assert.equal(view.getInt16(56, true), 32767);
});
