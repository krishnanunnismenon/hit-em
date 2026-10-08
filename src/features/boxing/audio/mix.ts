export interface AudioMix {
  music: number;
  effects: number;
  ambience: number;
}
export const DEFAULT_MIX: AudioMix = {
  music: 0.42,
  effects: 0.85,
  ambience: 0.24,
};
export function readMix(value: unknown): AudioMix {
  const input = value as Partial<AudioMix> | null;
  const level = (key: keyof AudioMix) =>
    typeof input?.[key] === "number" && Number.isFinite(input[key])
      ? Math.max(0, Math.min(1, input[key]))
      : DEFAULT_MIX[key];
  return {
    music: level("music"),
    effects: level("effects"),
    ambience: level("ambience"),
  };
}
