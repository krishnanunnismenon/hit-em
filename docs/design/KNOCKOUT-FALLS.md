# Comic knockout falls — 2026-10-05

The user requested multiple funny falls for the defeated boxer. This scoped animation pass uses the existing two fighters and ring. It does not revise the character meshes or resolve the historical figure-fidelity reviews.

## Six escalating falls

| Fall | Comic beat | Duration | Mat-impact time |
| --- | --- | --- | --- |
| Timber | Arm windmills, stiff backward topple, spread gloves | 2.80 s | 1.02 s |
| Jelly knees | Knees buckle before a folded heap | 3.00 s | 1.08 s |
| The pirouette | Unnecessary full turn, sideways flop | 3.25 s | 1.48 s |
| Banana peel | Backward wipeout with both boots raised | 3.35 s | 1.18 s |
| Victory too soon | Premature raised-glove celebration, sideways collapse | 3.55 s | 1.90 s |
| The encore | Falls, attempts a sit-up comeback, flops again | 4.05 s | 1.08 / 2.43 s |

Each pose has separate glove and boot goals, torso orientation and final silhouette. Bounded wobble, flailing, a small landing bounce and one final boot twitch add secondary motion. The receiving face is dazed; the existing golden canaries follow that boxer's head during the fall. Landing words and an optional low thump come from the same engine landing event. Both player and rival use the complete bank.

Defeats advance in this order, then wrap after six; `Spar again` preserves the count. Full `Reset` clears it. This escalation is deterministic and does not draw gameplay randomness. A fall's comedy is authored, not a guarantee that every viewer finds the next one funnier.

## Engine and rig ownership

The pure 60 Hz study engine creates a typed knockout descriptor when either health reaches zero, interrupts both punches and rejects further selection/punch input. No posthumous rival attack can land. Landing events fire exactly once, including the Encore's second impact. The result becomes victory/loss only after the descriptor duration; presentation completion does not award damage or determine the winner.

Pause freezes fall and landing clocks; half speed in the lab scales them together. A real terminal pose stops at the engine result time. A rehearsal pose remains held until another preview or reset. `retry` preserves defeat history while reseeding the fight; ordinary reset clears it. The existing hidden-page pause uses the same sparring phase and knockout input lock.

`domain/knockout.ts` supplies time-sampled choreography. `scene/KnockoutRig.ts` captures the actual current pose and blends into the fall. It reuses the loaded meshes under one pivot, fixed 0.5 m upper/lower arms and 0.43 m thighs/shins. Reach is clamped before solving, preserving segment lengths. Conservative transformed mesh bounds lift the whole falling figure above the mat. Mesh boxes, vectors and the pivot are prepared once; no new fighter geometry, textures, assets or transient effect pools are created per fall. Existing facial deformation continues through the knockout.

These are constrained articulated comic animations, not rigid-body ragdolls, contact/friction physics, measured boxing injuries or collision-derived outcomes. Conservative boxes can leave small visual gaps where the curved mesh differs from its box. Their support/contact test is a geometry bound, not a biomechanical validation.

Knockout camera framing widens and lowers the view; portrait framing also shifts toward the loser and adds 10 degrees of field of view. The ordinary player-stun orbit is suppressed during a fall. Camera progression samples the same combat clock and freezes on pause. The lab stage uses a stable flex basis so its recording resolution does not change with technique/fall captions.

Reduced motion retains the distinct fallen pose and dazed face but removes the full spin, windmills, flailing, celebration, repeated sit-up/drop, bounce, boot twitch and camera shake. It uses one gentle collapse and a static wider composition, with existing static birds. Result timing and damage remain unchanged.

## Review controls

On the opt-in development `?motionLab=1` page, choose `Boxer` (Rival or You), then `Fall`. `Next — escalating` uses the current history; a named fall is repeatable. `Preview fall` preserves both health values. `Play 6 falls` demonstrates the entire bank with a short held-pose beat between falls. It uses the same engine and rig, pauses with sparring and can be stopped or reset. Starting a preview/sequence brings the ring into view. `Record 26s clip` covers the six-fall sequence at normal speed; half speed takes longer. Production continues to ignore the laboratory route.

## Verification

The final suite has **51 passing tests**, with a successful TypeScript/Vite production build and formatting check. The existing Vite advisory for a scene chunk above 500 kB remains; this pass adds no dependency.

New meaningful checks cover lethal punches on either boxer, one knockout event, interruption/input locks, delayed terminal results, no posthumous attack, pause/resume and exactly-once landing events, retry progression/wrapping, reset and lab-only health-preserving previews. Choreography checks cover finite trajectories, six distinct stable finishes and reduced-motion suppression.

Actual GLB tests exercise all six falls on both figures in ordinary and reduced motion. They check every sampled mesh bound against the mat, fixed limb lengths, bounded height, a lowered head at the finish and restoration of the standing rig. Combat-clock poses agree at 30/60/120 Hz and freeze at zero elapsed time. Prior punch/contact/footwork/reaction/resource/hardware tests still pass.

The final browser exercise completed 6/6 rival falls, previewed the player's Banana peel and Encore, verified 390 px width/scrollWidth without horizontal overflow, exercised reduced motion and knockout pause, and played an ordinary fight through zero rival health → visible fall → delayed victory → clean rematch. Browser console errors were empty. The preserved MP4 is 1658×512, 25.970 seconds, with 780 decoded frames (about 30 captured frames/s).

Browser evidence and media measurements are bound in `.impeccable/review/knockout-capture-manifest.json`. The final bank recording is actual WebGL canvas footage. Its H.264 copy preserves timing and contains no microphone audio. Native desktop, portrait and reduced-motion screenshots accompany it. Earlier model/technique/reaction/footwork evidence remains separately archived. Capture throughput is not render FPS, mobile device performance, sustained smoothness or latency certification.
