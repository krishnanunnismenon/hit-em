---
name: Boxing motion study
description: Original articulated toy boxers, printed fight-club materials and three tactile controls.
colors:
  ink: "#181f22"
  paper: "#e6ddc8"
  cream: "#f3ecd9"
  blue: "#215eaf"
  red: "#b94b35"
  yellow: "#f3cc48"
  green: "#4f8056"
  line: "#8c816c"
  impact-particle: "#ffcb46"
  super-cyan: "#74d5eb"
  super-orange: "#ff9a68"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(48px, 5.4vw, 76px)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  fighter-name:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "28px"
    fontWeight: 900
    lineHeight: 1
  control-title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 1
  selection:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Barlow, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  button:
    fontFamily: "Barlow, sans-serif"
    fontSize: "15px"
    fontWeight: 600
rounded:
  label: "2px"
  button: "3px"
  tool: "4px"
  dialog: "7px"
  dial: "50%"
spacing:
  tight: "4px"
  compact: "8px"
  control: "12px"
  inset: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "14px 18px"
  button-dialog:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "14px 18px"
  selection-attack:
    backgroundColor: "{colors.blue}"
    textColor: "white"
    typography: "{typography.selection}"
    rounded: "{rounded.label}"
    padding: "3px 6px"
  selection-stance:
    backgroundColor: "{colors.red}"
    textColor: "white"
    typography: "{typography.selection}"
    rounded: "{rounded.label}"
    padding: "3px 6px"
  selection-power:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.selection}"
    rounded: "{rounded.label}"
    padding: "3px 6px"
  dial:
    rounded: "{rounded.dial}"
    size: "88px"
  settings-dialog:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "28px"
    width: "min(440px, calc(100% - 32px))"
---

# Design System: Boxing motion study

## Overview

**Creative North Star: "Moulded plastic in a printed fight club"**

This records the current interactive design study, refreshed on 2026-10-05 from the scene, semantic UI, stylesheet, authored model pipeline and current capture manifest. The accepted underground comic fight-club world remains: two original articulated moulded-plastic boxers, a worn cream ring, dark warehouse surroundings and a continuous paper control rail. Condensed ink lettering supplies functional hierarchy and brief contact feedback. The ring carries the visual weight.

The first approved [Ringside flash frame](.impeccable/mocks/01-ringside-flash.png) remains the figure-fidelity authority. [Fight-club zine](.impeccable/mocks/02-fight-club-zine.png) supplies the quiet guard context; [CONCEPT-REVIEW.md](docs/design/CONCEPT-REVIEW.md) and [DIRECTION-CONTRACT.md](docs/design/DIRECTION-CONTRACT.md) preserve the accepted text-free environment and reduced crowd. On 2026-10-05 the user chose “Continue the character modelling pass,” authorizing the dedicated Blender/GLB work. The procedural reference reviews and their approval pause are historical. Both the [first authored-asset review](docs/design/FINISH-REVIEW-AUTHORED-ASSETS.md) and the [fresh full review of its correction](docs/design/FINISH-REVIEW-AUTHORED-ASSETS-REBUILD.md) return **REBUILD**. The fresh review passes evidence and persistence but marks exact visible figure identity/construction **FAIL**. Remaining defects concern focal sculpt/material, the rival’s adult face and guard/contact scowl, directional hair contours, athletic torso/lower-body planes, boot/glove construction and distinct extended punch lines with directional recoil. The user then redirected work to punch identity, leg/waist mechanics and all stance/power combinations. That request authorizes the scoped active-physics motion pass described in [TECHNIQUE-PHYSICS.md](docs/design/TECHNIQUE-PHYSICS.md); further character sculpting remains separate. Neither earlier figure-fidelity REBUILD verdict was changed. This record preserves the first approved exact visible figures as the fidelity authority; the new review does not lower that requirement.

