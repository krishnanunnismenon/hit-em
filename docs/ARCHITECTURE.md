# Architecture

## Boundaries

- `src/app/`: React composition and settings.
- `src/features/boxing/domain/`: pure typed combat timing, range/guard rules and seeded automatic spacing.
- `src/features/boxing/application/`: external store and bounded 60 Hz stepping.
- `src/features/boxing/scene/`: implemented Three.js arena, articulated fighters, pooled effects and resource lifecycle.
- `src/features/boxing/components/`, `hooks/`, `audio/`: semantic controls, input handling and original score/combat/ambient sound.
- Full contact volumes, broader opponent balance and progression remain later domain milestones.
- `shared/input.ts`: semantic input vocabulary and corrected physical mapping.
- `server/controller-protocol.ts`: preserved serial framing/parser and raw-to-semantic turns.
- `server/controller.ts`: present serial list/monitor only.
- `server/relay.ts` (planned): local-only, authenticated WebSocket input relay on 3110. No combat authority here.
- `hardware/baseline/`: preserved rotation firmware and decoder, not the new button firmware.

Browser simulation consumes semantic wheel changes and punch commands from hardware, keyboard or pointer. Input mode must not change combat rules. Local hardware transport is separate from Signal Lock's room authentication and scoring.

## Timing and animation

Use 60 Hz fixed combat steps, clamped elapsed time and bounded catch-up. Render by interpolation in one master animation loop. Evaluate damage during the defined active attack window with explicit ranges/guard/hurt regions; presentation completion never applies damage. Start with controlled hit volumes and tuned poses rather than rigid-body simulation.

State machine: ready, fighting, paused, victory, loss; per fighter: idle/guard, windup, active, recovery, stagger and knockout. Exact balance values belong to combat session 03. Gameplay input is disabled outside eligible states.

Combat emits events such as punch.started, attack.hit, attack.blocked, defence.perfect, stagger.started, super.started and fighter.knockedOut. Rendering, sound and comic UI consume those events. GSAP handles presentation transitions; combat retains ownership of legal timing. Three.js clips/joint poses follow combat time. Hit-stop/slow motion must be applied deliberately to gameplay and animation clocks, while hardware/connection monitoring remains on real time.

React handles meaningful UI state changes. Do not feed every fighter transform through React state. Reuse geometry, materials, vectors and effects. Preload combat-critical assets before enabling a fight.

## Input contract milestone

The current v1 rotation frame includes epoch and monotonic sequence. Retain framing bounds, duplicate rejection, fresh epochs across pause/fight/reconnect and no stale-input replay in the future relay. Add button frames only after wiring/debounce verification. Latch Attack and Power when a punch is accepted; subsequent wheel changes prepare the next attack. Stance selection needs explicit rules during recovery and stagger, to be finalized in session 03.

Background/USB loss should pause combat and require deliberate resume, avoiding both surprise damage and buffered punches. The study implements hidden-page pause with explicit resume. USB-loss behaviour remains a future relay milestone.

## Storage and ports

Development page 5174, preview 4174, planned relay 3110. Reserve separate routes/processes rather than connecting to Signal Lock's server. Later local campaign/settings persistence can use browser storage with a versioned format; backend persistence/accounts are outside first-playable scope.

## Verification

Current tests cover preserved framing, malformed frames, physical positions/direction, latched study actions, recovery, pause, Super and bounded stepping. Later add final deterministic combat scenarios and pseudo-serial → relay → browser checks without interrupting real hardware or another game. Check laptop frame time and input-to-feedback timing on the actual device before calling performance verified.

## Active technique motion — 2026-10-05

Pure `domain/technique.ts` defines 64 combinations as motor intents. `scene/ActiveRig.ts` integrates body/foot/glove motors at 240 Hz; `Fighter.ts` applies fixed-length IK and toe/support constraints. Stance is now latched on accepted strikes while immediate defensive selection remains a pure rule. The opt-in development technique lab shares commands/rig, isolates scripted damage/opponent intent and supports half-speed rehearsal and local ring recording. Full rigid-body contacts and collision-derived damage remain a later combat milestone. See design/TECHNIQUE-PHYSICS.md.

## Receiving reactions — 2026-10-05

Contact events explicitly identify recipient/attack and stun duration. The pure study engine owns both sides’ stun clocks and interruption. `FaceReaction` deforms fitted prints; `FighterDynamics` queues directional supported recovery steps; `StunBirds` uses six shared instanced pools per fighter, with no per-hit allocation. The master scene clock freezes face, bird and camera response on pause/hit-stop and resets them with the study. Training-only preview commands enter the same event adapter and preserve health. See design/RECEIVING-REACTIONS.md for rules and limits.

## Footwork permutations — 2026-10-05

Pure `domain/footwork.ts` composes 192 cached tactics with the existing 64 technique setups. Independent foot X/Z/yaw motors share the rig clock and fixed-length constraints; combat owns the extra recovery duration and latched tactic. React receives compact accepted-technique metadata for the lab rather than frame transforms. The development lab compares three styles of one setup or sequences all 192, waiting on actual accepted durations. These authored technique offsets remain presentation. The subsequent spacing pass adds separate authoritative root positions that decide range misses. See design/FOOTWORK-PERMUTATIONS.md.

## Knockout choreography — 2026-10-05

