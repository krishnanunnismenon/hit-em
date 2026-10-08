# Finish review — rebuilt reference figures

## 1. Disposition

**REBUILD. The exact visible fighter identity remains unmet.** Preserve this improved playable prototype and its accepted mechanics, but do not call the figures a match or announce visual completion. The required next work is a dedicated modelling and rigging pass on the two fighter assets, followed by contact staging. Further small procedural adjustments are unlikely to close the illustrated identity gap.

This is a fresh full review of the first review-driven rebuild for the user's latest request: “The game mechanics are good, but the characters don't look anything you have shared in the first generated image, use somewhat real physics and the exact figures”. The primary authority is `.impeccable/mocks/01-ringside-flash.png`; `02-fight-club-zine.png` supports the quiet guard. The user's 8:15 PM screenshot remains authoritative rejection evidence. Source models were not supplied with the generated illustration. An authored 3D reconstruction can target its visible identity; exact unseen geometry cannot be guaranteed.

The rebuild makes substantive corrections: face prints now stay on the surface; the rear hair shell is continuous; the worst serrated self-shadow fringe is removed; the neutral stance is taller; and both complete heads fit the desktop and mobile views. Those repairs do not establish fidelity. The new fighters still have different hair, facial anatomy, body construction and clothing silhouettes from the approved people.

This is the second **REBUILD** directive for this request. Put this review and `FINISH-REVIEW-REFERENCE.md` before the user for a choice about a dedicated asset pass or accepting the current adaptation. Impeccable `reference/new-work.md`, section 7, says: “Consult the user only on a second rebuild directive, both verdicts on the table”. Do not begin another unattended polishing loop. No new visual direction, gameplay rewrite or backend expansion is warranted.

## 2. Contract audit

| Commitment | Result | Evidence and implication |
| --- | --- | --- |
| First illustration's visible fighter identities | **FAIL** | Blue/red ownership is recognizable, but the heads, moulded anatomy and shorts are visibly different. The comparison is against the pixels, not the number of mesh sections. |
| Distinct player and rival hair | **FAIL** | Player has long diagonal swept ridges rather than clustered short black curls. Rival has a smooth rounded sweep rather than the raised asymmetric brown quiff. Both still derive from one shared cap/sweep construction. |
| Adult expressive face | **FAIL** | The repaired rival eyes and brows are continuous, but their mild expression, pale rounded face and weak visible nose/jaw do not reproduce the mature angular face. The red guard also hides the mouth throughout the supplied guard/contact sequence. |
| Articulated moulded toy construction | **PARTIAL** | Live shoulders, limbs, joints, glove thumbs, belts and boots exist. Smooth tapered back, ball shoulders, broad black elbow ends and inflated short legs remain a different construction. |
| Actual animated 3D | **PASS in inspected source and pixels** | Fighters are meshes with two-bone posing. The first image is not flattened into gameplay. |
| Somewhat real physics | **PARTIAL, appropriately bounded** | Mass-based impulses, damped balance and one-foot recovery steps support physically informed presentation. Contact is staged, not collision-derived combat. The sequence does not prove convincing visible weight transfer or smoothness. |
| Preserve accepted mechanics | **SUPPORTED** | Presentation consumes the pure study engine's events and does not decide damage. Parent reports 16 passing tests, build and format checks; this reviewer did not rerun them. |
| Readable laptop framing | **PASS for head containment; PARTIAL for combat separation** | Complete heads fit at 1672×941 and 1920×1080. Foreground player feet may leave the scene, as the reference allows. Four overlapping gloves still obscure contact and much of the rival's expression. |
| Responsive composition | **PASS for supplied static view** | At 390×844, both heads and both full stances fit, with three controls and both energy meters present. Touch operation, overflow under other content and mobile performance are unverified. |
| Text-free environment and sparse crowd | **RETAINED** | Blank posters, cream mat, colored ropes, sparse spectators and overhead fixtures are visible. The broader scene is a simplified runtime adaptation; this review does not redefine that adaptation as the illustrated quality bar. |
| Exactly three dials and semantic information | **RETAINED in source and screenshots** | Attack/Stance/Power, press Power to punch, selections, health, stamina and Super retain their hierarchy. Semantic buttons and meters are present. No extra punch control appeared. |
| Contact words stay secondary to the action | **PARTIAL** | Offset lettering is better placed than over the striking glove, but THWACK still overlaps the rival's right hair/temple in `cross-1.jpg` through `cross-3.jpg`. |
| Start/pause/settings/result/error and reduced motion | **SOURCE SUPPORTED; NOT VISUALLY VERIFIED here** | Source contains the functional states, focus restoration and reduced camera/effect behavior. The packet contains only active play and one cross. |
| Smooth, minimally repetitive animation and Super finish | **UNVERIFIED** | A six-image cross sequence cannot establish sustained motion, all four punches, variation, Super or end states. No new performance result is inferred. |
| Honest scope | **PASS** | The scene remains labelled a motion study with scripted sparring. The physics study distinguishes animation tuning from measured boxing forces and rigid-body simulation. |

