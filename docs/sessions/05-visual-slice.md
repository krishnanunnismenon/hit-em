# Session 05 — Cinematic toy/comic vertical slice

## Prompt

Read PRODUCT.md, docs/DESIGN-BRIEF.md, docs/ARCHITECTURE.md and sessions 01/03/04 handoffs. Also read docs/design/MOTION-CONTRACT.md and the 01b motion-study handoff. Preserve the text-free environment, approximately half-density crowd and animation-first priority. Use Impeccable to implement the direction approved in design session 01. Preserve its selected fighter style, arena, screen composition and motion grammar; do not restart visual discovery. Build original chunky articulated toy fighters in a compact theatrical ring. Use a behind-and-above player camera that keeps both fighters and the opponent's tells visible. Character silhouettes, oversized gloves, bevelled plastic parts, expressive faces and purposeful stage lighting should carry identity.

Render with direct Three.js. Use joint poses or animation clips keyed to combat events, with distinct silhouettes/trajectories for all four punches. Add anticipation, contact pose, controlled impact pause, recoil/recovery, sound layers and brief cinematic framing. Use GSAP for presentation and CSS/SVG for bold comic words that correspond to actual hits, blocks, counters, whiffs and Super. Keep health/stamina/Super and selected Attack/Stance/Power readable. Avoid camera cuts that hide incoming threats.

Provide start, fight, pause, Super unavailable/ready, stagger, victory/loss, retry and disconnected states. Reduced-motion removes shake/large motion while retaining useful feedback. First user interaction unlocks audio. Adapt keyboard/pointer controls for development and responsive play. Pool effects, share resources and measure on the laptop.

## Acceptance

- One complete fight has finished visuals and sound, not a decorative non-playable mockup.
- Every punch reads differently; impact weight scales with power while timing stays predictable.
- Comic overlays leave tells and essential UI visible.
- Real controller and fallback inputs affect the same combat.
- Performance, input latency and reduced-motion are tested and reported accurately.

## Handoff

Approved visual direction, source/asset provenance, captures, performance evidence, gameplay confirmation and limits before campaign expansion.
