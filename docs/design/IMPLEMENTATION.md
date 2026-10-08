# Design app implementation — authored fighter motion study

On 2026-10-05 the user redirected the next pass to distinct punch techniques, stance/power combinations, legs and waist rotation. That request authorizes the completed active-physics motion pass; see [TECHNIQUE-PHYSICS.md](TECHNIQUE-PHYSICS.md). No further character sculpting was performed. The earlier figure-fidelity REBUILD verdicts remain unresolved and are not acceptance of the new motion.

Updated 2026-10-05 after the user chose “Continue the character modelling pass.” The dedicated Blender/GLB assets and the corrections requested by `FINISH-REVIEW-AUTHORED-ASSETS.md` are implemented and submitted with current evidence. Both the [first authored-asset review](FINISH-REVIEW-AUTHORED-ASSETS.md) and the [fresh full review of its correction](FINISH-REVIEW-AUTHORED-ASSETS-REBUILD.md) return **REBUILD**. Evidence and persistence pass; exact visible figure identity/construction fails. The authorized correction batch is complete, and under Impeccable’s second-REBUILD rule a separate user decision is still required before another character-modelling pass; the subsequent technique-motion request authorizes the scoped rig work documented above. Earlier procedural reference reviews and their old approval pause remain historical records.

The first approved `.impeccable/mocks/01-ringside-flash.png` remains the exact visible figure authority. The secondary `02-fight-club-zine.png` supplies quiet guard context. No source 3D mesh was supplied by either concept. Visible forms are reconstructed; hidden surfaces are authored interpretations. This record does not lower the approved figure requirement, declare visual completion or certify smoothness.

## Current tactical verification

Seven visible guard shapes, contact-time punch assessment, stance-specific advantages, combination/repeat rules and adaptive weighted rival guards now affect normal combat. Controlled Opening studies in the lab isolate each rule without damage. All 79 tests, build and formatting pass; see [TACTICAL-SCENARIOS.md](TACTICAL-SCENARIOS.md) for research, parameters, factorial checks, actual footage and limits. The previous spacing packet below remains a dated record.

## Spacing verification before tactical refinement

Both fighters now move through engine-owned ring positions, stance-dependent approach/retreat and seeded opponent choices. Actual punch reach decides misses on press and at contact; a timing strip shares that rule with the UI. All 66 tests, production build and formatting pass. Desktop/narrow/reduced-motion evidence, actual canvas footage and full-combat damage verification are recorded in [SPACING-COMBAT.md](SPACING-COMBAT.md). The static motion/fall lab remains available beside an optional no-damage live-spacing rehearsal. This prototype does not change the meshes or earlier fidelity verdicts.

## Previous knockout verification

The requested knockout pass adds six escalating articulated falls to both fighters, delayed fight results, engine-owned landing events and a complete lab preview sequence. The final suite has 51 passing tests, production build/format checks and actual-model floor/limb/frame-rate verification. [KNOCKOUT-FALLS.md](KNOCKOUT-FALLS.md) owns current timing, reduced-motion behavior, controls and evidence. These are constrained comic choreography, not rigid-body ragdolls. No mesh, hardware or historical character-fidelity verdict was changed.

## Previous footwork verification

The requested footwork pass expands each of the 64 punch/stance/power setups into three distinct entry/exit tactics: 192 paths. Independent foot X/Z motors, knee loading, asymmetric support and stance-dependent recovery preserve contact and fixed legs. The final suite has 43 passing tests, production build/format checks, live three-style comparison and an actual canvas recording. [FOOTWORK-PERMUTATIONS.md](FOOTWORK-PERMUTATIONS.md) owns current behavior, lab controls, tests and solver limits. GLBs, hardware mapping and earlier figure-fidelity verdicts remain unchanged.

## Previous receiving-reaction verification

The subsequent requested expression/footwork/stun refinement has 36 passing tests, production build/format checks, both-fighter receiving previews and a real recorded stun sequence. [RECEIVING-REACTIONS.md](RECEIVING-REACTIONS.md) owns the current reaction behavior, camera exception, engine semantics, reduced-motion path and evidence. Existing character GLBs and their unresolved fidelity reviews remain fixed.

## Previous technique verification

