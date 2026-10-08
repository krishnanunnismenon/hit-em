# Asset manifest — boxing motion study

Independent asset-producer handoff, 2026-10-04. This pass produces ingredients for the accepted fight-club treatment; it does not verify the finished application or motion quality.

Approved reference: [.impeccable/mocks/02-fight-club-zine.png](../../.impeccable/mocks/02-fight-club-zine.png), with [01-ringside-flash.png](../../.impeccable/mocks/01-ringside-flash.png) for counter framing and [03-ink-overdrive.png](../../.impeccable/mocks/03-ink-overdrive.png) for Super. The normal mock was visually inspected before production. No mock crop ships as a production asset.

Binding revisions: no environmental lettering on walls, posters, placards, ropes or arena scenery; approximately half the concept crowd; real Three.js fighters, arena and continuous pose animation. UI labels and impact feedback remain semantic, live and readable.

## Produce

### arena-concrete

- **id:** arena-concrete
- **source_crop:** full normal approved mock, cream/charcoal worn arena floor and concrete surface material regions; no standalone crop supplied.
- **output_path:** `public/textures/arena-concrete.webp`
- **public_url:** `/textures/arena-concrete.webp`
- **strategy:** faithful material regeneration using the approved mock as reference; built-in image generation, then dimension/format conversion only.
- **prompt_used:** verbatim at `assets/sources/textures/arena-concrete.prompt.txt`; embedded in the source PNG by Impeccable's `embed-prompt.mjs`. WebP uses the script's supported `.webp.json` sidecar fallback.
- **dimensions:** 512 × 512 shipping tile; 1254 × 1254 generated source.
- **format:** opaque WebP, quality 83; 89,266 bytes.
- **transparency:** none.
- **deviations:** regenerated as a flat material plate rather than preserving the mock camera or illumination; this is intentional because geometry and live lighting own them. No ring markings, signage or objects are included.
- **qa_status:** accepted.
- **QA evidence:** original and final compressed tile visually inspected against the approved palette/material; 2 × 2 repeat proof inspected without a prominent border or seam. Text-free, no vignette, no baked lighting or perspective. Repeatability is a visual QA result, not a claim that opposite edge pixels are mathematically identical.
- **composition handoff:** use one shared Three.js texture with RepeatWrapping in both axes and sRGB color space. Use on worn arena/concrete planes with neutral tint and high roughness around 0.9. Start with roughly 2–3 repeats across a ring-size surface, adjusting by world-space UV scale. Let the renderer own directional lights, shadows and depth. Do not put this busy surface behind small UI copy.

### worn-paper

- **id:** worn-paper
- **source_crop:** full normal approved mock, warm cream lower control rail paper material; no standalone crop supplied.
- **output_path:** `public/textures/worn-paper.webp`
- **public_url:** `/textures/worn-paper.webp`
- **strategy:** faithful quiet-paper material regeneration using approved mock as reference; built-in image generation, then dimension/format conversion only.
- **prompt_used:** verbatim at `assets/sources/textures/worn-paper.prompt.txt`; embedded in source PNG by `embed-prompt.mjs`, with shipping WebP prompt sidecar.
- **dimensions:** 512 × 512 shipping tile; 1254 × 1254 generated source.
- **format:** opaque WebP, quality 83; 36,810 bytes.
- **transparency:** none.
- **deviations:** intentionally quiet grain instead of the mock's baked lettering, gloves, borders and dividers. Semantic code owns those layers.
- **qa_status:** accepted.
- **QA evidence:** original and final compressed tile inspected; restrained cream grain keeps dark label contrast. 2 × 2 repeat proof inspected without a prominent border or seam. No words, illustrations, panel chrome, folds or dramatic stains.
- **composition handoff:** use as a repeating CSS background on the cream control rail at approximately 512 CSS pixels per tile. Compose ink dividers, rough outer edge treatment, headings, selected blue swatches and actual controls above it. Keep dark body copy opaque; do not animate the texture.

### Production and source inventory

Shipping texture pixels total **126,076 bytes**. Only the two WebPs are needed by runtime. Source PNGs and exact prompt text are retained in `assets/sources/textures/` outside Vite's public directory for reproducibility; they are excluded from runtime build output and should never be loaded by gameplay.

