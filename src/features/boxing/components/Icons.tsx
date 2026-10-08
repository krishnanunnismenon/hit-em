import type { SVGProps } from "react";
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & {
  name:
    | "pause"
    | "play"
    | "sound"
    | "mute"
    | "settings"
    | "close"
    | "reset"
    | "arrow"
    | "bolt";
}) {
  const paths = {
    pause: "M8 5v14M16 5v14",
    play: "m8 5 11 7-11 7Z",
    sound: "m4 9 4 0 5-4v14l-5-4H4Zm12-1c2 2 2 6 0 8m3-11c4 4 4 10 0 14",
    mute: "m4 9 4 0 5-4v14l-5-4H4Zm12 0 5 6m0-6-5 6",
    settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
    close: "m6 6 12 12M6 18 18 6",
    reset: "M5 8a8 8 0 1 1-1 8M5 3v5h5",
    arrow: "m9 5 7 7-7 7",
    bolt: "m13 2-9 12h7l-1 8L20 9h-7Z",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
