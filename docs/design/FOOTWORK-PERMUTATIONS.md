# Footwork permutations — 2026-10-05

This scoped pass answers the request for more defensive footwork and different movement at each power/stance. “Levels” means the existing four power settings. The original fighters, ring and three controls remain the visual contract. Campaign opponents and full collision-based combat remain separate milestones.

## Movement language

Each accepted Jab, Cross, Hook or Uppercut now has three deterministic footwork tactics within its latched stance/power: direct entry/reset, a lateral lane change, or a pivot/angled exit. There are **192 authored paths**: 4 attacks × 4 stances × 4 powers × 3 tactics. Successive accepted punches cycle the tactics; this adds variety without another control or frame-random twitching. Names label the authored presentation rather than certifying a particular athlete's technique.

| Stance | Power 1 | Power 2 | Power 3 | Power 4 |
| --- | --- | --- | --- | --- |
| Defensive | Catch/pull, outside slide, pivot check | Pull counter, slip/slide, L-step counter | Brace/answer, roll outside, check/turn | Shell counter, loaded slip, heavy pivot exit |
| Offensive | Probe, lane cut, step around | Step/follow, diagonal pressure, corner turn | Drive/brake, cut-off, pressure pivot | Committed drive, loaded cut-off, crushing turn |
| Neutral | Quiet plant, small angle, toe turn | Step/set, outside set, pivot/set | Weight transfer, angle plant, torque/reset | Heavy plant, loaded angle, power pivot |
| Super | Burst step, flash angle, burst pivot | Spring drive, lane switch, spiral entry | Loaded burst, angle breaker, coiled turn | Full-body drive, explosive angle, corkscrew exit |

The Jab keeps its small range-finding step; the Cross emphasizes rear-leg drive and toe rotation; the Hook transfers across the support base with a lead pivot; the Uppercut closes inside range and loads/extends the knees. Defensive Uppercuts regain inside range before contact, then retreat during recovery. Lateral/pivot entries change independent foot X/Z and yaw; they are not just a symmetric wider stance.

Defence catches on the rear foot before the follow. Pressure generally steps with the lead foot first. Entry swing windows occupy separate portions of the existing windup, settling both feet before contact. Recovery changes the travel order and describes an angled arc back to a ready base, rather than rewinding the entry. Higher power widens the base, loads the knees more deeply and adds recovery time. Fatigue reduces stride by up to 24%, alongside existing lowered guard/reduced effort. Supported foot/hip/trunk timing still precedes hand release.

## Ownership and physical limits

`domain/footwork.ts` caches 192 immutable plans and supplies pure lower-body goals. `technique.ts` composes them with the existing kinetic chain and distinct hand paths. Independent lead/rear X motors join Z/yaw/heel motors in `ActiveRig`; transforms remain outside React on the existing 240 Hz clock. The pelvis support bound follows the asymmetric foot base. Fixed-length IK and the leg-reach ceiling remain intact.

Low foot flight follows a bounded parabola with a maximum 0.045 m rise; capping the peak retains the arc instead of producing a flat hover. Horizontal movement has finite motor response. Planned swings are suppressed when the opposite foot is recovering from impact. At least one toe remains supported. Reset reseeds current neutral flight intent as well as the motors, so a previous swing cannot survive a reset at zero elapsed time. Waist roll also returns with the drive envelope.

The pure 60 Hz engine alone accepts strikes and owns their recovery. Recovery additions are stance/power/tactic dependent (0–0.155 s beyond the prior attack/power duration), with unchanged contact times, stamina costs and damage amounts. The accepted tactic, stance, power and duration remain latched; wheel turns prepare the next action. Pause/hit-stop freeze the same clock. Rendering and foot position do not award a dodge, perfect defence or hit.

These are authored boxing-inspired motor goals with constrained IK, not a measured human gait, full rigid-body skeleton, friction/contact solver or collision-derived fight. Toe-landmark checks do not certify every boot triangle or zero sliding. The current opponent/outcome pattern remains visibly scripted. Existing figure-fidelity REBUILD/FAIL reviews remain unchanged.

## Review controls and verification

The opt-in development route `?motionLab=1` shows the accepted technique and live footwork name/style. “Try 3 footwork styles” repeats the selected setup across all three tactics. “Play all 192” uses three passes through 64 setups; the existing accepted-punch variant cycle covers all three styles for every setup. It waits on the actual accepted duration, includes a guard beat, pauses with combat, and can be stopped/reset. Half speed scales presentation and combat together. Production ignores the training route.

The final suite has **43 passing tests**, plus a successful production TypeScript/Vite build and formatting check. New checks cover:

- All 192 pure paths, non-overlapping swings, uncrossed/ordered feet, both feet down at contact, unique footprints and complete return to guard.
- Power commitment/recovery and fatigue without changing hand contact timing.
- All 192 accepted setups/tactics through the actual engine, latched across selection changes, with no rehearsal damage/opponent attacks.
- All 192 paths on **both actual GLBs**, through entry/contact/recovery/settling, with supported toes and fixed 0.43 m thigh/shin lengths. Face contact stays within the existing 0.04 m reach limit.
- Actual angled foot movement at 30/60/120 Hz; zero-elapsed pause; reset during swing; and an incoming impulse during a step.

One combined desktop/narrow/reduced-motion inspection was followed by a correction batch and final browser confirmation. The final clip exposed a boot touching the short lab canvas edge; its desktop/portrait fields of view were widened to 42°/54° for footwork inspection, with normal sparring at the existing 38°/50°. A replacement clip confirms the extra room. Desktop is 1672×941; narrow is 390×844 with DOM width/scrollWidth 390/390. The comparison completed 3/3 in the live browser. The 192-run button's progression, pause/resume and stop/reset were checked; full 192 coverage is from deterministic tests, not a claim that the entire browser sequence was watched. Reduced motion preserves essential footwork and static stun cues while suppressing ornamental camera/effects.

`.impeccable/review/footwork-motion.webm` is an actual canvas recording of the three Defensive/Cross/Power-4 tactics at half speed. `footwork-motion.mp4` is its codec conversion with unchanged timing. No concept backplate, synthetic pose or microphone audio is present. `footwork-capture-manifest.json` binds source/model hashes, native screenshot inventory and measured media metadata. The clip is evidence of that comparison, not every combination or sustained render performance. The final MP4 is 1672×558, 11.966016 seconds, with 333 decoded frames (approximately 27.8 captured frames/s, not render FPS). Earlier model and reaction recordings retain their own evidence records.
