# Motion contract — animation first

On 2026-10-05 the user redirected the next pass to distinct punch techniques, stance/power combinations, legs and waist rotation. That request authorizes the completed active-physics motion pass; see [TECHNIQUE-PHYSICS.md](TECHNIQUE-PHYSICS.md). No further character sculpting was performed. The earlier figure-fidelity REBUILD verdicts remain unresolved and are not acceptance of the new motion.

Status: design requirements accepted in principle by the user's 2026-10-04 emphasis on smooth animation and minimal repetition. The user’s 2026-10-05 choice to continue character modelling authorizes the implemented dedicated Blender/GLB asset pass and its review-driven rig/staging correction. The first approved Ringside flash frame remains the exact visible figure authority. Both the [first authored-asset review](FINISH-REVIEW-AUTHORED-ASSETS.md) and the [fresh full review of its correction](FINISH-REVIEW-AUTHORED-ASSETS-REBUILD.md) return REBUILD. Evidence/persistence pass; exact visible figure identity/construction and decisive contact silhouettes remain unmet. Under Impeccable’s second-REBUILD rule a separate user decision is still required before another character-modelling pass; the subsequent technique-motion request authorizes the scoped rig work documented above. Labelled static windup/contact/recoil fixtures and one rolling last-600-frame laptop sample do not certify smoothness, minimal repetition or the exit evidence below. Timings and counts remain approved design targets rather than final combat balance guarantees; implementation and measured limits are recorded in IMPLEMENTATION.md.

## Thesis

The focal moment is a punch that transfers weight through a toy boxer's feet, hips, shoulder and glove, then produces a directional opponent reaction. Smoothness means continuous movement between valid poses, with intentional brief contact accents. Variety comes from context rather than random changes to attack legality. The ring and UI stay quiet between meaningful combat events.

Continuity: guards, footwork, stance changes, recovery and reaction must begin from the actual current pose. Feedback: wheel selection is immediate; a legal punch starts without a presentation delay; hit/block/whiff are visually different. Budget: one master render loop, bounded crowd motion and effects; the two fighters receive most animation detail.

## Punch identity

| Punch    | Authored trajectory and weight                                                               | Variation while keeping identity                                                                     |
| -------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Jab      | Short straight lead glove, modest forward shift, quick return. Rear glove protects the face. | Guard height, small extension/recovery differences, fresh versus fatigued support.                   |
| Cross    | Rear glove travels straight with hip/shoulder rotation and a planted lead foot.              | Follow-through amount and finishing guard based on power, preceding jab and outcome.                 |
| Hook     | Compact lateral elbow/glove arc, torso pivot and clear weight transfer.                      | Arc height and brace pose within the authored attack; direction follows the canonical striking hand. |
| Uppercut | Knee/hip dip into a rising glove, compact elbow and grounded finish.                         | Dip depth and follow-through within power/fatigue limits; no identical lift reaction on every hit.   |

Use a consistent orthodox starting stance (left jab/hook, right cross/uppercut). Do not randomly switch hands or attack targets as decorative variation; combat rules own those changes.

Author at least two pose/recovery variations per punch and three compatible guard/idle accents for the first motion study. A short recent-history rule avoids immediate repetition where compatible alternatives exist. These counts are proposed build targets, not extra game mechanics. Low amplitude breathing, guard adjustments and weight shifts blend with stance and stamina instead of resetting a single visible loop.

## Context and outcomes

- Power changes windup commitment, torso/hip involvement and recovery. It is more than a faster copy of one clip.
- Fresh versus fatigued posture affects guard height and breathing without changing attack active timing beyond the combat contract.
- Hit reactions match glove direction, impact strength and current balance. Use compact recoil, braced step and stagger as distinct authored families.
- A block compresses gloves/forearms and moves the defender's body modestly; a whiff completes follow-through and exposes recovery.
- Repeated punches may look related because they share recognizable technique, but should not replay the same head recoil, camera shake, comic word and crowd cheer together.
- Crowd reactions use independent phases and subsets, responding to major events rather than cheering in synchrony. Keep approximately half the original concept density and no environmental slogans.

## Continuity and fairness

Blend from current joint orientations with quaternion interpolation and short pose-aware transitions. Keep foot contacts anchored during planted phases; solve the root/legs so the fighter does not skate. Blend upper-body guards separately where legal. Legal interruption/cancellation belongs to combat, not the animation system.

Latch Attack and Power at punch acceptance. Subsequent wheel changes prepare the next punch; do not bend a glove trajectory halfway through a strike. Visual variants retain the same collision/active window for the same attack, power and combat state. Blend phase transitions without erasing the contact silhouette.

Use combat time for fighter action phases and presentation-only variation with a separate seeded sequence. Random visual choices must not consume or change opponent/gameplay randomness. Replaying the same fight/input seed must reproduce damage results regardless of visual variation.

## Cinematic restraint

Normal play holds a stable behind/above-player camera. Counter/stagger can use a bounded contact push or shake without hiding the opponent or UI. Super adds short local colour echoes; it does not produce a continuous screenwide flash. Reserve dramatic framing for entrance, safe fight-ending moments and exceptional contact.

Contact accents can start around 30–65 ms in the motion study, with stronger hits earning the longer end. Do not stack pauses across rapid hits; use a cooldown and tune with wheel interaction. Apply hit-stop deliberately to both fighter/action clocks; UI, input connection checks and accessible feedback remain responsive. Do not consume the earned stagger opportunity while the player is visually frozen.

Low-power attacks need little or no camera impulse. Camera and text variation are bounded and cannot be a substitute for good joint motion. Use a small pooled bank of sound/reaction/effect variations, avoid immediate repeats and keep impact sound aligned with contact.

## Runtime and performance

60 fps is a measured laptop goal, not a promise. Use 60 Hz fixed combat steps with interpolated rendering, bounded catch-up and one master requestAnimationFrame. Fighter transforms stay outside React state. Reuse skeleton/geometry/material resources and pool transient effects. GSAP owns bounded HUD/cinematic transitions; combat clock owns punch timing.

Preload the first fight's critical models/clips/sounds. No downloads, shader compilation spikes or asset creation should happen at the first punch. Cap device pixel ratio, shadows and crowd updates based on measured costs. Stop hidden/background rendering and pause the fight deliberately. Reduced-motion disables shake, travelling text and colour echoes, retaining essential punch poses, guard reads and feedback.

## First motion study

Before ESP32 button work, create a keyboard/pointer animation lab for one player, one rival and the accepted ring. It should demonstrate guard/stance blends, all four punches at four power levels, hit/block/whiff, fatigue, stagger and Super presentation. Clearly label it a motion study with scripted outcomes, not a complete combat game.

Include repeat-punch and mixed-combo sequences, immediate stance changes when legal, interrupted transitions, reduced motion and pause/resume. Observe a 60-second steady fight and a repeated-attack sequence on the user's actual laptop. Record render frame-time distribution, major stalls, draw calls and input-to-visible-response latency. Judge foot sliding, glove arcs, self-intersection and transition snaps visually. Adjust asset/effect costs based on evidence; do not claim smoothness from a screenshot.

## Exit evidence

- Punch types remain recognizable without overlay text.
- Repeated actions vary appropriately while retaining timing and technique.
- No reset snaps, obvious foot sliding, stuck recovery or mismatched hit reactions in reviewed sequences.
- Incoming tells and selected controls stay readable.
- Reduced motion and hidden-tab resume preserve clear state.
- Real laptop capture and performance measurements accompany the handoff.
