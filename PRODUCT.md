# Boxing game

## Purpose and platform

Standalone, single-player, browser-based 3D boxing controlled by an ESP32 with three rotary encoders. Primary device: the user's laptop. A responsive keyboard/pointer fallback is planned; mobile performance is a future measured target, not a verified capability. Mode: Experience — the fight leads and the interface supports it.

## Confirmed gameplay

- Attack choices: Jab, Cross, Hook, Uppercut.
- Stance choices: Defensive, Offensive, Neutral, earned temporary Super.
- Power choices: four levels. Press the Power encoder button to punch.
- Changes of stance apply immediately. Timely Defensive changes earn strong blocks/slips; staying Defensive offers weaker protection.
- Attacks have situational advantages rather than exactly one required counter.
- More power costs more stamina and increases recovery time.
- Good counters, defence and combos build Super. It is a temporary stance.
- Good counters earn stagger windows that allow time to rotate and follow up.
- The first fight is forgiving, with readable tells and generous openings.
- Combat is continuous; characters are fought in succession and the presentation should feel cinematic.

## Accepted starting defaults

The user accepted the proposed stack/design direction as a whole after three camera/movement/Super options were presented. Use these recommended starting defaults, subject to tuning rather than treating them as separately answered choices:

- Camera just behind and above the player's boxer, showing both fighters. Brief dramatic framing on major events must preserve readable combat.
- Automatic footwork and spacing influenced by stance; no additional movement control.
- Selecting Super before the meter is full preserves the previous effective stance and shows a clear unavailable cue.

## Visual commitment

Confirmed on 2026-10-04: illustrated concept frames first, and an underground comic fight club for the first ring. The shown visual treatment was accepted with revisions: remove environmental lettering and reduce crowd density to approximately half. Smooth animation with minimal repetition is the next priority. Final fighter names and roster remain open.

Chunky, semi-LEGO articulated toy fighters and Marvel-comic-inspired lettering, impact bursts and graphic energy. Use original character identities, model shapes and graphics. Moulded plastic fighters in a printed comic world; simple but impactful animation. Lettering may be exuberant while preserving the opponent's tells and essential meters.

## First playable scope

One player, one opponent, one ring, all four punches, four power levels, stance/defence, stamina, stagger, Super, victory/loss and retry. Finish one complete fight before expanding the roster. Campaign count, character names, encounter duration and exact balance values remain undecided.

## Stack

React, TypeScript, Vite, pnpm, direct Three.js, GSAP presentation, native Web Audio, local Node serialport/WebSocket relay, and a pure TypeScript combat engine. Combat on a fixed timestep; rendering interpolated. Browser owns solo combat; Node delivers hardware input.

## Boundaries and status

On 2026-10-04 the user chose to focus on design first, then controller connection. Foundation prepared on 2026-10-04; user has not requested a deployed game or remote repository. Signal Lock stays independent. Working encoder rotation firmware is copied as a baseline; Power-button wiring and support are a separate milestone. Do not overwrite the sibling project, flash the controller or claim unimplemented features are working.

## Spacing prototype status — 2026-10-05

The latest user request authorizes automatic footwork as gameplay. Both fighters now move; Defensive seeks space, Offensive applies pressure and Neutral seeks the chosen punch's range. Weighted rival decisions use range, stamina, health, stance and heavy windup. A distant press misses, and stepping out before contact can make either side miss. A timing strip shows reach, rival movement and guard. Live spacing can be rehearsed without damage in the development motion lab. These are shipped prototype rules subject to balance tuning; full collision volumes and the hardware button/relay remain separate milestones.

The tactical refinement adds boxing-informed situational advantages: lowered side guards favour different straights, high central coverage favours an inside Hook, and wide gloves favour a close Uppercut. Defensive counters, Offensive pressure and Neutral recovery provide distinct benefits. Varied landed lines earn bounded combination rewards, while completed repeats influence the rival's future weighted guard and reduce surprise. The timing UI names current openings and resolved reasons. Development Opening studies isolate the rules without damage. Numeric balance and long-run engagement still need playtesting; docs/design/TACTICAL-SCENARIOS.md records the parameters and evidence.