The runtime now distinguishes prototype combat from isolated motion rehearsals. Engine-owned spacing and weighted opponent movement replace the previous scripted hit/miss cycle in normal play. Dedicated GLBs provide the fighters; a driven physical rig with constrained fixed-length limbs and a separate recoil module animates them. The pure fixed-step study engine alone owns attack legality, timing, outcomes and damage. [IMPLEMENTATION.md](docs/design/IMPLEMENTATION.md) records the earlier asset integration packet. [TECHNIQUE-PHYSICS.md](docs/design/TECHNIQUE-PHYSICS.md) records the 64-technique controller, complete-path tests, live matrix completion and actual mixed-punch video. Historical rolling frame measurements remain dated to their original build. Sustained smoothness, minimal repetition, input latency and mobile hardware performance remain unverified. Full contact-volume combat, production opponent AI, campaign and hardware integration remain later work.

The subsequent receiving-reaction pass adds per-punch facial expressions and supported recovery steps, plus three original golden canaries, spiral eyes and a surprised mouth for either stunned boxer. A restrained player-stun orbit reveals the face; reduced motion uses still birds and the ordinary camera. Training-only receiving previews provide direct inspection with no damage. [RECEIVING-REACTIONS.md](docs/design/RECEIVING-REACTIONS.md) records the 36-test verification and actual recording; the character-fidelity verdicts above remain unchanged.

The current footwork refinement expands each punch/stance/power setup into three entry and exit tactics: 192 paths. Independent foot positions, defensive retreats/slips/pivots, pressure steps, planted power shots and coiled Super angles alter the base, knee loading and recovery. The lab can compare three styles for one setup or sequence all 192; labels follow the accepted technique while wheel turns prepare the next action. [FOOTWORK-PERMUTATIONS.md](docs/design/FOOTWORK-PERMUTATIONS.md) records the 43-test verification, actual comparison clip and solver limits.

The knockout refinement gives either boxer six escalating comic falls: Timber, Jelly knees, The pirouette, Banana peel, Victory too soon and The encore. Each has distinct boot/glove staging, anticipation and a held finish, with dazed faces and existing canaries. Combat owns the fall and landing clocks; the result waits until the joke finishes. Reduced motion keeps a single gentle collapse and distinct fallen pose. The motion lab previews either boxer and sequences the complete bank; [KNOCKOUT-FALLS.md](docs/design/KNOCKOUT-FALLS.md) records the 51-test verification and authored-motion limits.

The current spacing pass makes footwork consequential: both boxers move around the ring, stances seek different gaps and engine-owned reach determines misses on press and at contact. A flat ink timing strip uses blue/red markers and a yellow reach band to connect the visible gap with punch timing; it also names rival movement and guard. Controls follow the strip, with rehearsal tools below them. Midpoint tracking and a three-quarter camera keep the circling pair readable. The opt-in Live spacing rehearsal shares these rules without damage; [SPACING-COMBAT.md](docs/design/SPACING-COMBAT.md) records the 66-test verification, actual footage and prototype limits.

The tactical refinement makes the glove poses legible combat signals: lowered left/right gloves, central protection, wide gloves and tucked elbows alter punch effectiveness. The existing ink timing strip names a selected opening or covered lane and gives a compact reason; yellow emphasis marks a viable in-range shot, while protected lanes retain cream text. Impact lettering adds the resolved reason. Opening studies extend the existing rehearsal controls without changing the world, characters or ordinary control scheme. [TACTICAL-SCENARIOS.md](docs/design/TACTICAL-SCENARIOS.md) records the 79-test verification, boxing sources, tunable parameters and remaining balance limits.

**Key Characteristics:**

- Two independently authored Blender/GLB toy fighters with blue player and red rival gloves.
- Native sculpted hair, face, torso, limb and costume surfaces; no fighter raster backplates.
- Active physical punch motors, fixed-length limbs, directional recoil and sequential support steps, separate from combat decisions.
- Cream textured arena and paper rail against dark surroundings.
- Exactly three live UI dials: Attack, Stance and Power.
- Semantic HUD, selections and event lettering over animated geometry.
- Blank environmental posters and 20 instanced spectators.
- Bounded contact feedback and an explicit reduced-motion alternative.

## Colors

