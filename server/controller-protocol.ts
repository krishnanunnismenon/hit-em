import { WHEEL_BY_CHANNEL, type ControllerInput } from "../shared/input.js";

// Framing and v1 parser adapted from Signal Lock; see hardware/PROVENANCE.md.
export interface KnobStep {
  v: 1;
  type: "turn";
  epoch: string;
  seq: number;
  knob: number;
  delta: -1 | 1;
}

export interface KnobPress {
  v: 1;
  type: "press";
  epoch: string;
  seq: number;
  button: "power";
}
export interface KnobPins {
  v: 1;
  type: "pins";
  knob: number;
  pinA: number;
  pinB: number;
  a: 0 | 1;
  b: 0 | 1;
  changesA: number;
  changesB: number;
}

export function parseKnobLine(
  line: string,
): KnobStep | KnobPress | KnobPins | "ready" | null {
  if (line.length > 256) return null;
  try {
    const value = JSON.parse(line);
    if (!value || value.v !== 1) return null;
    if (value.type === "ready") return "ready";
    if (value.type === "pins") {
      const nonnegative = (n: unknown) =>
        typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
      if (
        !nonnegative(value.knob) ||
        value.knob > 2 ||
        !nonnegative(value.pinA) ||
        value.pinA > 39 ||
        !nonnegative(value.pinB) ||
        value.pinB > 39 ||
        ![0, 1].includes(value.a) ||
        ![0, 1].includes(value.b) ||
        !nonnegative(value.changesA) ||
        !nonnegative(value.changesB)
      )
        return null;
      return value;
    }
    if (value.type === "press") {
      if (
        typeof value.epoch !== "string" ||
        !/^[a-zA-Z0-9-]{1,40}$/.test(value.epoch) ||
        !Number.isSafeInteger(value.seq) ||
        value.seq < 1 ||
        value.button !== "power"
      )
        return null;
      return value;
    }
    if (
      value.type !== "turn" ||
      typeof value.epoch !== "string" ||
      !/^[a-zA-Z0-9-]{1,40}$/.test(value.epoch) ||
      !Number.isSafeInteger(value.seq) ||
      value.seq < 1 ||
      !Number.isInteger(value.knob) ||
      value.knob < 0 ||
      value.knob > 2 ||
      (value.delta !== -1 && value.delta !== 1)
    )
      return null;
    return value;
  } catch {
    // ESP boot messages and incomplete/non-protocol lines are not game inputs.
    return null;
  }
}

/** Bound memory even for a noisy device that never sends a newline. */
export class KnobLines {
  private pending = "";
  private overflow = false;
  push(chunk: string): string[] {
    const result: string[] = [];
    for (const char of chunk) {
      if (char === "\n") {
        if (!this.overflow) result.push(this.pending.trim());
        this.pending = "";
        this.overflow = false;
      } else if (!this.overflow) {
        this.pending += char;
        if (this.pending.length > 256) {
          this.pending = "";
          this.overflow = true;
        }
      }
    }
    return result;
  }
}

export function mapTurn(
  step: KnobStep,
): Extract<ControllerInput, { type: "turn" }> {
  return {
    type: "turn",
    wheel: WHEEL_BY_CHANNEL[step.knob],
    delta: -step.delta as -1 | 1,
  };
}
