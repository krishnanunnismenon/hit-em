# Boxing game

A standalone solo 3D boxing game controlled by three rotary wheels and a press on the Power wheel. Working title; the final name is undecided.

**Current milestone: playable three-rival campaign and practice.** Pip probes and moves; Bram pressures with heavy punches; Juno feints and counters. Committed swept punch paths, fitted head/guard volumes, seven guard shapes, range, stamina, timed defence and earned Super decide contact in a seeded fixed-step engine. Versioned local progress remembers cleared bouts; reload starts the next uncleared bout. Practice is available at `/?practice=1`, without damage, for openings, footwork, reactions and six knockout falls.

This is still an authored physics-inspired prototype, not full rigid-body boxing simulation or an exact source-model reproduction. The 6–10 minute campaign remains a human playtest target. Keyboard/pointer play and simulated transport are verified. The user has also reported the three physical wheels and G4 Power press working successfully; USB latency and disconnect recovery have not been measured on the physical device. See [completion evidence](docs/COMPLETION-EVIDENCE.md) and [hardware steps](hardware/SETUP.md).
## Run locally

Node >=22.12 and pnpm 11.3:

```sh
pnpm install
pnpm dev
```

Open http://localhost:5174/. Signal Lock remains on 5173. The optional local relay uses 3110 and starts separately with `pnpm controller:relay --port <ESP32-port>`.

| Control                                        | Keyboard     | Pointer                     |
| ---------------------------------------------- | ------------ | --------------------------- |
| Jab / Cross / Hook / Uppercut                  | A / D        | Attack dial or named option |
| Defensive / Offensive / Neutral / earned Super | J / L        | Stance dial or named option |
| Power 1–4                                      | Left / Right | Named level                 |
| Punch                                          | Space        | Press Power dial            |
| Pause / resume                                 | P / Escape   | Stage pause control         |

Space starts the study from the ready screen. Attack and power latch when a punch starts; changing either during recovery prepares the next punch. Timed defence earns an opening. Super becomes available after charge fills. Choose **Standard** or **Ring Sense · Hard** on the entry screen before entering the ring. Ring Sense rivals learn completed punch habits, react to visible heavy windups, use more feints and take shorter rests. Health, damage rules, reach and stamina costs stay the same. Each difficulty has separate campaign progress; changing difficulty is disabled during a bout. Practice retains its isolated Standard rules. See [difficulty tuning and evidence](docs/design/DIFFICULTY.md).

Settings include reduced motion, optional sound and live rendering statistics. Returning from a hidden page requires deliberate resume.

**Basement funk sound:** open **Your corner → Sound**, then **Play sound check** to hear the original bass, drums, keys and playful brass. Each rival has a different groove, with separate cues for punches, misses, guards, stunned birds and six comic falls. Music, Fight effects and Ring ambience have saved volume controls. **Save sound check** exports a 12-second WAV. After reload, tap the speaker to unlock browser audio before using USB-only input. See [sound design and verification](docs/design/SOUND-DESIGN.md).

```sh
pnpm test
pnpm build
pnpm format:check
pnpm controller:list
pnpm controller:monitor --port /dev/cu.usbserial-0001
```

The serial monitor and relay require exclusive ownership of the ESP32 port. Stop the other bridge yourself before connecting. The keyboard and pointer work independently of USB. See hardware/SETUP.md for the deliberate upload and connection steps.

## Structure and next work

Feature modules separate pure study rules, application state, Three.js presentation, accessible React controls and audio. See [implementation](docs/design/IMPLEMENTATION.md), [architecture](docs/ARCHITECTURE.md) and [motion contract](docs/design/MOTION-CONTRACT.md). Approved concepts and asset provenance are in docs/design and .impeccable/mocks. Ordered follow-up prompts are in docs/sessions.

This is a separate local repository beside Signal Lock. It has its own dependencies and lockfile, no sibling runtime imports, and no publishing or GitHub remote. Existing game code and hardware baseline remain unchanged.
