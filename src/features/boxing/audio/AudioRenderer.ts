import { readMix, type AudioMix } from "./mix";
import { type AudioLayer, type SoundCue, type Voice } from "./score";
export const MAX_VOICES = 48;
interface PlayingVoice {
  source: AudioScheduledSourceNode;
  nodes: AudioNode[];
  start: number;
  end: number;
  gain: GainNode;
}
/** One graph per context, cached noise/waves/reverb, short disposable voices. */
export class AudioRenderer {
  private master: GainNode;
  private duckBus: GainNode;
  private buses: Record<AudioLayer, GainNode>;
  private shared: AudioNode[] = [];
  private waves = new Map<string, PeriodicWave>();
  private noise: AudioBuffer;
  private voices = new Set<PlayingVoice>();
  private disposed = false;
  constructor(
    private c: BaseAudioContext,
    mix: AudioMix,
  ) {
    this.master = c.createGain();
    this.master.gain.value = 0.8;
    const compressor = c.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 16;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    const limiter = c.createWaveShaper();
    limiter.curve = Float32Array.from(
      { length: 1025 },
      (_, i) => (0.92 * Math.tanh((i / 512 - 1) * 1.1)) / Math.tanh(1.1),
    );
    limiter.oversample = "2x";
    const makeup = c.createGain();
    makeup.gain.value = 2.2;
    this.master
      .connect(compressor)
      .connect(makeup)
      .connect(limiter)
      .connect(c.destination);
    this.buses = {
      music: c.createGain(),
      effects: c.createGain(),
      ambience: c.createGain(),
    };
    this.duckBus = c.createGain();
    this.buses.music.connect(this.duckBus).connect(this.master);
    this.buses.effects.connect(this.master);
    this.buses.ambience.connect(this.master);
    const reverb = c.createConvolver(),
      wet = c.createGain(),
      send = c.createGain();
    const impulse = c.createBuffer(
      2,
      Math.ceil(c.sampleRate * 0.55),
      c.sampleRate,
    );
    let seed = 1847;
    for (let ch = 0; ch < 2; ch++) {
      const samples = impulse.getChannelData(ch);
      for (let i = 0; i < samples.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        samples[i] =
          ((seed / 4294967296) * 2 - 1) *
          Math.exp((-i / c.sampleRate) * 9) *
          0.22;
      }
    }
    reverb.buffer = impulse;
    wet.gain.value = 0.11;
    send.gain.value = 0.4;
    this.duckBus.connect(reverb);
    this.buses.effects.connect(send).connect(reverb);
    reverb.connect(wet).connect(this.master);
    this.shared = [
      this.master,
      compressor,
      makeup,
      limiter,
      this.duckBus,
      ...Object.values(this.buses),
      reverb,
      wet,
      send,
    ];
    this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const samples = this.noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      samples[i] = (seed / 4294967296) * 2 - 1;
    }
    this.setMix(mix, true);
  }
  setMix(mix: AudioMix, immediate = false) {
    const values = readMix(mix);
    for (const layer of ["music", "effects", "ambience"] as const) {
      const p = this.buses[layer].gain;
      p.cancelScheduledValues(this.c.currentTime);
      if (immediate) p.value = values[layer];
      else p.setTargetAtTime(values[layer], this.c.currentTime, 0.025);
    }
  }
  duck(at: number, strength = 0.55, duration = 0.22) {
    const p = this.duckBus.gain;
    p.cancelScheduledValues(at);
    p.setTargetAtTime(strength, at, 0.012);
    p.setTargetAtTime(1, at + duration, 0.12);
  }
  private wave(voice: Voice) {
    const key =
      voice === "brass"
        ? "brass"
        : voice === "bass"
          ? "bass"
          : voice === "bell"
            ? "bell"
            : "keys";
    let wave = this.waves.get(key);
    if (!wave) {
      const harmonics = {
        brass: [0, 0.7, 0.8, 0.45, 0.2, 0.15, 0.08, 0.03, 0.03],
        bass: [0, 1, 0.3, 0.13, 0.06],
        bell: [0, 1, 0.1, 0.35, 0.22, 0.02, 0.01, 0.14],
        keys: [0, 1, 0.15, 0.5, 0.03, 0.13],
      }[key];
      wave = this.c.createPeriodicWave(
        new Float32Array(harmonics.length),
        new Float32Array(harmonics),
      );
      this.waves.set(key, wave);
    }
    return wave;
  }
  render(cue: SoundCue, when: number, layer: AudioLayer): boolean {
    if (
      this.disposed ||
      ![when, cue.at, cue.duration, cue.frequency, cue.gain, cue.pan].every(
        Number.isFinite,
      ) ||
      cue.duration <= 0 ||
      cue.duration > 3 ||
      cue.gain <= 0
    )
      return false;
    const c = this.c,
      t = Math.max(c.currentTime, when + cue.at),
      end = t + cue.duration;
    if (
      [...this.voices].filter((v) => v.start <= t && v.end > t).length >=
      MAX_VOICES
    )
      return false;
    const gain = c.createGain(),
      pan = c.createStereoPanner(),
      filter = c.createBiquadFilter();
    const peak = Math.min(0.6, cue.gain),
      attack =
        cue.voice === "brass" ? 0.025 : cue.voice === "room" ? 0.25 : 0.003;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(
      peak,
      t + Math.min(attack, cue.duration * 0.2),
    );
    if (cue.voice === "bass" || cue.voice === "keys")
      gain.gain.exponentialRampToValueAtTime(
        peak * 0.45,
        t + cue.duration * 0.55,
      );
    if (cue.voice === "kick")
      gain.gain.exponentialRampToValueAtTime(
        peak * 0.16,
        t + cue.duration * 0.5,
      );
    if (cue.voice === "brass")
      gain.gain.exponentialRampToValueAtTime(
        peak * 0.7,
        t + cue.duration * 0.65,
      );
    if (cue.voice === "clap") {
      for (let i = 1; i <= 2; i++) {
        gain.gain.setValueAtTime(peak * 0.2, t + i * 0.018 - 0.003);
        gain.gain.linearRampToValueAtTime(peak, t + i * 0.018);
      }
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    pan.pan.value = Math.max(-0.75, Math.min(0.75, cue.pan));
    filter.type = "lowpass";
    filter.frequency.value = 8000;
    filter.Q.value = 0.5;
    let source: AudioBufferSourceNode | OscillatorNode;
    const nodes: AudioNode[] = [gain, pan, filter];
    const noisy = [
      "snare",
      "hat",
      "whoosh",
      "slap",
      "scuff",
      "room",
      "clap",
    ].includes(cue.voice);
    if (noisy) {
      source = c.createBufferSource();
      source.buffer = this.noise;
      source.loop = true;
      source.playbackRate.value = 0.94 + (Math.round(cue.frequency) % 13) / 100;
      filter.type = cue.voice === "hat" ? "highpass" : "bandpass";
      filter.frequency.value = cue.frequency;
      filter.Q.value =
        cue.voice === "whoosh" ? 0.7 : cue.voice === "room" ? 0.4 : 0.65;
      if (cue.voice === "whoosh")
        filter.frequency.exponentialRampToValueAtTime(
          Math.max(160, cue.frequency * 0.3),
          end,
        );
    } else {
      source = c.createOscillator();
      if (cue.voice !== "chirp")
        source.frequency.setValueAtTime(Math.max(20, cue.frequency), t);
      source.type =
        cue.voice === "boing" || cue.voice === "rim" ? "triangle" : "sine";
      if (["bass", "brass", "keys", "bell"].includes(cue.voice))
        source.setPeriodicWave(this.wave(cue.voice));
      if (cue.voice === "kick" || cue.voice === "thud")
        source.frequency.exponentialRampToValueAtTime(
          cue.end ?? 38,
          t + cue.duration * 0.7,
        );
      else if (cue.end && cue.voice !== "chirp")
        source.frequency.exponentialRampToValueAtTime(
          Math.max(20, cue.end),
          end,
        );
      if (cue.voice === "bass") filter.frequency.value = 520;
      if (cue.voice === "brass") {
        filter.frequency.setValueAtTime(750, t);
        filter.frequency.exponentialRampToValueAtTime(2800, t + 0.04);
        filter.frequency.exponentialRampToValueAtTime(1100, end);
      }
      if (cue.voice === "keys") filter.frequency.value = 2600;
      if (cue.voice === "chirp")
        source.frequency.setValueCurveAtTime(
          new Float32Array([
            cue.frequency,
            cue.frequency * 1.25,
            cue.end ?? cue.frequency * 1.4,
            cue.frequency * 1.05,
          ]),
          t,
          cue.duration,
        );
      if (cue.voice === "brass" || cue.voice === "boing") {
        const lfo = c.createOscillator(),
          depth = c.createGain();
        lfo.frequency.value = cue.voice === "boing" ? 18 : 5.7;
        depth.gain.value = cue.voice === "boing" ? 175 : 8;
        lfo.connect(depth).connect(source.detune);
        lfo.start(t);
        lfo.stop(end + 0.02);
        nodes.push(lfo, depth);
      }
    }
    source
      .connect(filter)
      .connect(gain)
      .connect(pan)
      .connect(this.buses[layer]);
    const record: PlayingVoice = {
      source,
      nodes: [source, ...nodes],
      gain,
      start: t,
      end: end + 0.025,
    };
    this.voices.add(record);
    source.onended = () => {
      for (const node of record.nodes) node.disconnect();
      this.voices.delete(record);
    };
    source.start(t);
    source.stop(record.end);
    return true;
  }
  stopVoices(fade = true) {
    for (const v of this.voices) {
      if (fade) {
        const now = this.c.currentTime;
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setTargetAtTime(0.0001, now, 0.005);
        v.end = now + 0.025;
        try {
          v.source.stop(v.end);
        } catch {}
        for (const n of v.nodes)
          if (n !== v.source && "stop" in n) {
            try {
              (n as OscillatorNode).stop(v.end);
            } catch {}
          }
      } else {
        v.source.onended = null;
        try {
          v.source.stop();
        } catch {}
        for (const n of v.nodes) {
          if (n !== v.source && "stop" in n) {
            try {
              (n as OscillatorNode).stop();
            } catch {}
          }
          n.disconnect();
        }
      }
    }
    if (!fade) this.voices.clear();
    this.duckBus.gain.cancelScheduledValues(this.c.currentTime);
    this.duckBus.gain.value = 1;
  }
  dispose() {
    this.disposed = true;
    this.stopVoices(false);
    for (const n of this.shared) n.disconnect();
    this.waves.clear();
  }
}