The subsequent scoped motion pass has 28 meaningful tests, the live 64-combination completion, desktop/portrait/reduced-motion interaction evidence and a real 11.907-second ring recording. [TECHNIQUE-PHYSICS.md](TECHNIQUE-PHYSICS.md) owns current parameters, research, lab behavior and limits. The asset integration sections below are the earlier 22-test packet and its dated capture/performance evidence; their character review verdicts remain unchanged.

## Code and asset ownership

- `src/app/App.tsx` — React composition, readiness, lifecycle, settings and explicit study/fixture labels.
- `src/features/boxing/domain/` — pure typed study commands/state, fixed-step range/guard outcomes, seeded opponent movement and timing, motion envelopes and validated development-fixture parameters. No React, Three or DOM dependencies.
- `src/features/boxing/application/` — external store, bounded 60 Hz catch-up, immediate selections and throttled UI snapshots.
- `assets/models/boxing-fighters.blend` and `tools/build-fighters.py` — editable original sculpt assemblies and Blender 5.2 export pipeline.
- `public/models/player.glb` and `rival.glb` — shipping articulated figures with native sculpt/material surfaces and no image textures.
- `src/features/boxing/scene/FighterAssets.ts` — GLB loading, print shadow policy, centered mouth pivot and resource adoption.
- `FighterModel.ts` — required-node binder for the GLB rig and separate expression meshes. The old `ModelGeometry.ts` was removed; no procedural fighter fallback exists.
- `Fighter.ts` and `FighterStage.ts` — fixed-length two-bone posing, surface aim, canonical striking-hand pivots and shared runtime/test staging.
- `FighterDynamics.ts` — mass/impulse presentation, body and independent angular head springs, one-foot recovery support.
- `PoseProbe.ts` — development-only deterministic static evidence using the actual Fighter/GLBs and pure-engine-created strike timings.
- Other scene modules — arena, shared resources, instanced crowd, lighting, pooled effects and one master render loop.
- Components/hooks/audio/styles — semantic controls/HUD, keyboard/pointer input, user-unlocked contact sound, responsive layout and motion preferences.

Rapid fighter transforms stay outside React state. The pure engine alone owns accepted actions, contact outcomes, damage and recovery at fixed 60 Hz. Accepted punches latch Attack/effective Stance/Power and reject another strike during recovery; later turns prepare the next action. Rendering, springs, audio and GSAP consume study events and never apply damage.

## Implemented scope

One ring, two original authored GLB fighters, 20 instanced spectators, blank posters, exactly three working dials, four punches and four power levels, stance selection, fatigue/recovery, probabilistic automatic spacing, range/guard outcomes, hit/block/whiff/counter, health/stamina/Super, pause/reset, settings, six knockout falls and illustrative victory/loss exist. Pressing Power punches. Sound is off by default. Normal play is labelled as a prototype fight; the development lab distinguishes static technique and live-spacing rehearsals.

Final collision/contact-volume combat, production opponent AI, campaign and ESP32 relay/button input remain later milestones. Signal Lock and hardware baseline were not changed by this pass.

## Authored figure correction

The Blender source contains two separately editable rigs, sculpt pieces, studio lights and a review camera. Player hair now consists of 51 closed fitted masses with shallow sculpted swirl relief and a shaped rear/nape field. The rival quiff uses six lower overlapping solid wedges with an asymmetric sweep and intentional forehead edge. Integrated skin geometry carries orbital/brow relief, cheek planes, jaw/chin and nose; the separate blade nose was removed. Narrow eye, brow and mouth prints are subdivided and ray-projected onto the actual tessellated skin. Mouth/BrowL/BrowR remain independently centered reaction meshes with authored rest shapes.

Torso and limbs now carry muscular planes, fitted shoulders, tapered forearms and compact recessed pivots. Shorter narrower shaped trunk shells expose thigh/knee forms. Boots have fitted tall shafts, longer narrower feet and coherent ankle/toe/sole transitions. Padded gloves retain fitted thumbs, mould seams and substantial printed bound cuffs. Static evaluated surfaces merge by rig parent/material in GLB while source sculpt pieces stay editable; expression meshes remain separate and merged facial decals preserve the print shadow classification.

| Final asset                | Triangles |     Bytes | Mesh surfaces |
| -------------------------- | --------: | --------: | ------------: |
| `public/models/player.glb` |    76,191 | 1,421,684 |            46 |
| `public/models/rival.glb`  |    49,383 |   906,884 |            47 |

