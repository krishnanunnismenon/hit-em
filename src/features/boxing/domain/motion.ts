import type { Strike } from "./types";
export function smooth(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}
export function attackEnvelope(strike: Strike | null, time: number) {
  if (!strike) return { extension: 0, windup: 0, progress: 0 };
  const age = Math.max(0, time - strike.started);
  const progress = Math.min(1, age / strike.duration);
  const contact = strike.contactAt;
  const extension =
    age <= contact
      ? smooth(age / contact)
      : 1 - smooth((age - contact) / (strike.duration - contact));
  const windup =
    Math.sin(Math.min(1, age / contact) * Math.PI) *
    (0.055 + 0.035 * strike.power);
  return { extension, windup, progress };
}