The source CSS palette pairs warm paper and cream with dense ink, blue/red identity and yellow event emphasis. Frontmatter preserves the eight root CSS colors and the three current particle/trail colors from the scene. Texture pixels, GLB material colors and lit arena surfaces remain separate sources; scene effect values do not replace the CSS palette.

### Primary

- **Player blue** (`blue`): player health, Attack selection, Attack pointer and focus outlines.
- **Rival red** (`red`): rival health, Stance selection and Stance pointer. It is also a control identity rather than a universal error color.

### Secondary

- **Contact yellow** (`yellow`): start action, Power selection/pointer, Super meter/cue, result stamp and jagged impact bursts.
- **Stamina green** (`green`): stamina fill; the label and percentage carry meaning alongside color.
- **Impact particle yellow** (`impact-particle`): pooled hit/counter particles. Blocks use a separate cream particle value.
- **Super cyan** (`super-cyan`) and **Super orange** (`super-orange`): two pooled glove trails during an active Super strike. This remains an implementation adaptation; the authored-figure review does not certify illustrated echo fidelity.

The one earlier Impeccable detector run reported three advisory scene-effect colors and no hard finding. Recording them documents actual use; no finding was waived and no second detector ran for this correction.

### Neutral

- **Warehouse ink** (`ink`): page/footer, rail edge, labels, meter framing and event outlines.
- **Quiet paper** (`paper`): base paper token. The rail's final CSS background-color override is `#ead2b6`; `/textures/worn-paper.webp` supplies its visible grain. The root paper token alone does not reproduce the rail.
- **Warm cream** (`cream`): HUD text and settings surface.
- **Printed divider** (`line`): thin rail column separators.

**The Live Meaning Rule.** Color accompanies text, live meter values and selection state; it does not replace them.

## Typography

Self-hosted Barlow Condensed (700/900) gives the round, fighter identifiers, control labels and comic feedback their narrow athletic character. Barlow (400/600) carries instructions, settings and numeric support. Fonts use `font-display: swap`; [ASSET-MANIFEST.md](docs/design/ASSET-MANIFEST.md) and `public/fonts/PROVENANCE.json` record official upstream binaries and the SIL OFL license.

Frontmatter captures the base desktop roles. Display headings are uppercase with tight leading. Fighter identifiers use black condensed type. Control titles and selected options use compact condensed type; selected options remain semantic buttons. Health, stamina and Super values use tabular numerals. Round digits are 42px at desktop and 32px on mobile; the settings heading is 36px. Impact words use condensed black italic type with an ink outline/burst and a final desktop clamp of 28–58px; mobile is 32px, with quieter outcomes at 22px.

**The Readable Ring Rule.** Keep essential health, opponent cues and selections readable while leaving both fighters visible. Additional lettering belongs to functional information or a contact event.

## Layout

A full-width flex column contains the arena stage, continuous control rail and compact footer. No maximum-width card wraps the scene. At base desktop, stage height is `calc(100svh - 211px)` with a 460px minimum. The top HUD is a three-column grid (`1fr 150px 1fr`), padded 22px/34px, with player/rival health at the sides and the round centered. Stage tools sit at the right; the entrance prompt overlays the left.

The paper rail uses four regions (`1fr 1.15fr 1fr 0.9fr`): three controls plus stamina/Super. The fourth region contains meters. Base rail minimum height is 170px, horizontal padding 30px and gap 24px. Each dial and its options share a row. Thin column rules separate them; a clipped ink edge bounds the top. The rail texture repeats at 512 CSS pixels. These are the current live control forms; the approved printed/mechanical reference remains their finish authority.

At widths at least 1600px, stage height is `calc(100svh - 225px)`; rail minimum height becomes 184px, horizontal padding 52px and gap 38px. Dials grow to 100px and option labels to 17px. At widths at most 1000px, padding/gaps tighten and dials become 73px. At widths at most 700px, three equal control columns remain side by side, with each dial above wrapped options and both energy meters on a full-width lower row. Mobile dials are 64px, option labels 11px, HUD names 22px, and stage minimum height 420px. Stage tools move to the lower right. Final rail top padding remains 19px at all widths.

