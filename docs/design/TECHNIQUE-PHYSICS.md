# Punch techniques and active physics — 2026-10-05

The user redirected the next pass to punch identity, stance, power, legs and waist rotation. This authorizes the current motion/controller changes. Existing fighter GLBs, Blender source, ring, camera, input pin mapping and hardware stay fixed. The two previous character-fidelity reviews remain REBUILD; this motion pass does not turn them into a visual acceptance verdict.

## Research and interpretation

[Stanley et al., 2018](https://www.tandfonline.com/doi/abs/10.1080/24748668.2018.1525651) measured different kinetics/kinematics across straight, hook and uppercut punches, with differences in delivery time and segment velocities. [Dinu and Louis, 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7739747/) describe proximal-to-distal segment coordination and different body/segment contributions across crosses, hooks and uppercuts. [The lower-limb kinetics study](https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/) supports lower-body drive and fatigue-sensitive force transfer.

The implementation interprets those principles for articulated toy fighters. It does not copy motion-capture data, reproduce a measured athlete, or claim validated professional technique. Numerical mass, motor stiffness, angular inertia, flight windows and recoil impulses are tuning parameters.

## The 64 combinations

Every accepted strike latches Attack, effective Stance and Power. Later stance turns still affect defence immediately and prepare the next technique; they cannot reshape the accepted punch halfway through its flight. Existing legal contact times, stamina cost, recovery and earned temporary Super remain in the pure engine.

| Stance    | Jab          | Cross          | Hook          | Uppercut           |
| --------- | ------------ | -------------- | ------------- | ------------------ |
| Defensive | Stop jab     | Slip cross     | Check hook    | Counter uppercut   |
| Offensive | Step jab     | Driving cross  | Pressure hook | Inside uppercut    |
| Neutral   | Snap jab     | Straight cross | Lead hook     | Rear uppercut      |
| Super     | Piercing jab | Spear cross    | Torque hook   | Corkscrew uppercut |

These are presentation identities, not 16 new damage rules. Four power levels vary leg loading, hip/shoulder rotation, heel pivot, approach step, commitment and the existing recovery duration. Power 1 stays compact; 2 is technical; 3 loads more of the body; 4 commits more deeply and recovers more slowly. Super amplifies the same grounded chain instead of introducing a flying punch.

- Jab: lead-hand straight path, modest torso turn, rear glove in guard, small stance-driven lead step.
- Cross: rear-leg drive and toe pivot, hips initiate before trunk/shoulder, lead support receives the weight. Defensive Cross adds a small slip.
- Hook: lateral hand/elbow sweep with lead-foot pivot and transverse weight transfer. Inside range uses a lead step and rear follow.
- Uppercut: knee/hip loading below guard, rising compact arm path and knee extension. Inside range is closed with sequential steps; both feet do not intentionally jump.
- Recovery: retract directly to the current guard rather than replaying the outgoing curved trajectory backwards.

Fatigue lowers guard and reduces effort. The free glove stays in guard. Original canonical hands remain: local +Z faces the rival, +X is lead Jab/Hook, −X rear Cross/Uppercut.

## Physical controller and boundaries

`domain/technique.ts` supplies pure technique intents in metres, radians and seconds. It separates load, hip drive, shoulder turn, hand release and recovery. `scene/ActiveRig.ts` integrates driven translations and rotations on one bounded 240 Hz clock. Rendering rate does not own the motor trajectory.

For each scalar motor, stiffness is `k = m × omega²`, critical damping is `c = 2 × m × omega`, and implicit Euler integrates:

```
v_next = (m × v + dt × k × (goal - x)) / (m + dt × c + dt² × k)
x_next = x + dt × v_next
```

Thus pelvis, trunk, feet, glove position and glove orientation have finite mass/inertia and continuous motor response rather than direct wrist assignment or pose lerps. Technique targets are authored; the motors drive actual movement. IK resolves constrained fixed-length limbs: arms 0.5 + 0.5 m with 0.985 m maximum wrist reach, legs 0.43 + 0.43 m. A leg-reach ceiling brakes pelvis height instead of stretching a shin. A conservative rectangular support bound limits COM displacement.

Boots pivot around their supported toe landmark `(0, −0.137, 0.17)`. Lead/rear swings are sequenced, with gravity-shaped vertical flight and finite horizontal motors. Impact recovery still uses the separate impulse/balance/neck module; planned swing is suppressed when the opposite foot is already replanted by recoil. Pause/hit-stop stop the motor clock; reset seeds guard and clears prior forces/aim.

This is a hybrid active physical controller and constrained IK rig. It is **not** a complete rigid-body skeleton, Coulomb friction/contact solver, muscle model, energy-conserving human simulation or collision-derived combat. Toe/limb landmark tests do not prove every boot triangle avoids the mat. Animation, raycasts, motors and audio never decide damage. The existing pure 60 Hz study engine remains authoritative and visibly scripted.

## Rehearsal and evidence

Development route: `http://localhost:5174/?motionLab=1`. Manual controls are the existing three wheels. Rehearsal disables damage and opponent attacks, restores stamina and makes Super available. Normal sparring remains separate and preserves earned Super. The route is disabled in production.

“Play all 64” cycles mixed punch families across stance/power combinations, with readable guards between attacks. Keyboard wheel/punch input is suppressed during automatic sequencing; pause remains available. Stop, Reset and explicit resume remain usable. Half speed scales combat and presentation clocks together. A completed sequence visibly reports 64/64.

“Record 12s clip” captures the actual rendered ring without microphone audio. A local development-only Vite endpoint accepts same-origin, loopback-host video uploads, bounds them to 32 MiB and writes only fixed review filenames. It is not part of the production app or preview server. If local saving fails, the browser Blob download remains available. Review MP4 is a codec conversion of captured frames, without synthetic poses or altered playback timing.

Current video is `.impeccable/review/technique-motion.mp4`: 1672×640, 11.907 s, 318 captured frames, 2,836,209 bytes. It contains mixed defensive punches at the beginning of the all-64 sequence. The full 64-combination run was separately verified by the live completion counter; the 12-second clip is not evidence that all 64 are in that clip. Capture-stream output averaged approximately 26.7 frames/s; this is recording throughput, not render FPS or an animation smoothness certificate.

Development pose fixtures now accept `poseStance=defensive|offensive|neutral|super` alongside punch, power, phase and outcome. They use actual GLBs, accepted engine strikes and the physical controller, not concept-image backplates. Static fixtures remain supplementary evidence.

Meaningful tests cover all 64 techniques at contact and through complete stepping/recovery, fixed limb lengths, at least one supported toe, distinct kinetic fingerprints, lateral Hook versus Jab span, Uppercut load/rise, motor inertia and 30/60/120 Hz equivalence, pause/reset, stance latching, rehearsal isolation, earlier contact/recoil/resource tests and hardware parser mapping. Exact figure match, medically validated biomechanics, sustained smoothness, input latency and mobile hardware performance are not certified.

## Technique verification packet (before receiving reactions)

The final suite has 28 tests. The live browser run completed 64/64, verified half-speed Hook and reduced-motion Uppercut, pause/settings/resume/reset and normal sparring Uppercut4 (rival health 100→84). Portrait viewport is 390×844 with width/scrollWidth 390/390. The full-page bitmap is 375×911 because the desktop browser capture excludes its vertical scrollbar; it is narrow-browser layout evidence, not physical-phone testing. Sound and reduced motion were restored off. Settings are accessible from active sparring; the existing pause overlay must be resumed before opening settings. That inherited behavior was not treated as a motion-pass acceptance failure.

One final rolling last-600-frame laptop sample after the rehearsal reported 100 fps, p95 10.8 ms, 294 draws and 323,935 triangles at desktop 1672×941. It is a bounded browser sample, not a sustained moving-performance or mobile-device certificate. New capture inventory and model/video hashes are in `.impeccable/review/motion-capture-manifest.json`.

## Subsequent receiving reactions

The user subsequently authorized per-punch receiving expressions/footwork and stunned birds for either fighter. The new pass has 36 tests and a bounded player-stun camera orbit; the figures, technique trajectories and hardware remain fixed. See [RECEIVING-REACTIONS.md](RECEIVING-REACTIONS.md) for current reaction parameters and captures. The measurements and recording above belong to the earlier technique pass.


## Subsequent footwork permutations

The next user-authorized refinement expands the existing 64 setups to 192 entry/exit tactics with independent foot X/Z, defensive counters/angles, stance/power loading and extra recovery. The current suite has 43 tests. [FOOTWORK-PERMUTATIONS.md](FOOTWORK-PERMUTATIONS.md) records the new motion lab controls, recording and limits; the measurements above remain the earlier 64-technique packet.
