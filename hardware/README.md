# Controller baseline

The physical controller works. Keep its current wiring:

| Raw firmware channel | Boxing wheel | Yellow | Orange | Common |
| --- | --- | --- | --- | --- |
| 2 | Attack | G15 | G21 | GND |
| 1 | Stance | G16 | G5 | GND |
| 0 | Power | G22 | G19 | GND |

The laptop adapter reverses raw direction exactly once, matching Signal Lock's corrected controls. G2 remains unused; its stuck-LOW cause is unconfirmed.

## What works in this foundation

- `pnpm controller:list` lists candidate serial devices.
- `pnpm controller:monitor --port /dev/cu.usbserial-0001` prints named wheel turns using the existing firmware.
- `pnpm firmware:status` checks the installed Arduino CLI/core.
- `pnpm firmware:build` compiles the separate active boxing sketch without uploading.

Stop Signal Lock's monitor/bridge before running this project's monitor. Only one process can own the ESP32 USB port. Find the Silicon Labs CP2102 device; do not select the Anker hub.

## Power-button milestone

Pressing Power to punch is agreed, but its button terminals are not connected or supported by the baseline firmware. The active sketch assigns GPIO4 with internal pull-up and 35ms debounce, emitting once per press after a stable release. The two small switch terminals connect between G4 and GND; physical wiring and upload are pending.

The new firmware must retain v1 rotation messages and ARM/STOP behavior so the three existing rotations continue working with Signal Lock. The boxing application will also accept Space/pointer input for development. Do not flash anything as a side effect of repository setup.

See `PROVENANCE.md` for exact copied-file hashes.

The button/relay implementation is now prepared and compiled. Follow [SETUP.md](SETUP.md) for the physical setup. GPIO4 is assigned to the Power switch; it remains physically unverified. The preserved baseline files have not changed.
