# Finish review — reference figure reconstruction

## 1. Disposition

**REBUILD the fighter surfaces and their default/strike presentation before shipping.** The current captures do not reproduce the visible identities in `01-ringside-flash.png`. A more continuous torso and more detailed accessories are present, but these do not close the user's central rejection: the people still look substantially different from the approved figures. Keep the existing gameplay and presentation dynamics; correct the model, pose and camera around them. No new visual direction or brand discovery is needed.

Reviewed on 2026-10-04 by an independent finish reviewer, using the provided files only. No browser was used. The first approved Ringside flash is the primary figure authority; Fight-club zine supports the quiet guard and composition. The user's 8:15 PM screenshot is authoritative rejection evidence, not an accepted alternate figure style.

## 2. Contract audit

- **Exact visible figure identity: FAIL.** Reference: angular adult facial planes, large expressive printed eyes/brows, a sculpted nose and grimace, continuous short black curls on the player, asymmetric swept brown quiff on the rival, substantial articulated limbs and recognizable moulded toy joints. Current: nearly blank faces with tiny fragmented marks, interrupted hair caps, generic smooth shells and deeply bent, abbreviated lower bodies. These remain recognizable as blue/red toy boxers, but not as the requested figures.
- **Live articulated 3D: PASS in inspected evidence.** The captures and source show actual animated geometry. Reconstruction from an illustration is the correct medium. There is no original generated mesh, so hidden geometry cannot be called exact.
- **Physically informed motion: PARTIAL.** Source separates impulses and 240 Hz damped integration from combat decisions. Six cross frames show a bounded recoil and recovery. Their contact geometry is not persuasive, and this sequence cannot establish general smoothness or variety.
- **Preserve mechanics: supported by source separation and the parent's reported 16 passing tests.** This review did not rerun the tests. Correcting hit/block staging must consume existing engine outcomes rather than change damage through animation.
- **Environment/control commitments: visibly retained.** Cream mat, sparse crowd, blank posters, three colored ropes, cobalt/scarlet identity, three functional dials, continuous cream rail and live meters remain. These are not the material failure in this request.
- **Both fighters/readable combat on laptop and mobile: FAIL in current framing.** The player's hair is cut by the desktop top edge; the mobile capture cuts much of the player off the left edge. The fighters overlap so closely that the opponent's face and the crossing glove are hard to read.

## 3. Craft floor

The selected toy/fight-club world earns the plastic materials, cream print rail and dramatic lighting. Do not replace it with a generic UI polish pass.

The material failures are depth and subject construction: serrated dark self-shadow fringes around the neck, glove cuffs and arms; large abrupt dark wedges on the rival's torso; broken facial surfaces; and an incomplete rear hair silhouette. These read as damaged rendering, not authored mould seams. The hard fighter shadow is coherent in direction, but its edge treatment is much harsher than the approved photographic toy lighting.

The UI uses the project's condensed display face and maintains meaningful control hierarchy. Screenshot raster softness prevents a reliable small-text contrast or type-size judgment. No numerical contrast, computed spacing, focus traversal, hover/disabled/error state, reduced-motion operation or scrollbar audit was performed. The parent's detector result contained three advisory palette entries and no hard mechanical issues; that does not constitute figure-fidelity acceptance. The reported provenance scan found four rasters with no missing records.

## 4. Material findings, ranked

### 1 — P0: Rebuild the readable face and the two distinct hair silhouettes

**Evidence:** `reference-desktop.jpg`, `reference-user-1920.jpg` and all six cross frames show the rival's eyes and eyebrows as tiny scattered fragments, with little adult facial expression. The player has a large skin-colored island inside the rear black hair boundary and a dark triangular patch at the nape. Neither occurs in the first reference. The reference rival's brow, eyes, cheekbones, nose, jaw and open grimace are large, readable parts of the identity.

**Implementation:** In `FighterModel.ts`, strengthen the jaw/chin, cheek planes, brow ridge and nose bridge/tip against the first image. Give the player a continuous short black curl mould with a complete rear hairline; give the rival an asymmetric swept brown quiff rather than the same sinusoidal shell in another color. Replace or repair sparse `printGeometry`: its boundary-only `ShapeGeometry` triangles span a curved face and can sink below it. Subdivide the full decal surface and project every vertex, or use a conforming surface/decal material with controlled offset. Disable print shadow casting and avoid coplanar fighting. Populate `brows` if expressions depend on it; currently it is returned empty. Expressions must retain surface attachment when the mouth changes.

**Acceptance:** At a comparable rival-head size, both eyes, both brows, nose, cheek/jaw silhouette and a serious mouth are continuously visible in guard and a hit expression. The player's rear head has one continuous intentional black hair shape. This must be evident without impact lettering covering the face.

### 2 — P0: Remove damaged seams, self-shadow acne and intersecting shells