## 3. Craft floor

The approved plastic-toy fight club remains the right world. Ring dominance, cream rail, condensed athletic lettering, restrained interface framing and three tactile controls keep the experience specific to this product. Do not replace them with a generic dashboard or photorealistic humans.

**Depth and materials remain below the reference.** PMREM reflections and corrected key-light shadow bias improve continuity. The large broken chest wedges and former cuff/neck acne are no longer the dominant failures. However, high fill/exposure makes the skin read pale and broad; the back lacks the reference's angular mould planes and richer warm highlights. Large dark elbow ends read like black caps rather than narrow engineered joint recesses. Player shorts have swollen rounded leg openings rather than the first figure's long squared segmented trunks. These are asset and lighting decisions, not defects that extra shine will solve.

**Hierarchy, typography and spacing are coherent in this packet.** The ring leads, health and round stay at the top, controls form one rail, and mobile organizes the same three controls. Self-hosted Barlow/Barlow Condensed avoids a system display-font substitute. Source tracking remains within the floor. Thin dividers and mechanical circular dials are earned by the control task. There is no decorative card scaffold, gradient text, continuous slogan chip or faux SVG fighter illustration. The previous entrance eyebrow has been removed in source.

**Accessibility and state coverage are not a whole-surface pass.** Focus outlines, selection styling, `aria-pressed`, labelled meters, hover/disabled styles, settings focus return and a renderer-error recovery action are present in source. No keyboard traversal or native dialog operation was exercised. Current JPEG text softness prevents a reliable small-text assessment; no rendered contrast ratios or computed spacing were measured. Selection/focus theming is authored; no scrollbar was visible, and no text-entry caret is part of the shown surface. The four options per control are grouped by action, with direct selection and visible state, rather than presented as one twelve-choice decision.

**Motion is partly authored and still lacks behavioral evidence.** Contact feedback is localized, reduced motion suppresses camera shake, particles and trails, and fast transforms stay outside React. The shown strike has a small visible excursion and a near-static recipient, which does not yet carry the decisive illustrated contact. No new detector ran. The parent's one detector run reports only three advisory effect colors (`#ffcb46`, `#74d5eb`, `#ff9a68`), and its provenance scan reports four rasters with zero missing records. Neither report validates the fighter art. The external QUALITY BAR card was unavailable in the recorded concept/direction documents; this reviewer makes no claim to have inspected it.

## 4. Ranked material findings and asset-pass handoff

### 1 — P0: Author two distinct head assets from the visible reference

**Evidence:** All three new viewport captures show the player with a tall, smooth diagonal sweep and the rival with a rounded brown cap. Paired head crops make the difference unambiguous: the first reference has compact individually formed black curls; the quiet rival reference has a lifted curled forelock, strong angled black brows, deep eyes, a projecting nose and a square adult jaw. Repairing print attachment did not restore those identities.

**Bounded correction:** Replace the shared `hairSections`/seven-crest `fighter-swept-hair-v4-*` recipe in `FighterModel.ts` with separately authored player curl and rival quiff moulds. Model the rival's brow ridge, nose bridge/tip, cheek and chin planes against the first figure; keep expression prints attached to that sculpt. `brows` is still returned empty, so its reaction hook is inert. Use attached alternate expressions or conforming deformation rather than rotating a curved print off the face. Build actual editable 3D assets for the current rig; do not use illustration crops as characters.

**Acceptance:** At reference-comparable head scale, the player is identifiable by the compact curly silhouette and ear/nape construction, and the rival by adult planes and asymmetric quiff. A quiet guard shows both eyes/brows and a readable nose/jaw; the contact pose shows a serious reaction mouth. No missing print patches, holes or default swept-cap substitute remains.

### 2 — P0: Rebuild the muscular toy shell and squared trunks as one proportional asset pass