| File | Role |
| --- | --- |
| `public/textures/arena-concrete.webp` | Shipping arena material |
| `public/textures/arena-concrete.webp.json` | Exact prompt sidecar |
| `public/textures/worn-paper.webp` | Shipping rail material |
| `public/textures/worn-paper.webp.json` | Exact prompt sidecar |
| `assets/sources/textures/arena-concrete.png` | Generated source with embedded prompt |
| `assets/sources/textures/arena-concrete.prompt.txt` | Exact source prompt |
| `assets/sources/textures/worn-paper.png` | Generated source with embedded prompt |
| `assets/sources/textures/worn-paper.prompt.txt` | Exact source prompt |

Prompt scan: **4 raster files, 0 missing prompts** using `node /Users/krishnanunni/.agents/skills/impeccable/scripts/embed-prompt.mjs --scan public/textures assets/sources/textures`.

## Direct

Fonts are unmodified official prebuilt WOFF2 binaries from the [Barlow author's repository](https://github.com/jpt/barlow). The [upstream license](https://github.com/jpt/barlow/blob/main/OFL.txt) is SIL Open Font License 1.1 and is included locally at `public/fonts/OFL.txt`. Copyright 2017 The Barlow Project Authors; principal designer Jeremy Tribby. Preserve that license when redistributing these files. No font dependencies were installed.

| id | source_crop / source | output_path | public_url | strategy | dimensions | format | transparency | deviations | qa_status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| display-bold | Official `jpt/barlow/main/fonts/woff2/BarlowCondensed-Bold.woff2` | `public/fonts/BarlowCondensed-Bold.woff2` | `/fonts/BarlowCondensed-Bold.woff2` | Direct upstream binary, weight 700 | Vector font | WOFF2; 61,060 bytes | N/A | None | accepted |
| display-black | Official `jpt/barlow/main/fonts/woff2/BarlowCondensed-Black.woff2` | `public/fonts/BarlowCondensed-Black.woff2` | `/fonts/BarlowCondensed-Black.woff2` | Direct upstream binary, weight 900 | Vector font | WOFF2; 58,052 bytes | N/A | None | accepted |
| supporting-regular | Official `jpt/barlow/main/fonts/woff2/Barlow-Regular.woff2` | `public/fonts/Barlow-Regular.woff2` | `/fonts/Barlow-Regular.woff2` | Direct upstream binary, weight 400 | Vector font | WOFF2; 58,964 bytes | N/A | None | accepted |
| supporting-semibold | Official `jpt/barlow/main/fonts/woff2/Barlow-SemiBold.woff2` | `public/fonts/Barlow-SemiBold.woff2` | `/fonts/Barlow-SemiBold.woff2` | Direct upstream binary, weight 600 | Vector font | WOFF2; 59,936 bytes | N/A | None | accepted |

Exact primary-source download URLs, SHA-256 digests and sizes are in `public/fonts/PROVENANCE.json`. All four signatures are valid `wOF2`; all downloaded file hashes match the recorded digests. Font binaries total **238,012 bytes**. Font shaping/layout in the finished interface remains the implementation reviewer's responsibility.

CSS handoff:

```css
@font-face {
  font-family: 'Barlow Condensed';
  src: url('/fonts/BarlowCondensed-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Barlow Condensed';
  src: url('/fonts/BarlowCondensed-Black.woff2') format('woff2');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Barlow';
  src: url('/fonts/Barlow-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Barlow';
  src: url('/fonts/Barlow-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
```

Use Barlow Condensed 700/900 for the round, fighter identifiers, control headings and compact comic feedback. Use Barlow 400/600 for instructions, lab controls and secondary information. Impact words can use skew/rotation and semantic SVG bursts, with restrained offsets that preserve legibility. Do not synthesize a new display asset from font screenshots.

## Semantic

These rows are concrete build handoffs. `needs_parent_review` means the runtime implementation and motion must be reviewed; no raster gameplay substitute has been produced.

| id | implementation | notes | qa_status |
| --- | --- | --- | --- |
| toy-fighters | Two articulated Three.js Group hierarchies: pelvis/root, chest, neck/head, upper/lower arms, oversized gloves, upper/lower legs and boots. Shared bevelled geometry and plastic MeshStandardMaterial; original faces built from clean geometry or semantic canvas/vector strokes. Quaternion pose interpolation from current transforms; planted contact phases and separate guard blends. | Preserve blue player/red rival silhouettes, rounded moulded plastic, chunky joints and expressive original identities. Punch/action clock owns trajectories; visual variations retain canonical striking hands and legal timings. No fighter sprite sheet or raster animation. Follow MOTION-CONTRACT.md. | needs_parent_review |
| ring-geometry | Three.js floor, platform, posts, ropes and turnbuckles using shared geometry; overhead fixtures and warm key/blue fill lights. Apply arena-concrete only as live material albedo. | Stable behind/above-player camera keeps both fighters and rival intent visible. No wording, logo stamps, crown symbols or numbers on arena scenery. Blank poster planes may have worn solid paint, never signage. | needs_parent_review |
| crowd | Small shared/instanced low-detail toy spectators around the ring; limit count to approximately half the concept density. Give independently phased low-amplitude body/arm reactions to bounded subsets on major events. | Do not synchronize all cheering or create identical crowd beats on every punch. Crowd updates should be cheaper than fighter animation. Raster crowd plate would prevent the required varied motion. | needs_parent_review |
| rotary-control-rail | Semantic HTML three-column Attack/Stance/Power controls above repeating worn-paper background. Real focusable controls own input, selected labels and disabled/unavailable states. CSS or inline SVG owns black dial bodies, tick marks, blue indicators, black dividers and worn outer edge. | Keep four attacks, four power levels, stance state and earned Super accessible. Changes prepare the next latched punch. Scale/reflow rail without shrinking labels to unreadability. Knob/input interactions are live, never baked into an image. | needs_parent_review |
| fight-hud | Semantic HTML health, stamina and Super meters; compact names and round in self-hosted Barlow Condensed. CSS owns black ink framing, cream edging and segmented meter geometry. | Do not consume arena readability with dashboard cards. Metre values and lab state are live text. Keep color plus text/symbol indication. | needs_parent_review |
| counter-feedback | Pooled CSS/SVG local impact burst and semantic event word tied to actual or explicitly scripted contact, with bounded camera impulse and local pose reaction. | 01-ringside-flash is presentation reference only. Variation must not replay the same recoil, text and cheer ensemble every hit. Reduced-motion removes shake and travelling lettering while preserving outcome feedback. | needs_parent_review |
| super-feedback | Local Three.js material-color echoes and small pooled SVG/CSS bursts; semantic earned-state cue in HUD. | 03-ink-overdrive is presentation reference only. No continuous full-screen flash, raster scene swap or occluded opponent tells. Reduced-motion retains clear state without echoes. | needs_parent_review |
| audio | Native Web Audio synthesis/pooling for contact, block, whiff and a small set of varied crowd accents. | No unlicensed sample files acquired. Parent owns auditory QA and alignment at contact. | needs_parent_review |

## execution_order

1. Load the self-hosted display/supporting fonts and compose the semantic control rail/HUD.
2. Preload the two shipping WebP materials before the first rendered interaction; reuse each texture.
3. Build original fighter/arena geometry and the reduced crowd; use materials at world-appropriate scale.
4. Tune punch/guard/reaction continuity, contact feedback and reduced-motion behavior against the motion contract.
5. Verify finished composition, repeated attack motion and measured performance on the user's laptop. This asset pass supplies no photographed or synthetic proof of runtime smoothness.

## blockers

None for asset production. Source downloads, generation, file writes and prompt metadata succeeded. Application composition, moving-state review and device measurements remain outside this asset-producer scope.

## assumptions

- Material texture scale was unspecified; 512-square shipping textures are the modest initial budget.
- Opposite edges were visually checked by repeat proof; these are albedo materials, not displacement/normal maps.
- Arena lettering prohibition applies to environmental props. Game/HUD/control labels remain semantic UI.
- Source references and generated source PNGs are for reproducibility. The renderer only loads shipping WebPs and font binaries.
- Assets are stored in this boxing repository and do not modify Signal Lock, controller firmware, gameplay code or the approved mocks.