`assets/models/PROVENANCE.json` records hashes, source, reference authority and export/evidence strategy. [FIGHTER-ASSETS.md](FIGHTER-ASSETS.md) owns the complete model record, 12 final studio studies and native pixel comparison boards. Studio renderings are review images rather than runtime backplates. The fresh full review finds remaining contradictions in curl/quiff contours, the adult rival face and contact expression, athletic torso/shoulder and squared trunk/thigh/knee construction, coherent boot/glove/cuff surfaces and the focal sculpt/material finish.

Both GLBs and the arena texture preload before sparring. Asynchronous shader compilation completes before readiness. `Resources.adoptModel` deduplicates model geometry/material/texture ownership and releases late-arriving models after unmount; disposal is idempotent. Printed face surfaces do not cast or receive shadows. No fighter raster textures or concept-image substitute ships.

## Rig, staging and physically informed presentation

Body/Hips rest origins are Y 1.46/1.16, Head is body +0.89, and normalized limbs have proximal +Y. Arms use fixed lengths 0.5 + 0.5 with maximum shoulder-to-wrist reach 0.985; legs use 0.43 + 0.43. The knuckle contact landmark is local `(0, 0.04, 0.27)`.

Canonical local +Z faces the receiver. +X is the lead Jab/Hook hand and forward foot; −X is rear Cross/Uppercut and rear foot. Since local shoulder advance follows `z = −x × sin(yaw)`, lead attacks use negative torso yaw and rear attacks positive yaw. Matching hip and striking-side support pivots follow the same direction. Non-striking gloves retain guard. The current technique pass replaces direct wrist assignment with a driven mass, phased hip/trunk motors, toe pivots and fixed-length constraints. See TECHNIQUE-PHYSICS.md for the current controller, not the earlier eased-path mechanism.

Shared staging is player `(−0.44, 0.055, 0.57, yaw 2.5)` and rival `(0.37, 0.055, −0.51, yaw −0.64)`, about 1.35 m apart horizontally; the rival retains scale 1.02. Desktop camera is `(1.8, 2.4, 5.1)`, target `(0.2, 1.55, −0.1)`, FOV 38°. Under 650px scene width, camera becomes `(0.12, 2.3, 5.25)`, target Y 1.65, FOV 50°. UI switches at 700px independently. Environment intensity is 0.22, ACES exposure 1.05, warm key 45, cool rim 50 and hemisphere fill 0.7. The key keeps a 2048 PCF shadow map, bias −0.0002 and normal bias 0.035. PMREM construction resources and its owned render target have lifecycle disposal.

At strike start, the receiver raycasts a head surface for hit/counter or supplies its opposing glove landmark for block; the scene latches that world aim. Whiff offsets the aim. The rig converts the target and solves the wrist from the rotated glove landmark without elastic limb reach. These presentation surfaces do not determine outcome or damage.

`FighterDynamics` uses reference mass 78 kg, impulse `(24 + 22 × power)`, block factor 0.22 and no whiff impulse. Damped recoil/lateral/pitch/roll springs and separate head-pitch/head-yaw springs integrate at 240 Hz with bounded elapsed time. Hook adds lateral/roll/head-yaw response; Uppercut increases pitch. One recovery foot replants over 0.24 s with maximum 0.045 m lift while the other retains support. Pause/hit-stop freeze presentation; reset clears impulses. Small brow rotations add to the authored scowl and the centered mouth scales for reaction. These are presentation tuning parameters, not measured boxing forces, rigid-body collision simulation or human-biomechanics validation.

Local projected lettering, pooled particles and two 16-point Super glove-line trails remain. Reduced motion removes shake, particles and trails, suppresses travelling/scaling/rotating text and retains essential posing plus short readable fades. The illustrated color-registration echo requirement remains unaccepted.

## Current verification packet

The integration pass on 2026-10-05 reports **22 passing tests**, production TypeScript/Vite build and formatting checks. Existing domain/application/serial tests retain latched actions, timing, recovery, stance/Super behavior, stamina, reset/end states, bounded stepping, framing and direction mapping. Four presentation dynamics cases cover power/guard/miss response; frame-rate stability and active one-foot recovery with continuous floor support; pause/reset; and directional head recoil/reset. Two resource cases cover exactly-once shared-model disposal and late-model release.

