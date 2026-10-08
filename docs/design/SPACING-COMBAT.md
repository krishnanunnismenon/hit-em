# Live spacing and punch timing — 2026-10-05

Both boxers now have authoritative ring positions in the pure 60 Hz engine. Automatic movement changes whether a punch can land. This replaces the previous repeated scripted hit/block/miss pattern in normal sparring. The three existing controls still select attack, stance and power; no movement control was added.

## Range and timing

A press outside the selected attack's reach is latched as a miss. Moving into range during that windup cannot rescue it. A press inside reach is checked again at contact: a retreat beyond reach makes it miss. These rules apply to both fighters. Misses cause no damage, stun or Super gain but still spend stamina and complete recovery. A successful timed guard requires an incoming punch that is actually in range.

Prototype root-to-root scene distances:

| Attack | Reach |
| --- | ---: |
| Jab | 1.50 |
| Cross | 1.48 |
| Hook | 1.38 |
| Uppercut | 1.32 |

These are tunable values for the existing toy rigs, not measured human boxing reach or mesh-collision claims. Punch type has a range tradeoff; power keeps its stamina, windup, damage and recovery tradeoffs rather than extending an arm.

## Movement and opponent choices

| Effective stance | Preferred gap | Base pace |
| --- | ---: | ---: |
| Defensive | 2.12 | 0.46 |
| Offensive | 1.20 | 0.48 |
| Neutral | Selected reach − 0.06 | 0.28 |
| Earned Super | 1.18 | 0.62 |

Low player stamina adds 0.15 to the preferred gap and reduces movement pace. An accepted attack or stun locks that boxer's root while the other can keep moving. Velocities ease toward targets; positions stay inside a radius of 1.75, with a minimum separation of 1.12. Facing follows the opponent at a bounded angular speed.

The rival chooses advance, retreat or circle at intervals of 1.25–2.30 combat seconds. Normalized probability weights favor closing a large gap, retreating with low stamina/health or a visible heavy windup, and circling at close range. Player stance and fatigue also influence the weights. Decisions wait while the rival is throwing or stunned. A seeded engine-only random stream makes different choices reproducible in tests; retry changes that stream and Reset restores the original seed. Rendering never draws gameplay randomness.

Advancing exposes the guard, retreat raises it, and circling lowers it. High guard blocks Jab/Cross; low guard blocks Uppercut. Hook can work around high guard. An existing stagger, earned Super or rival windup can offer a counter, still subject to range. The rival selects plausible punch types for the current gap and spends its own stamina. Movement is probabilistic; an out-of-reach miss is geometric, not a random dice roll.

## Presentation and rehearsal

A flat timing strip reports the selected punch's reach, rival movement and guard. The rival marker entering the yellow band means the punch is in range; guard and movement during windup can still prevent a hit. Feedback distinguishes a distant press from a rival stepping away. The body roots and alternating world-space toe anchors interpolate together. Fixed-length IK, supported soles, existing punch tactics and receiving reactions remain active. Essential locomotion remains under reduced motion; camera shake and decorative responses retain their existing reduced-motion treatment.

The camera tracks the pair's midpoint and keeps a three-quarter view as they circle, widening for separation. Controls follow the timing strip; rehearsal tools follow the controls so touch input stays near the range readout.

At `http://localhost:5174/?motionLab=1`, enable **Live spacing** to start a wider, no-damage rehearsal. Stances and range misses work through the same engine, with no rival attacks. Unchecking or Reset returns to the static technique lab. The 192-technique and six-fall comparisons retain their isolated fixtures.

## Verification and evidence

- All **66 tests** pass; production build and format check pass.
- New engine checks cover both-side misses, guard/range boundaries, no damage or charge from misses, stance travel, weighted decisions, seeded variation, a two-minute bounded mixed-footwork run, pause/hit-stop/knockout, reset/retry and lab isolation. Commands reproduce identical state at 30/60/120 render rates.
- All 384 attack/stance/power/footwork contact fixtures (192 per boxer) reach the fitted authored knuckles within 0.04 scene units at the new gameplay limits.
- Both actual GLBs pass a 30-second approach/retreat/punch trajectory with fixed 0.43 leg segments and at least one supporting toe. Quiet planted locomotion stays below 0.005 scene units of toe drift per sample; intentional stance changes and punch footwork are separate from this quiet-plant measure.
- Browser verification covered desktop 1672×941, narrow 390×844, reduced motion and paused timing. Final narrow document width equals viewport width; no console errors were reported. This is viewport QA on the laptop, not a performance certification on a phone.
- Full combat: distant uppercuts left rival health at 100 and Super at 0; an in-range power-four cross changed rival health to 84 and Super to 16. The unattended test eventually reached the existing player knockout/result flow.
- `.impeccable/review/spacing-motion.webm` is the actual canvas recording of live stance movement, a distant miss and a hook whose recipient steps away. `spacing-motion.mp4` is an H.264 conversion with one-pixel right/bottom padding and unchanged timing: **1658×512, 25.963 seconds, 780 decoded frames**. Capture throughput is not render FPS.
- Native desktop, narrow, reduced-motion, paused and full-combat screenshots and source/asset hashes are recorded in `spacing-capture-manifest.json`.

The model assets and historical character-fidelity verdicts are unchanged. This is a first-opponent spacing prototype with authored physical presentation, not a full rigid-body boxing simulator. Contact volumes, broader opponent balance, campaign progression and controller connection remain later work.
