# Receiving reactions and stun — 2026-10-05

The user requested facial expressions and foot movement on received punches, plus birds above either boxer on a perfect stunning shot. This scoped refinement keeps both GLBs, the Blender sculpt, hardware mapping, ring and ordinary camera. It does not resolve the earlier character-fidelity REBUILD verdicts or turn scripted combat into collision-authoritative physics.

## Contact ownership

The pure 60 Hz study engine now supplies `recipient`, `attack` and bounded `stunFor` metadata. The scene consumes those decisions; it never applies damage. A landed counter or clean power-four hit stuns the rival for 1.65 combat seconds. The scripted rival can catch an unresolved power-three/four windup: that landed counter stuns the player for 1.65 seconds, cancels the interrupted strike and temporarily rejects punching. Existing damage values are retained. A timely perfect guard remains a block with the existing rival opening, no player damage and no player stun. A miss transfers no impulse or facial reaction. These are study rules, not the final opponent AI or contact-volume engine.

The development technique lab adds a receiving-reaction group: Boxer (Rival/You), Contact (Hit/Guard/Stun/Miss) and Preview reaction. It uses the selected punch and power through the same engine event adapter, with no damage. Preview commands are rejected outside training and while paused/finished. This is deliberate isolated inspection, not a production gameplay input or a hidden scene manipulation.

## Faces and support

`FaceReaction.ts` animates the existing fitted eye prints, independently centered brows and mouth. Jab flinches/squints; Cross compresses the brows and pulls the mouth; Hook closes the struck side more strongly and twists the grimace; Uppercut raises brows and opens the mouth. Power changes intensity, guards remain restrained, and all neutral print positions are preserved for reset. Stun replaces the eye prints with original spirals and a surprised mouth, projected once onto each authored skin surface. No new raster assets, character replacement or GLB export is involved.

Every landed punch, including power one, queues a short recovery step. Jab/Hook favor the lead foot; Cross/Uppercut the rear. Hook has lateral placement as well as recoil. Impact steps take 0.22–0.28 seconds and lift 0.0225–0.045 scene metres according to power. Subsequent replants return toward the centre-of-mass anchor. Guard bracing rocks a supported toe and flexes the knees. At least one toe stays supported; fixed-length leg IK remains. Numerical impulses are physically informed presentation tuning, not measured boxing-force data or a full rigid-body simulator. Toe tests do not certify every sole triangle.

## Canaries and camera

`StunBirds.ts` owns three original golden toy canaries and three small stars per boxer. Six fixed instanced pools per boxer share geometry/material resources; there is no per-hit object allocation, texture, extra light or extra shadow. Wings flap and birds orbit on the combat clock, follow the head in world space and exit over the final 0.18 seconds. Both systems can coexist. Expiry, pause/hit-stop and reset follow engine time. Scene resource ownership disposes the instance pools and shared assets.

During a player stun a critically damped camera motor orbits toward a ringside angle so the player's expression becomes visible. It retains radius and eases slightly outward to fit both feet and the birds; it does not cut through the ring. The normal view returns afterward. Reduced motion keeps the ordinary camera and uses still canaries/wings/stars while retaining essential hit reactions, readable lettering and facial state. Existing shake, particles and Super trails remain disabled under reduced motion.

## Verification

36 meaningful tests pass, plus TypeScript/Vite production build and formatting checks. New cases cover landed stun versus guard/miss, correct recipient on both sides, the perfect-guard distinction, interruption and timed expiry, lab-only previews, every punch/power recovery step, actual GLB expression differences on both fighters, fixed leg lengths and supported toes through recovery, neutral reset, bounded bird pools, pause/expiry and static reduced-motion matrices. The prior 64-trajectory/contact tests remain passing.

Desktop 1672×941 and narrow browser 390×844 were inspected. Narrow DOM width and scroll width both measure 390px. All four receiving expressions, either boxer stunned, light guard/miss, reduced motion and an actual power-four Hook contact were exercised; a real ring recording shows the player camera transition. The initial camera path cropped the framing and was corrected in one batch to retain orbit radius. Console inspection after the fresh reload found no errors. This is laptop/narrow-browser evidence, not physical-phone performance certification.

Evidence is recorded in `.impeccable/review/reaction-capture-manifest.json`; the final captured recording is `reaction-motion.mp4`. The recording has no microphone or synthesized poses, uses half-speed rehearsal, and includes a real player Hook followed by an explicit player receiving-stun preview. Earlier technique and figure-review evidence remains historical and unchanged. Sustained performance and professional biomechanical validation remain unverified.