## Ordered completion request — 2026-10-05

The user authorized completing the remaining roadmap in order. Campaign scope is now three playful underground rivals, targeting roughly 6–10 minutes. Finish all game design and presentation before ESP32 wiring/connection; the Power switch is not yet wired. Continue the accepted visual world and figures. Contact reliability, opponent behaviour and balance precede final visual slice validation and campaign progression. Software can be prepared without claiming physical input is verified; do not flash or stop Signal Lock's serial process automatically. Publishing or creating a remote repository is not requested.

Implementation update: three original rival profiles, campaign/practice/results and versioned local progress are implemented. Active Power-switch firmware assigns GPIO18 and has compiled, with simulated relay/browser input verified. No physical wiring or upload is claimed. Human 6–10 minute pacing and exact model fidelity remain review targets.


Latest user steering: defer all physical wiring, connection and upload until after the user's personal design review. Current work is limited to design and functionality. The completed software campaign, practice, win/loss/retry, ending, saved progression and restart have been exercised in the browser. The prepared controller software is dormant; no firmware has been uploaded.


## Controller setup resumed — 2026-10-05

The user now asks to build using the ESP32 and selects free G4 for the Power encoder push switch. This revokes the earlier hardware deferral for setup work. Active firmware and the setup guide use GPIO4 instead of the prepared GPIO18 choice. Existing rotation wiring and laptop direction correction remain unchanged. Physical switch wiring, upload and live turn/press verification are still unconfirmed; do not upload automatically or stop Signal Lock's bridge.


Controller setup handoff: the user reports the G4/GND switch wires connected. The Mac detects the Silicon Labs serial device at `/dev/cu.usbserial-0001`; no process held either cu/tty path at the check. Firmware upload and the live button/rotation test remain pending. The prepared VS Code upload task is the next deliberate user-run step.


## Physical controller confirmation — 2026-10-05

After the G4 setup instructions, the user reports “everything is good, great job.” Treat the three wheels and Power press as user-confirmed working. No agent upload or physical USB latency/disconnect measurement is claimed. This supersedes the earlier pending wiring/upload status. Power rotation remains G22/G19, Attack G15/G21, Stance G16/G5; press is G4/GND.

## Name candidates and difficulty — 2026-10-05

The user requested a cool name and an increased-difficulty option with strong awareness and fighting. Name candidates: Knuckle Theatre (recommended), Punchline, Dial of Fury, Rumble Reel and Turn for Turn. No final name was selected and branding remains unchanged.

Implementation interprets the awareness request as a smarter computer rival; a focused clarification was presented and remains unanswered. Ring Sense · Hard is selectable before a campaign bout, with separate local progress from Standard. It reads delayed visible actions and completed punch history, adjusts guard and space probabilistically, counters heavy windups/recovery, uses more feints and shorter rests, and preserves readable tells, costs, recovery and bounded chains. It never reads unthrown attack/power knob selections. Standard remains the default for older settings. Reaction memory resets per encounter/retry. Desktop/mobile selector and reload/paused-bout locks were verified. Human difficulty and campaign pacing still need playtesting; automated checks do not establish that every seed or policy is harder.


## Basement funk sound — 2026-10-08

The user requested music, boxing sounds and funny creative effects, and selected basement funk: bass, drums and playful brass. Original procedural native Web Audio arrangements now give Pip, Bram and Juno distinct grooves. Accepted combat events drive technique/power contact palettes, misses, perfect guards, counters, Super, both-side stunned birds, six fall anticipation signatures and actual landing thumps. Sparse synthesized room and crowd layers complete the ring. Sound remains optional; Your corner contains saved Music/Fight effects/Ring ambience levels plus a playable/exportable 12-second sound check. Audio consumes gameplay without changing combat rules or hardware. Browser lifecycle and output waveform were verified; subjective mix approval and physical phone audio performance remain listening/testing targets. See docs/design/SOUND-DESIGN.md.