The current fighter staging places the player at (−0.44, 0.055, 0.57), yaw 2.5, and the rival at (0.37, 0.055, −0.51), yaw −0.64; the horizontal separation is about 1.35 scene metres. The desktop camera is (1.8, 2.4, 5.1), looking at (0.2, 1.55, −0.1), with a 38-degree field of view. Below 650px scene width, the camera is (0.12, 2.3, 5.25), target Y is 1.65 and field of view is 50 degrees. This camera breakpoint is separate from the 700px UI breakpoint. The motion lab uses 42° desktop and 54° narrow field of view to leave room for angled footwork in its shorter canvas; normal sparring keeps 38°/50°.

The settings dialog is a centered native modal, capped at 440px width and 90svh height with 28px padding. Current captures are [desktop 1672×941](.impeccable/review/rebuild-desktop.jpg), [desktop 1920×1080](.impeccable/review/rebuild-user-1920.jpg) and [portrait 390×844](.impeccable/review/rebuild-mobile.jpg). Both complete heads, feet, controls and meters are contained in these views. Portrait DOM width/scrollWidth measured 390px/390px. These observations establish the captured layout rather than mobile hardware performance or figure-fidelity acceptance.

## Elevation & Depth

UI depth is restrained: dial rings and inset face shading make controls tactile, while paper grain and ink framing define the rail. The settings modal has a broad black shadow and dark backdrop. The HUD uses a transparent dark gradient; overlays use translucent ink. There is no repeating floating-card system.

The fighters use authored GLB materials with glossy plastic, glove, costume and printed-ink surfaces under live lighting. The scene uses ACES filmic tone mapping at exposure 1.05 and an owned startup PMREM `RoomEnvironment` at intensity 0.22. A warm shadow-casting key has intensity 45, a cool rim 50 and hemisphere fill 0.7; wall/warehouse lights supply secondary illumination. The key uses a 2048 shadow map, bias −0.0002 and normal bias 0.035 with supported `PCFShadowMap`. Temporary environment construction resources and the owned render target are disposed by scene lifecycle ownership. Printed facial meshes do not cast or receive shadows.

A cream textured mat, rope layers, floor-constrained soles and shared radial contact-shadow surfaces establish depth. Three lamp fixtures and warehouse masonry remain in geometry. The fresh full review finds the exact first-image sculpt, material-plane transitions and highlight character unmet. Studio and runtime lighting differ; neither triangle counts nor exposure values establish fidelity.

The sidecar holds exact CSS shadows and motion extensions. Arena material is albedo under live lights, with provenance in [ASSET-MANIFEST.md](docs/design/ASSET-MANIFEST.md). Fighter geometry and export provenance are recorded separately in [FIGHTER-ASSETS.md](docs/design/FIGHTER-ASSETS.md) and `assets/models/PROVENANCE.json`.

## Shapes

Controls combine circular dials with small rectangular labels/buttons. UI corners use the frontmatter's small radii; the dialog is slightly softer. Dial tick marks are masked rings, pointer strokes identify each wheel, and selected labels have a lightly irregular clipped perimeter. Health tracks skew eight degrees while numeric text counter-skews. Energy tracks divide into eight segments. Contact events use an original jagged SVG burst.

The fighters come from editable `assets/models/boxing-fighters.blend` and `tools/build-fighters.py`, exported to `public/models/player.glb` and `rival.glb`. `FighterModel.ts` binds the authored rig nodes and separate expression prints to runtime posing; the old `ModelGeometry.ts` was removed. There is no procedural figure fallback. Native model surfaces include closed fitted player curl masses, a lower solid asymmetric chestnut quiff, integrated brow/orbit/cheek/nose/jaw relief, projected eye/mouth prints, muscular torso and limb forms, recessed pivots, shaped shorter trunks, fitted long boots and padded gloves with substantial printed cuffs. No fighter raster textures ship. The player retains charcoal costume and blue gloves; the rival retains cream/red costume and red gloves.

