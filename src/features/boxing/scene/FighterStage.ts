import type { Fighter } from "./Fighter";

/** Ring spacing keeps both fixed-length rigs within a legal-looking punch reach. */
export function stageFighters(
  player: Pick<Fighter, "place">,
  rival: Pick<Fighter, "place">,
) {
  player.place(-0.44, 0.055, 0.57, 2.5);
  rival.place(0.37, 0.055, -0.51, -0.64);
}
