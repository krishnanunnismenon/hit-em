# Controller provenance

Copied on 2026-10-04 from the local Signal Lock project at `/Users/krishnanunni/Documents/Akhara/signalLock`. This is a standalone copy; no runtime imports or symlinks point to Signal Lock. Original project is user-owned. No third-party license is inferred.

The firmware baseline is preserved byte-for-byte. It has been reported working by the user with channels 0=G22/G19, 1=G16/G5, 2=G15/G21. Its historical comments and diagnostic labels refer to Signal Lock. The boxing laptop adapter assigns Power, Stance, Attack respectively and reverses direction once. The baseline has no encoder-button support.

| Destination | Original relative path | SHA-256 |
| --- | --- | --- |
| `hardware/baseline/signal-lock/signal-lock.ino` | `hardware/signal-lock/signal-lock.ino` | `69971e95b67f8b358d321e2b4b8df527032cc108d8b3d190270429012225a476` |
| `hardware/baseline/signal-lock/Quadrature.h` | `hardware/signal-lock/Quadrature.h` | `8419d85bb9d26ddcf6e5773decfa0d8fd27e0d66dcb3cb7d4ea83deb19bb7231` |
| `hardware/baseline/decoder-test.cpp` | `hardware/decoder-test.cpp` | `e1dbbe562c95170c431fb490fae24fc076c7e324fbf0ba2e9222c96e975dc7a9` |
| `hardware/arduino-cli.yaml` | `hardware/arduino-cli.yaml` | `6aee22a3c304acfeeefc0c7d532010d9c7b29c58e11a42d31387e742cc789fe2` |

`server/controller-protocol.ts` adapts the v1 parser and bounded framing from `server/knob-protocol.ts`, omitting workshop/solo authority and category mapping. `hardware/tools.mjs` adapts the CLI discovery and build helper to the baseline sketch location and exposes only status/build in this foundation. Signal Lock's WebSocket credentials, room engine, assets and UI are not copied.


Active switch revision — 2026-10-05: the user selected GPIO4 in place of the prepared GPIO18 choice. Only the active Power-switch assignment changed; the three rotation channels and laptop direction correction are unchanged. All three preserved baseline source hashes above were checked and still match. The active sketch compiled successfully; no firmware was uploaded.
