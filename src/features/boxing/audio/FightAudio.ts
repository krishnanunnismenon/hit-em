import type { StudyEvent, StudyState } from "../domain/types";
import { AudioRenderer } from "./AudioRenderer";
import { eventCues } from "./cues";
import { DEFAULT_MIX, readMix, type AudioMix } from "./mix";
import {
  cue,
  scoreStep,
  resultCues,
  TEMPO,
  type ScoreMood,
  type AudioLayer,
  type SoundCue,
} from "./score";
import { MusicClock, EventGate } from "./transport";
import { renderSoundCheck, waveFile } from "./preview";
export interface AudioStatus {
  unlocked: boolean;
  available: boolean;
  previewing: boolean;
}
/** Presentation only: one unlocked context, no combat random draws, commands or authority. */
export class FightAudio {
  private context: AudioContext | null = null;
  private renderer: AudioRenderer | null = null;
  private mix: AudioMix = { ...DEFAULT_MIX };
  private state: StudyState | null = null;
  private phase: StudyState["phase"] | null = null;
  private epoch = "";
  private lastTime = 0;
  private lastId = 0;
  private enabled = false;
  private hidden = false;
  private clock = new MusicClock();
  private gate = new EventGate();
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextRoom = 0;
  private nextCheer = 0;
  private steps = { player: -1, rival: -1 };
  private preview: AudioBufferSourceNode | null = null;
  private previewGeneration = 0;
  private status: AudioStatus = {
    unlocked: false,
    available: true,
    previewing: false,
  };
  private listeners = new Set<() => void>();
  constructor(
    private createContext: () => AudioContext = () => new AudioContext(),
  ) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.status;
  private publish(value: Partial<AudioStatus>) {
    this.status = { ...this.status, ...value };
    this.listeners.forEach((fn) => fn());
  }
  async unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context) {
        this.context = this.createContext();
        this.renderer = new AudioRenderer(this.context, this.mix);
        this.clock.reset(this.context.currentTime);
        this.nextRoom = this.context.currentTime;
      }
      const context = this.context;
      // This method is called from a pointer/key gesture even when the corner has paused combat.
      await context.resume();
      if (this.context !== context) return;
      this.publish({ unlocked: context.state === "running", available: true });
      this.reconcile();
    } catch {
      this.publish({ available: false, unlocked: false });
      throw new Error("Sound could not start. Try the speaker button again.");
    }
  }
  configure(enabled: boolean, mix: AudioMix) {
    this.enabled = enabled;
    this.mix = readMix(mix);
    this.renderer?.setMix(this.mix);
    if (!enabled) {
      this.stopPreview();
      this.renderer?.stopVoices();
    }
    this.reconcile();
  }
  setHidden(hidden: boolean) {
    this.hidden = hidden;
    if (hidden) this.stopPreview();
    this.reconcile();
  }
  update(s: StudyState) {
    const epoch = `${s.opponent.id}:${s.difficulty}:${s.training}`;
    if (
      this.epoch !== epoch ||
      s.time < this.lastTime ||
      s.eventId < this.lastId ||
      (s.phase === "ready" && this.phase !== "ready")
    ) {
      this.gate.reset();
      this.renderer?.stopVoices();
      this.steps = { player: -1, rival: -1 };
      if (this.context) this.clock.reset(this.context.currentTime);
      this.nextRoom = this.context?.currentTime ?? 0;
      this.nextCheer = 0;
    }
    const before = this.phase;
    this.state = s;
    this.epoch = epoch;
    this.lastTime = s.time;
    this.lastId = s.eventId;
    this.phase = s.phase;
    this.reconcile();
    if (s.phase === "sparring" && before === "ready")
      this.emit(
        [cue("bell", 1180, 0.85, 0.16), cue("bell", 1669, 0.5, 0.065, 0.005)],
        "effects",
      );
    if (
      (s.phase === "victory" || s.phase === "loss") &&
      before !== s.phase &&
      !s.training
    ) {
      this.emit(resultCues(s.phase === "victory"), "effects");
      this.cheer(s.phase === "victory");
    }
    if (s.phase === "sparring" && !s.knockout && !s.hitStop) {
      for (const side of ["player", "rival"] as const) {
        const foot = s.spacing[side];
        if (
          s.spacing.enabled &&
          foot.stepStarted > 0 &&
          s.time >= foot.stepStarted + foot.stepDuration &&
          this.steps[side] !== foot.stepStarted
        ) {
          this.steps[side] = foot.stepStarted;
          this.emit(
            [
              cue(
                "scuff",
                side === "player" ? 620 : 740,
                0.055,
                0.034,
                0,
                side === "player" ? -0.25 : 0.25,
              ),
            ],
            "effects",
          );
        }
      }
    }
  }
  play(e: StudyEvent, s: StudyState) {
    this.update(s);
    if (!this.gate.accept(e.id)) return;
    const context = this.context;
    if (
      !this.canPlay() ||
      !context ||
      this.status.previewing ||
      s.phase === "paused"
    )
      return;
    const variant = s.knockout?.variant ?? 0;
    this.emit(eventCues(e, variant), "effects");
    if (e.type === "impact" && e.outcome !== "whiff")
      this.renderer?.duck(context.currentTime, e.power >= 3 ? 0.35 : 0.6, 0.18);
    if (e.type === "knockout") {
      this.renderer?.duck(context.currentTime, 0.2, 2.2);
      this.cheer(true);
    } else if ((e.stunFor ?? 0) > 0) this.cheer(true);
  }
  private canPlay() {
    return (
      this.enabled &&
      !this.hidden &&
      !!this.context &&
      this.status.unlocked &&
      this.context.state === "running"
    );
  }
  private emit(sounds: SoundCue[], layer: AudioLayer) {
    if (!this.canPlay() || this.status.previewing) return;
    for (const sound of sounds)
      this.renderer?.render(sound, this.context!.currentTime, layer);
  }
  private cheer(big: boolean) {
    const now = this.context?.currentTime ?? 0;
    if (now < this.nextCheer) return;
    this.nextCheer = now + 2.8;
    this.emit(
      [
        cue("clap", 2100, 0.1, big ? 0.15 : 0.08, 0, -0.5),
        cue("clap", 1850, 0.1, 0.1, 0.13, 0.5),
        cue("chirp", 1600, 0.16, 0.035, 0.2, -0.4, 2200),
      ],
      "ambience",
    );
  }
  private reconcile() {
    const c = this.context;
    const permitted =
      this.enabled &&
      !this.hidden &&
      (this.status.previewing || this.phase !== "paused");
    if (!c) return;
    if (permitted && this.status.unlocked) {
      if (c.state === "suspended")
        void c
          .resume()
          .catch(() => this.publish({ available: false, unlocked: false }));
      if (!this.timer && !this.status.previewing) {
        this.tick();
        this.timer = setInterval(() => this.tick(), 25);
      }
    } else {
      this.stopClock();
      if (c.state === "running") void c.suspend();
    }
  }
  private stopClock() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  private tick() {
    const s = this.state,
      c = this.context;
    if (
      !s ||
      !c ||
      !this.canPlay() ||
      this.status.previewing ||
      s.phase === "paused"
    )
      return;
    const mood: ScoreMood = s.knockout
      ? "knockout"
      : s.phase === "ready"
        ? "corner"
        : s.phase === "victory" || s.phase === "loss"
          ? "result"
          : s.superUntil > s.time
            ? "super"
            : "fight";
    const intensity =
      1 - Math.min(s.playerHealth / 100, s.rivalHealth / s.rivalMaxHealth);
    for (const beat of this.clock.plan(c.currentTime, TEMPO[s.opponent.id]))
      for (const sound of scoreStep(s.opponent.id, mood, beat.step, intensity))
        this.renderer?.render(sound, beat.at, "music");
    if (c.currentTime >= this.nextRoom) {
      this.nextRoom = c.currentTime + 1.7;
      this.renderer?.render(
        cue("room", 360, 1.95, 0.035),
        c.currentTime,
        "ambience",
      );
    }
  }
  async soundCheck(): Promise<Uint8Array<ArrayBuffer>> {
    if (!this.enabled)
      throw new Error("Enable sound before playing the sound check.");
    this.stopPreview();
    this.stopClock();
    this.renderer?.stopVoices();
    const generation = ++this.previewGeneration;
    this.publish({ previewing: true });
    try {
      await this.unlock();
      const buffer = await renderSoundCheck(this.mix);
      if (
        generation !== this.previewGeneration ||
        !this.enabled ||
        this.hidden ||
        !this.context
      )
        throw new Error("Sound check cancelled.");
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      this.preview = source;
      source.onended = () => {
        source.disconnect();
        if (this.preview === source) {
          this.preview = null;
          this.publish({ previewing: false });
          this.reconcile();
        }
      };
      source.start();
      return waveFile(buffer);
    } catch (error) {
      if (generation === this.previewGeneration) {
        this.publish({ previewing: false });
        this.reconcile();
      }
      throw error;
    }
  }
  stopPreview() {
    ++this.previewGeneration;
    if (this.preview) {
      this.preview.onended = null;
      try {
        this.preview.stop();
      } catch {}
      this.preview.disconnect();
      this.preview = null;
    }
    if (this.status.previewing) this.publish({ previewing: false });
    this.reconcile();
  }
  dispose() {
    this.stopPreview();
    this.stopClock();
    this.renderer?.dispose();
    const old = this.context;
    this.context = null;
    this.renderer = null;
    void old?.close();
    this.publish({ unlocked: false, previewing: false });
    this.phase = null;
    this.gate.reset();
  }
}
