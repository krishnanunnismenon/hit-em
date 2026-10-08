import {
  command,
  createStudy,
  snapshot,
  step,
  FIXED_STEP,
} from "../domain/study";
import type {
  StudyCommand,
  StudyEvent,
  StudySnapshot,
  StudyState,
} from "../domain/types";
export class StudyController {
  readonly state: StudyState;
  playbackRate = 1;
  private listeners = new Set<() => void>();
  private eventListeners = new Set<(event: StudyEvent) => void>();
  private current: StudySnapshot;
  private pendingInputAt: number | null = null;
  private inputFrames: number[] = [];
  constructor(training = false) {
    this.state = createStudy(training);
    this.current = snapshot(this.state);
  }
  setPlaybackRate(rate: number) {
    if (this.state.training) this.playbackRate = rate === 0.5 ? 0.5 : 1;
  }
  private accumulator = 0;
  private notifyClock = 0;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.current;
  onEvent(listener: (event: StudyEvent) => void) {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }
  /** Browser-command receipt to first render submission, not physical USB/display latency. */
  presented(now: number) {
    if (this.pendingInputAt !== null) {
      this.inputFrames.push(Math.max(0, now - this.pendingInputAt));
      if (this.inputFrames.length > 120) this.inputFrames.shift();
      this.pendingInputAt = null;
    }
  }
  inputTiming() {
    const samples = [...this.inputFrames].sort((a, b) => a - b);
    return {
      count: samples.length,
      p95:
        Math.round((samples[Math.floor(samples.length * 0.95)] ?? 0) * 10) / 10,
    };
  }
  dispatch = (c: StudyCommand) => {
    if (["turn", "select", "punch"].includes(c.type))
      this.pendingInputAt ??= performance.now();
    for (const event of command(this.state, c))
      this.eventListeners.forEach((fn) => fn(event));
    this.publish();
  };
  advance(dt: number) {
    this.accumulator += Math.min(dt, 0.1) * this.playbackRate;
    while (this.accumulator >= FIXED_STEP) {
      for (const event of step(this.state, FIXED_STEP))
        this.eventListeners.forEach((fn) => fn(event));
      this.accumulator -= FIXED_STEP;
    }
    this.notifyClock += dt;
    if (this.notifyClock >= 0.1) {
      this.notifyClock = 0;
      this.publish();
    }
    return this.accumulator / FIXED_STEP;
  }
  private publish() {
    this.current = snapshot(this.state);
    this.listeners.forEach((fn) => fn());
  }
}