**Evidence:** Jagged brown/black fringes occur below the player head and along glove cuffs/upper arms. The rival has harsh cutout-like wedges across the chest and forearms. Rounded shoulder shells show abrupt articulation breaks. The reference has narrow controlled joint recesses, smooth gloss transitions and cohesive skin shells.

**Implementation:** Inspect `profileGeometry` cap boundaries and mesh intersections under neutral light first. Separate genuine articulation gaps from intersecting shells. `Resources.mesh` casts and receives shadows on every small surface; face prints and shallow trim should not all cast. Tune the Arena key's `bias = -0.001`, introduce appropriate normal bias, and use a softer shadow treatment while retaining mat grounding. Do not mask real holes or intersections with brighter fill. Keep mould seams narrow and placed at joints.

**Acceptance:** A fresh full-resolution guard and cross capture has no serrated cuff/neck fringe, no skin-colored hole in the hair mould and no unexplained dark wedge that resembles a missing surface. Joint recesses remain readable on both fighters.

### 3 — P0: Match the first reference's adult toy anatomy and near-upright guard

**Evidence:** The current white shorts sit over tightly folded thighs; the rival's knees bulge immediately below the hem and the visible legs are compressed. The player has a long featureless V-shaped back and rounded ball shoulders. The first image has a broad faceted moulded back, strong shoulder/upper-arm construction, separate substantial thigh and shin masses, and a wide, nearly upright stance even during recoil. Fight-club zine also keeps the rival's legs long and only gently bent.

**Implementation:** Author model proportions together with the leg bind/IK, not by extending boots or stretching segment scales. Rebalance torso height, hip height, thigh/shin lengths and stance width in `FighterModel.ts`/`Fighter.ts`. Neutral knee flexion should be shallow; larger flexion is earned by uppercut anticipation, recovery or knockout. Preserve visible thigh above the knee and a coherent boot-to-shin connection. Refine scapula/lat planes and shoulder-to-upper-arm transition so the silhouette resembles the reference moulded figure.

**Acceptance:** In a normalized side-by-side guard capture, waist-to-floor span and knee/boot placement resemble the approved rival; the figure no longer reads as permanently squatting. The player back and shoulders read as the same muscular articulated toy construction seen in the first reference.

### 4 — P1: Stage cross contact and weight transfer at the actual authored target

**Evidence:** `cross-0.jpg` through `cross-5.jpg` show only a small visible glove excursion near the rival's red guard. The impact word and health change occur there; there is no comparably readable extended cross into the jaw or strong separate contact pose like Ringside flash. A limited sequence shows recoil, but the source still defines strike targets in fighter-local coordinates without the opponent's contact location.

**Implementation:** Use the existing outcome to select a presentation target in opponent world space: face/body for hit/counter, guard surface for block, clear overshoot for whiff. Convert it into the striker's arm space and solve within fixed bone-length limits. Let shoulder/hip yaw and a restrained rear-foot pivot supply reach instead of elastic arm scaling. Preserve one support foot during replanting. Keep impact lettering offset so it does not hide the contact being verified.

**Acceptance:** A contact frame visibly shows the blue glove meeting the intended surface, with an extended but slightly bent elbow and distinct recipient head/torso recoil. A block visibly stops at a red glove. No punch changes the existing combat decision or damage timing.

### 5 — P1: Reframe the corrected figures so their identity can be judged

**Evidence:** Desktop/player hair is clipped at the upper edge and overlaps the top HUD region. At 390 px the player is substantially cropped on the left. The approved first reference shows the complete player head below the HUD and clear separation between the heads/torso lines.

**Implementation:** Adjust responsive camera distance, height and look-at target in `BoxingScene.ts` along with the rebuilt figures; widening only the mobile field of view is insufficient. Preserve the close ringside angle and foreground player scale, while giving the full player hair silhouette and rival face room to read. Verify 1672×941, 1920×1080 and 390×844 after the geometry changes.

**Acceptance:** Both heads remain fully inside the arena viewport below the HUD in guard. Mobile retains meaningful player torso/guard and the rival's full stance. A contact pose clearly separates striker, target and reaction.

## 5. Verification limits

Inspected every provided full capture: the first and second approved references, the authoritative user rejection screenshot, three fresh reload captures, and `cross-0.jpg`–`cross-5.jpg` at approximately 130 ms intervals. Reviewed `FighterModel.ts`, `ModelGeometry.ts`, `Fighter.ts`, `FighterDynamics.ts`, `BoxingScene.ts`, relevant lighting/shadow construction, and the direction/concept/physics documents.

The sequence establishes only the pictured pose progression, one contact event and approximate grounding. It does not prove frame rate, smoothness across attacks, animation variety, contact-volume accuracy, long-run foot behavior, accessibility or device performance. Physically informed presentation is supported; measured real boxing forces and full rigid-body simulation are not claimed. Technical checks can remain green while the required figure identity remains a visual failure. Re-review requires fresh guard and contact captures after the ranked corrections, not another claim based only on mesh complexity or passing tests.
