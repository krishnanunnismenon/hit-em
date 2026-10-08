# Design and functionality review — 2026-10-05

The software campaign is ready for personal review. Hardware is explicitly deferred. Open http://localhost:5174/; practice is available at http://localhost:5174/?practice=1. The verification run has been restarted through the game UI, leaving Pip's entry ready for a fresh playthrough.

## What changed

- Pure 60 Hz combat now commits a punch line at press and sweeps its active tip through fitted head and guard volumes. Moving away or slipping that line can miss; protective gloves/forearms can intercept. Covered or missed lanes grant no health damage, Super or stun.
- Pip probes and moves; Bram pressures with heavy punches; Juno feints and counters. Seeded decisions consider range, stance, stamina and recent attacks. Feints cannot damage or farm defence rewards; follow-ups and stun renewal are bounded.
- Four attacks, four power levels, three ordinary stances and earned Super retain distinct footwork and recovery. Practice exposes opening studies, three footwork styles, hit reactions/stunned birds and six falls without damage.
- Longer square trunks and more planar sculpture refine the figures. Bram and Juno have distinct hair and equipment; their bodies share the authored base. Only the player and current rival are loaded, and old scene resources are released at transitions.
- Campaign entries, tactical hints, results, next-bout transitions, retries, complete ending and new-run restart are implemented. Versioned local storage saves cleared bouts and settings; active fights are not restored. Procedural impact audio varies by punch and power.

## Verification

99 tests pass, covering combat/contact, tactics, timing, footwork, reactions, falls, models, campaign persistence and prepared input transport. TypeScript and Vite production builds pass. Formatting passes. The production scene remains split from the main application; Vite's advisory about the Three.js chunk exceeding 500 kB remains.

The browser was driven through visible keyboard/pointer controls, without modifying engine state through hidden page scripts:

| Path | Observed result |
| --- | --- |
| Pip loss/retry/victory | Loss screen and retry worked; victory at 82 health with 15/47 landed. |
| Reload after Pip | Bram was the next uncleared rival, with 180 health. |
| Bram victory/next rival | Victory at 69 health with 17/60 landed; transition loaded Juno with 200 health. |
| Juno rushed losses | Feints and poor timing punished rushed attacks; retry preserved the earlier wins. |
| Juno deliberate retry | Waiting through incoming punches, reading current guard/range and using lighter recovery counters won at 96 health, 17/22 landed and 77% accuracy. |
| Campaign ending | “All three. All yours.” appeared after the final fall. |
| Reload completed campaign | “The basement is yours.” and all three Won states persisted. |
| Start a new run | Reset through the visible control returned to Pip, with the roster Next/Later/Later. |
| Practice | Opening, footwork and stun previews worked; a real rendered motion clip was recorded. |
| Responsive/reduced motion | 390×844 browser viewport had no horizontal overflow; reduced-motion controls and gentler effects checked. This is not a phone hardware benchmark. |

### Measured browser performance

Final Juno scene in this laptop's in-app browser, at a 1672×941 viewport override: 100 fps, p95 frame interval 10.6 ms, 300 draw calls and 325,385 triangles. The retained window contained 7,200 active frames over 72 seconds, excluding paused/hidden intervals. Browser-command-to-first-render-submission p95 was 8.9 ms across the most recent 120 commands. This does not measure USB delivery, physical knob response, GPU completion or display latency. Results depend on device/browser and are not a phone performance guarantee.

### Balance experiments

The recorded campaign experiment used 16 seeds × 3 rivals × 4 synthetic policies, with decisions every 700 ms and a 240-second limit. The tactical current-state policy won all 48 runs (median bout times 40–47 seconds). Mixed attacks won 46/48; heavy Jab spam lost every Bram run and most Juno runs; held defence timed out every run. These automated policies know current state and do not establish human difficulty, campaign duration or long-term variety. Baseline, tuned and campaign JSON are retained in `.impeccable/review/balance-*.json`. Heavy stun cooldown reduced continuous stun occupancy materially. The user's 6–10 minute campaign target still needs human playtesting.

## Review evidence

Screenshots and motion are stored in `.impeccable/review/`:

- `completion-review-ready.jpg` (final handoff), `completion-entry.jpg`, `completion-mobile.jpg`, `completion-reduced.jpg`
- `completion-loss.jpg`, `completion-pip-victory.jpg`, `completion-bram-fight.jpg`
- `completion-juno-entry.jpg`, `completion-juno-fight.jpg`
- `completion-campaign-ending.jpg`, `completion-saved-ending.jpg`
- `completion-performance-final.jpg`, `completion-stun.jpg`
- `completion-footwork.webm` (actual 26-second capture) and `completion-footwork.mp4` (8.996-second extract, 271 frames, 1658×512)

The result/pause overlay toolbar layering was corrected, and pointer access to settings was verified after pausing. The final handoff uses the normal browser viewport and the “solo campaign” title.

The machine-readable manifest records checks and model hashes. Historical modelling review verdicts are preserved. No new independent approval of exact reference fidelity is claimed.

## Limits and deferred work

The contact model uses fitted analytical volumes driven by technique goals. It does not collide the full rendered mesh or perfectly reproduce the visible spring/recoil pose; this is an authored physics-inspired game rather than measured professional biomechanics. The figures are reconstructed assets, not an exact conversion of the generated reference image. Their likeness, opponent personalities, readability and human pacing are now personal review items.

Before the user's latest deferral, separate Power-switch firmware and a local relay were prepared. The firmware compiled; host debounce tests and simulated transport/browser inputs passed. None of those checks verifies the physical switch, serial delivery or correct USB/display latency. No firmware was uploaded, no real serial connection was opened, and Signal Lock's running bridge was not stopped. All further controller work waits until after personal design review. There is no deployment or remote repository.