The authored rest contract places Body at Y 1.46, Hips at 1.16 and Head at body +0.89. Limb meshes have normalized native length 1 along Y with the proximal end at +Y. Runtime arms use 0.5 + 0.5 segment lengths and maximum shoulder-to-wrist reach 0.985; legs use 0.43 + 0.43. Each glove has a contact landmark at local (0, 0.04, 0.27). Local +Z faces the receiver; +X is the lead Jab/Hook hand and forward foot, while −X is the rear Cross/Uppercut hand and foot. Torso yaw advances the striking shoulder, with matching hip/support pivot. These constraints establish the implemented articulation; the fresh full review still finds its visible anatomy, construction and force transfer below the approved reference.

The final player has 76,191 triangles, 1,421,684 bytes and 46 mesh surfaces; the rival has 49,383 triangles, 906,884 bytes and 47 surfaces. Static evaluated meshes merge by rig parent/material for export while independently editable sculpt pieces stay in Blender. Mouth/BrowL/BrowR remain separate. The concept contains no source 3D mesh or authority for hidden surfaces. [FIGHTER-ASSETS.md](docs/design/FIGHTER-ASSETS.md) records native comparisons and the limits of the reconstruction.

## Components

### Action buttons and stage tools

Yellow start/retry/resume actions use compact rectangular shapes, 48px base minimum height, 14px/18px padding and 600-weight supporting type. Hover brightens yellow and rises one pixel; active lowers one pixel. The dialog Done action uses ink/cream. Stage tools are 36px squares (34px on mobile), cream on translucent ink, with an opaque hover treatment. Focus is a three-pixel blue outline offset four pixels; disabled controls reduce opacity to 0.48. There is no navigation component.

### Three-control rail

Attack offers Jab/Cross/Hook/Uppercut, Stance offers Defensive/Offensive/Neutral/Super, and Power offers 1–4. Attack/Stance dial presses advance selection; Power dial press punches. Option buttons select directly and expose `aria-pressed`. Accepted punches latch Attack/effective Stance/Power; turns during recovery prepare the next action. Power disables outside active sparring or during recovery and labels recovery visibly. Keyboard: A/D, J/L and arrows select; Space punches/starts; P/Esc pause/resume.

### Meters and cues

Health has a labelled semantic meter, live number and blue/red identity. Stamina/Super retain labels, percentages and segmented fills. Super requires charge; premature selection shows an unavailable cue while preserving effective stance. Active Super has a yellow cue and countdown. The current study lasts eight seconds per earned Super activation; this is study behavior rather than final combat balance.

### Contact and Super presentation

At strike start the scene latches a world-space receiver surface: a raycast head target for hit/counter, a live opposing glove contact landmark for block, or an offset aim for whiff. Finite-mass glove motors drive distinct straight/lateral/rising paths to the authored knuckle landmark, with hip/trunk drive, toe pivots and fixed-length limb constraints. Pause and hit-stop freeze their physical clock. Numeric tests cover reachable face/guard contact for all attacks/powers/both sides and the corrected shoulder direction. Labelled development-only fixtures expose windup, exact contact and +75 ms recoil using the actual GLBs and Fighter posing with study strike timings. These are static evidence and do not prove sustained animation quality; production query fixtures are disabled.

The live striking glove projects semantic event lettering near the action. Hit/counter use an ink-outlined yellow jagged burst; block, whiff and notices use quieter cream text. GSAP enters text over 0.12s and fades it over 0.2s after a 0.65s delay. Bounded camera impulses and pooled particles accompany eligible outcomes. Super adds two pooled 16-point cyan/orange glove-line trails during an active player strike. Illustrated registration echoes and contact graphic finish remain subject to the accepted reference. Damage and legality always remain in the pure engine.

### Range timing

An ink strip below the ring names the selected punch's reach and opponent intent. The yellow band, blue player marker and red rival marker visualize the engine gap; verdict text remains readable without color. Feedback identifies the last missed punch. On narrow screens the strip sits directly above the existing controls, with tools below them. Camera tracking keeps essential movement visible under reduced motion.