Three GLB/rig cases load the actual final binaries. They verify finite geometry and distinct assemblies; all 64 combinations of two attacking sides × four punches × hit/block × powers 1–4 reach a latched surface within 0.04 m at contact including hit-stop; and the corrected advancing shoulder plus actual labelled contact/recoil fixtures. Numeric reach and finite geometry are integration evidence rather than a visual acceptance verdict.

The fresh browser exercise covered all four punches at powers 1–4, ready/recovery behavior, meter updates, reset/start, pause/resume and settings. Recorded rival-health checkpoints were 96, 88, 88 on block and 72; a reduced-motion Uppercut at power 4 changed rival health 100→84. Sound was restored off and reduced motion false after verification. No new browser errors were observed. At portrait 390×844, DOM width/scrollWidth were 390px/390px.

The capture manifest `.impeccable/review/rebuild-capture-manifest.json` binds the final GLB hashes and enumerates 15 current views:

- `rebuild-desktop.jpg` (1672×941), `rebuild-user-1920.jpg` (1920×1080) and `rebuild-mobile.jpg` (390×844).
- Cross windup, exact hit contact, +75 ms hit recoil and block contact.
- Jab hit contact; Hook and Uppercut hit contact plus +75 ms recoil.
- Reduced-motion, pause and performance views.

Contact images are explicitly labelled development fixtures using the actual loaded GLBs, Fighter posing and engine-created strike timing. Windup is 45% of the contact age, contact is held at hit-stop, and recoil is contact +75 ms. For power 4 this is 0.13275 s, 0.295 s and 0.370 s. They expose deterministic pose phases rather than moving gameplay footage or a captured health/damage sequence. The query fixture path and label are disabled in production. `hero-repro.png` is now a current 1672×941 screenshot of the exact Cross contact fixture, replacing the historical figures without claiming pixel identity to the approved illustration.

After Blender completed, one rolling last-600-frame sample at laptop-browser viewport 1920×1080 reported 100 fps, p95 10.6 ms, 293 draw calls and 323,887 triangles. This is one sample; it is not a full-minute timing distribution, proof of minimal repetition or input-latency measurement. Mobile hardware, sustained performance and actual hidden/background pause/resume remain unverified end to end. The source includes hidden rendering cancellation and deliberate study resume, but source review does not certify the browser journey.

Production chunks were app 311.82 KB minified / 103.15 KB gzip and lazy scene 648.30 KB / 165.73 KB gzip. Vite's advisory above 500 KB remains. A shipping-raster provenance scan found four rasters and zero missing records; fighter GLBs contain no image textures. The one earlier detector produced three advisory effect colors (`#ffcb46`, `#74d5eb`, `#ff9a68`) and no hard finding; no second detector ran and these findings are not waived.

## Persistent contract and handoff

Source `index.html` and emitted `dist/index.html` retain the application/json design-contract with seed93629624, THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM and FINISH. These preserve the approved world and finish reminder through the production build. DESIGN.md and its schema-2 sidecar now describe the authored GLBs and current presentation/evidence; PHYSICS-STUDY.md records the corrected rig and independent head/body response. FIGHTER-ASSETS.md and model provenance remain the model authority.

The [first authored-asset review](FINISH-REVIEW-AUTHORED-ASSETS.md) and the [fresh full review of its correction](FINISH-REVIEW-AUTHORED-ASSETS-REBUILD.md) both return **REBUILD**. The fresh review passes evidence/persistence and marks exact visible figure identity/construction **FAIL**. Its six material findings concern the focal sculpt/material; adult rival face with guard/contact scowl; irregular directional curls/quiff contours; planar athletic torso/shoulders, squared longer trunks and fitted thigh/knees; coherent boots/glove cuffs; and visibly extended distinct punch lines with directional recoil, corroborated by a moving repeat/mixed sequence. Numeric contact, advancing shoulders, 22-test integration evidence and the rolling 100 fps sample remain supported; the review does not claim a numerical-contact, smoothness or performance failure. Under Impeccable’s second-REBUILD rule a separate user decision is still required before another character-modelling pass; the subsequent technique-motion request authorizes the scoped rig work documented above. The first approved image remains the exact-figure authority. Moving-footage smoothness/minimal repetition, sustained laptop timing, input latency, mobile hardware performance, audio quality and a complete accessibility/background journey are not certified by this packet. The app is reviewable at localhost:5174. PRODUCT.md schema and unrelated source/hardware were outside this documentation update.
