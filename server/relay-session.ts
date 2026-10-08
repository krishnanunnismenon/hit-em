import { randomUUID } from "node:crypto";
import { parseKnobLine, mapTurn } from "./controller-protocol";
export class RelaySession {
  epoch = "";
  sequence = 0;
  enabled = false;
  arm(enabled: boolean) {
    this.sequence = 0;
    this.enabled = enabled;
    this.epoch = enabled ? randomUUID() : "";
    return enabled ? `ARM ${this.epoch}\nQUIET\n` : "STOP\n";
  }
  receive(line: string) {
    const value = parseKnobLine(line);
    if (
      !this.enabled ||
      !value ||
      typeof value === "string" ||
      value.type === "pins" ||
      value.epoch !== this.epoch ||
      value.seq <= this.sequence
    )
      return null;
    this.sequence = value.seq;
    return {
      type: "input" as const,
      epoch: this.epoch,
      seq: value.seq,
      at: Date.now(),
      input:
        value.type === "turn" ? mapTurn(value) : { type: "punch" as const },
    };
  }
}
export function validOrigin(value: string | undefined) {
  return (
    !!value && /^http:\/\/(?:localhost|127\.0\.0\.1):(?:5174|4174)$/.test(value)
  );
}