The pure study engine owns a typed knockout descriptor, interruption, input locks, exactly-once landing events and result timing. A knockout remains in the sparring phase until its duration completes, with the descriptor preventing further combat; existing pause/hidden-page handling therefore freezes it. `retry` preserves the six-style progression and `reset` clears it. Training-only previews use the same path with unchanged health and hold the fallen pose. `domain/knockout.ts` supplies time-sampled choreography; `KnockoutRig.ts` captures current transforms, solves fixed-length articulated limbs and supports conservative mesh bounds above the mat. A reused pivot avoids fighter mesh allocation. This is authored constrained motion, not a rigid-body ragdoll. See design/KNOCKOUT-FALLS.md.

## Gameplay spacing — 2026-10-05

`domain/spacing.ts` owns bounded ring roots, velocity easing, facing, an engine-only seeded decision stream, weighted rival tactics and reach predicates. Toe anchors are presentation metadata attached to those roots. `study.ts` checks range on acceptance and contact, gates both-side damage/stun/Super and freezes spacing during pause, hit-stop and knockout. `Fighter.walk` interpolates roots and planted toe offsets before the existing physical rig. The scene tracks the pair for readable framing; `RangeRead` consumes the exact engine range snapshot at the existing UI publish cadence. Normal play enables spacing; static training fixtures keep it disabled and the lab exposes a no-damage live toggle. See design/SPACING-COMBAT.md for tuning and verified limits.

## Tactical assessment — 2026-10-05

`domain/reach.ts` holds shared fitted reach constants. Pure `domain/tactics.ts` owns guard coverage, situational damage, counter windows, bounded combination/repeat factors and completed-exchange memory. `spacing.ts` samples weighted guard choices on its existing seeded decision stream and delays coverage 0.32 seconds behind the visible cue. `study.ts` reevaluates geometry/guard/timing at contact, emits resolved reasons and damage, and updates both-side exchange memory once. Training-only scenario commands hold guard/roots without damage. The scene reads cached guard motor goals; semantic timing/impact UI consumes compact snapshots/events. See design/TACTICAL-SCENARIOS.md for scientific inspiration and prototype limits.

## Ordered completion implementation — 2026-10-05

`domain/contact.ts` commits a line on acceptance and tests a swept active tip against fitted head ellipsoids and glove/forearm protection; movement can evade it. This is independent proxy geometry, not full mesh collision or a rigid-body solver. Scene aims follow the committed contact plan and can truncate at guard interception. Actual active-rig lag/recoil is presentation and can differ from the proxy posture.

`domain/opponent.ts` owns three seeded profiles, affordable power, feints without damage and bounded follow-ups. Stagger recovery prevents heavy/counter hits from renewing stun for 4.8 seconds. Campaign encounters use 160/180/200 endurance; the practice/single-study baseline stays 100. `application/Campaign.ts` validates versioned local progress/preferences; React records completed victories and transitions only between bouts. Active fight state is deliberately not saved.

`hardware/active/boxing-controller` adds GPIO4 Power-switch press and release debounce while baseline sources stay immutable. `server/relay.ts` binds loopback3110; approved local Origins bootstrap short-lived one-use WebSocket tokens. Every arm/resume/encounter has a fresh epoch with monotonic sequence rejection. `useControllerConnection` rejects stale browser frames and pauses on disconnect. Keyboard/pointer controls are transport-independent. No controller port was opened in the completion checks; simulation was explicit.


## Selectable rival awareness — 2026-10-05

`domain/difficulty.ts` owns Standard/Ring Sense and private rival observations. A sample of effective stance, stamina, accepted visible strike and completed player punch history is delivered after 0.24 combat seconds. Periodic sampling yields roughly 0.24–0.48 seconds from an arbitrary action to observation. No unthrown attack or power selection enters this sample. The observer runs before spacing decisions and freezes with pause, hit-stop and knockout. Each new encounter/retry clears memory.

Hard-mode weighted attack, guard and spacing decisions consume those observations; they retain the existing seeded streams, stamina, reach, guard telegraph, recovery and bounded chains. Heavy windups may schedule an earlier decision, never before the rival's prior strike recovery plus a 0.35-second gap. Windup remains at least 0.48 seconds; shorter rests and more feints create pressure without health or damage multipliers.

`Campaign.ts` validates difficulty in v1 preferences, migrates old preferences to Standard, and uses independent progress keys. Encounter commands reject difficulty changes during active/paused bouts. The entry screen and settings use one `DifficultyPicker`; physical transport starts a fresh epoch when difficulty changes. No firmware or relay protocol change is needed.

Physical controller status: the user reports all wheels and G4 punch working after setup. The agent did not upload firmware or measure physical USB timing.


## Original audio presentation — 2026-10-08

`audio/score.ts` composes eight-bar rival arrangements; `cues.ts` translates actual typed engine events into short technique/power/guard/stun/fall cues. `FightAudio` owns a gesture-unlocked AudioContext, duplicate-event gate and a bounded lookahead music clock. No combat commands or combat RNG are exposed to audio. Root-step completion snapshots supply quiet foot scuffs; fall-impact events supply landing thumps rather than estimating contact from animation duration.

`AudioRenderer` shares noise buffers, harmonic waves, reverb and a three-bus mix; primary voice concurrency is capped at 48 and short nodes disconnect on completion. Impacts duck the music; compressor and saturation bound the final output. Explicit pause/hidden/mute suspend the context and stop scheduling; disposal closes it. Music retains its beat through brief hit-stop. `preview.ts` reuses the renderer offline for a 12-second PCM WAV; cancellation guards prevent mute/hidden/obsolete previews from starting. Saved validated mix levels migrate old preferences, and changing levels clears the prior export. The corner's three native range controls and optional master Sound preserve the existing UI vocabulary. See design/SOUND-DESIGN.md and the audio review manifest for evidence and limits.