**Evidence:** The first image has a broad faceted back with visible central mould line, substantial articulated shoulder/upper-arm shells and long squared black trunks. Current captures show a smooth taper, round shoulder balls, swollen shallow short legs and a high uninterrupted belt/brief mass. The rival is less crouched than before, but its lower body and thin torso still lack the reference's balanced adult construction.

**Bounded correction:** Author torso planes, shoulder transitions, genuine joint sockets, waistband and two trunks together against the first image. Preserve bone lengths and solve bind pose/IK with the asset proportions. Keep the repaired taller neutral stance, visible thigh/knee separation and floor support. Replace oversized black elbow end surfaces with narrow controlled socket recesses. Match squared trunk hems and rival red outer stripes; do not approximate shorts by widening rounded rings.

**Acceptance:** A normalized back/three-quarter comparison reads as the reference's muscular moulded toy, with strong scapula/lat planes, substantial limbs, narrow joint recesses and squared trunks. Guard knees remain shallowly bent; no permanently compressed stance or inflated briefs silhouette remains.

### 3 — P1: Verify reachable contact, readable extension and recipient weight transfer

**Evidence:** `cross-0.jpg` through `cross-5.jpg` show a raised blue glove and a cluster of blue/red guards. THWACK and rival-health loss establish a scripted hit, but no supplied frame clearly shows the blue glove meeting the jaw with the reference's extended arm and separate head/torso reaction. This is not proof that no contact frame exists between samples; it is insufficient evidence of the required result.

**Bounded correction:** Keep the new opponent-world target latch. Stage fighter spacing and shoulder/hip turn so the latched surface lies within the rig's fixed arm reach; `Fighter.pose()` currently clamps shoulder-to-wrist reach to 0.985. Verify the actual glove contact surface, not just the target vector. Preserve existing engine outcomes/timing. Make hit/counter reaction visibly distinct from a guard brace while retaining one support foot during replanting. Offset event lettering beyond the rival's head silhouette so the contact can be inspected.

**Acceptance:** Capture a deterministic peak contact pose or short timing-labelled clip: hit/counter reaches face/body with a slightly bent extended elbow and separate recoil; block stops on a red glove; whiff clearly misses. Demonstrate rear-foot pivot/hip turn and grounded recovery without changing damage rules. The whole face/contact remains visible before lettering is added.

### 4 — P1: Tune the toy material finish after the authored silhouettes hold

**Evidence:** Current skin is pale with broad smooth highlights; the reference has warm tan plastic, clear mould planes and stronger controlled highlight-to-shadow variation. Continuous glossy hair currently accentuates the wrong long ridges. More geometry alone will not correct the rendered material.

**Bounded correction:** Under the existing camera, tune key/fill/environment intensity, exposure and fighter material roughness against the reference in a neutral guard and contact pose. Preserve the repaired shadow bias and actual floor shadows. Evaluate the net render, not the hex skin token. Avoid darkening the whole warehouse or adding surface dirt to compensate for missing sculpt planes.

**Acceptance:** Warm plastic retains visible facial/back planes and narrow joint depth, with controlled glossy highlights and no serrated acne, unexplained dark cutouts or bleached face. Both identities must remain clear at desktop and mobile scales.

The handoff should include the two approved images, the rejection screenshot, this review, the current reusable rig and physics module, and front/back/three-quarter asset turnarounds. Treat visible reference matching as the asset milestone and preserve the current prototype as the mechanics baseline. Do not guarantee exact hidden surfaces from a single generated image.

## 5. Verification limits

Reviewed all required files: both approved references, the authoritative 8:15 PM rejection screenshot, `reference-desktop.jpg` (1672×941), `reference-user-1920.jpg` (1920×1080), `reference-mobile.jpg` (390×844), and `cross-0.jpg` through `cross-5.jpg`. Also inspected paired head, rival-face, back/trunks and contact crops derived only from those files; these are inspection aids, not new gameplay captures or shipping assets.

Reviewed the direction/concept/physics documents, prior full reference review, and the relevant model/geometry/rig/dynamics/camera/light/control/UI/state source. No browser was used, no new detector ran, and no UI or mechanics were edited. Capture content is valid for visual comparison; text raster softness limits small-type judgments but does not conceal the material silhouette/identity failures.

The cross samples are approximately 90 ms apart plus call overhead. They demonstrate a short pose progression, one hit cue and recovery, not exact contact timing, sustained smoothness, all-attack variation, complete locomotion, performance, accessibility or collision accuracy. Parent-reported technical checks remain separate evidence. The current implementation is improved and reviewable, but exact visible character fidelity is still a failed requirement.