### Technique rehearsal

Development-only `?motionLab=1` uses the same rig and commands, with no damage/opponent, replenished stamina and Super available. The three wheels remain the controls. A mixed all-192 sequence, a three-style comparison for the selected setup, half speed and local actual-ring recording help compare techniques. The knockout controls select either boxer and one of six falls, or play the escalating bank; the 26-second recorder can capture the complete bank at normal speed. The accepted footwork name appears beneath the technique; controls wrap at narrow widths. Production ignores this route. See TECHNIQUE-PHYSICS.md for recording provenance and solver limits.

The opt-in technique lab also provides explicit receiving-reaction previews for either fighter using the selected punch and power. Hit/Guard/Stun/Miss selectors and a Preview reaction button are confined to training; they never alter health. Native selectors use the paper/ink palette, 44px minimum targets and responsive wrapping. The normal sparring interface retains three dials.

### Settings, lifecycle and motion preferences

Native modal settings pause the study and restore focus to their trigger when closed. They expose native checkboxes for reduced motion and impact sound, a keyboard guide and a rolling timing readout. Start/loading, pause, reset, illustrative victory/loss and renderer failure states are implemented. Both GLBs and arena texture load before sparring; shaders compile asynchronously before readiness. Late-arriving model resources are released if the scene has already been disposed. Sound starts off and requires user unlocking; its restrained synthesized contact voice is not a completed variation bank.

Reduced motion follows the system preference and can be changed in settings. It removes camera shake, particles and Super trails, removes dial/meter transitions, and eliminates text scale/rotation travel while retaining short fades and readable outcomes. Essential fighter posing remains. Rapid transforms stay outside React. The pure study engine advances at fixed 60 Hz; the active physical rig and separate impulse/neck response integrate at 240 Hz with bounded elapsed time. Authored technique goals vary across four stances and four powers; they are not measured muscle forces or full rigid-body collision combat. Each landed punch queues one supported recovery step over 0.22–0.28 s with 0.0225–0.045 m lift; Hook steps laterally and guards brace through knees/toes. Pause/hit-stop freeze presentation and reset clears impulses. Fitted eye prints, centered brows and mouth have distinct Jab/Cross/Hook/Uppercut receiving expressions. Stun uses sculpt-fitted spiral eyes and an open mouth, plus three original golden instanced canaries and small stars above either head. Reduced motion retains static birds and the ordinary camera. A bounded player-stun orbit reveals the player face while keeping feet/birds in frame; the motion lab also widens its field of view for footwork inspection. [RECEIVING-REACTIONS.md](docs/design/RECEIVING-REACTIONS.md) records event ownership, preview controls and verification. These mechanisms are physically informed presentation. [MOTION-CONTRACT.md](docs/design/MOTION-CONTRACT.md) retains the unverified motion targets.

## Do's and Don'ts

### Do:

- **Do** preserve the ring as the dominant surface and the continuous paper rail as its control edge.
- **Do** keep exactly three dials and make pressing Power the punch action.
- **Do** keep environmental posters blank and crowd motion sparse and independently phased.
- **Do** implement meters, selections, settings and event words as live semantic UI.
- **Do** retain editable Blender source, authored GLB ownership and model/font/texture provenance.
- **Do** keep contact feedback local and retain readable outcomes with reduced motion.
- **Do** distinguish scripted-study evidence from future combat, hardware and measured performance milestones.
- **Do** keep the first approved figure identities as the fidelity authority while recording the current reconstruction honestly.

### Don't:

- **Don't** bake labels, meters, fighter animation or gameplay into a concept image.
- **Don't** introduce environmental words, branded character identities or extra movement/punch controls.
- **Don't** replace the continuous rail with a repeated dashboard-card layout.
- **Don't** use a continuous screenwide Super flash or cover the opponent's tells with lettering.
- **Don't** treat this extracted system as visual finish approval or full-game completion.
- **Don't** infer exact figure fidelity, sustained smoothness, minimal repetition, input latency or mobile performance from static fixtures, numeric contact tests or one rolling FPS sample.
