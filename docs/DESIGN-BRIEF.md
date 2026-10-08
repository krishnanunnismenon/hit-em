# Design brief — accepted concept treatment and motion-study implementation

## World

The user confirmed an underground comic fight club: a reduced ringside crowd, dramatic overhead spotlights and worn text-free posters. Illustrated concept frames come before application UI implementation.

Moulded toy fighters meet printed comics. Chunky bevelled torsos, articulated joints, oversized gloves, expressive original faces, limited plastic materials and readable silhouettes. A compact theatrical ring with strong key lighting and a restrained crowd. Keep attention on the two fighters.

## Composition

Behind-and-above player camera as the accepted starting default; both fighters visible. Opponent intent must remain readable. Compact health, stamina and Super indicators surround the arena; selected Attack/Stance/Power remains legible in a control strip. Fight is the main surface, not a dashboard. Entrances and victory moments may use comic-panel framing; do not cut away during an unreadable incoming attack.

## Graphic language

Near-black ink, warm paper, punch red, electric blue and impact yellow. These are proposed colour roles, not yet fixed hex tokens. Bold condensed display type for rounds/names, expressive comic lettering for impact words, clean supporting text for instructions. Define final font assets and licenses in the visual session.

THWACK, WHIFF, COUNTER and GUARD BREAK are feedback tied to real combat events. Locate lettering around the event, keep tells/meters unobscured, limit overlapping effects, and include text/symbols alongside colour. Original lettering and characters with comic inspiration; no dependency on Marvel/LEGO assets.

## Motion grammar

Animation quality and minimal repetition are the user's priority. Follow [the motion contract](design/MOTION-CONTRACT.md): contextual pose variation, continuous blending, planted feet and measured pacing before hardware integration. The study implements these mechanisms; the full production motion requirement is not yet satisfied or comprehensively benchmarked. See design/IMPLEMENTATION.md and the independent review for measured evidence and remaining gaps.

Preparation → anticipation → contact pose → brief impact pause → recoil → recovery. Jab is crisp; Cross carries shoulder/torso rotation; Hook has a clear lateral arc; Uppercut has a visible rising path. High-power attacks need readable preparation and longer recovery. Camera motion, plastic reaction, sound layers and comic typography establish weight. Stagger must leave enough real interaction time to turn wheels; short visual slow motion should not create unfair timing.

Reduced-motion option removes camera shake, large travelling text and dramatic camera moves, keeping meaningful hit/guard feedback. Avoid rapid flashing. Pause on background loss/reconnect until the player intentionally resumes.

## Performance targets

Aim for 60 fps on the user's laptop, measured after the vertical slice. Share materials/geometries, pool effects, cap resolution and shadow cost, and pause rendering when inactive. Mobile performance is a later test matrix. All targets are goals rather than benchmarks.

## Before visual production

Illustrated concept frames were chosen on 2026-10-04. See [the concept review](design/CONCEPT-REVIEW.md) and the three frames in .impeccable/mocks. The user accepted the shown treatment with revisions on 2026-10-04: text-free environmental signs, approximately half the crowd and animation first. Retain the shown toy fighter treatment; final names/roster remain open. Resolve visual quality using one fight, rather than spreading unfinished art over a campaign.

## Implementation milestone

The accepted ring and three-control layout have a live keyboard/pointer motion study. Following the user’s 2026-10-05 choice to continue character modelling, two dedicated authored Blender/GLB fighters and the requested asset/rig/staging corrections are implemented. Environmental panels contain no wording; the crowd is limited to 20 spectators. The first approved Ringside flash frame remains the exact visible figure authority. Both the [first authored-asset review](design/FINISH-REVIEW-AUTHORED-ASSETS.md) and the [fresh full review of its correction](design/FINISH-REVIEW-AUTHORED-ASSETS-REBUILD.md) return REBUILD. Evidence/persistence pass, while exact visible figure identity/construction fails. The subsequent technique-motion request authorizes the scoped active rig work; further character modelling remains a separate decision. Static labelled contact fixtures and one rolling laptop timing sample are current evidence, not smoothness or finish certification. Details are in docs/design/IMPLEMENTATION.md. Final combat and hardware connection are deferred.

## Current technique pass — 2026-10-05

The user scoped the next pass to stance/power/punch variety, leg involvement and waist twist. The [active physical controller](design/TECHNIQUE-PHYSICS.md) and a development-only 64-combination rehearsal are implemented. The existing character models and approved figure authority remain fixed. Historical character-fidelity REBUILD findings remain unresolved; this motion pass is not a new exact-figure approval.
