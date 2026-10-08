export const ATTACKS = ["jab", "cross", "hook", "uppercut"] as const;
export const STANCES = ["defensive", "offensive", "neutral", "super"] as const;
export const POWER_LEVELS = [1, 2, 3, 4] as const;
export type Attack = (typeof ATTACKS)[number];
export type Stance = (typeof STANCES)[number];
export type Wheel = "attack" | "stance" | "power";
export type Direction = -1 | 1;

// Installed firmware channels: 0=22/19, 1=16/5, 2=15/21.
// Matches corrected Signal Lock positions: Animal -> Attack, Colour -> Stance,
// Accessory -> Power. Direction correction belongs in the laptop, once.
export const WHEEL_BY_CHANNEL = ["power", "stance", "attack"] as const;
export const CONTROLLER_PINS = [
  { channel: 0, wheel: "power", yellow: 22, orange: 19 },
  { channel: 1, wheel: "stance", yellow: 16, orange: 5 },
  { channel: 2, wheel: "attack", yellow: 15, orange: 21 },
] as const;

export type ControllerInput =
  { type: "turn"; wheel: Wheel; delta: Direction } | { type: "punch" };
// The immutable baseline emits rotation only. Prepared active firmware also emits Power presses.
