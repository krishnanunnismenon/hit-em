# Ring Sense difficulty

Standard is the existing campaign. Ring Sense · Hard is a selectable tactical rival variant. Choose it on the entry screen before entering the ring, or reset a bout before changing it in Your corner. It applies to all three existing rival personalities. Standard and Hard retain independent progress; settings remember the chosen mode. Practice stays isolated and uses Standard rules.

## Behaviour

| Parameter | Standard | Ring Sense |
| --- | --- | --- |
| Awareness sample delay | Existing profile rules | 0.24 combat seconds; sampling can add up to another 0.24 |
| Habit guard response | Existing recent-line weighting | Delayed completed history, stronger protective guard preference |
| Heavy windup response | Existing spacing weights | Stronger retreat preference, earlier counter decision |
| Profile rest multiplier | 1 | 0.55; existing jitter retained |
| Profile windup multiplier | 1 | 0.82, with 0.48-second minimum before power increment |
| Feint chance | Profile value | Profile × 1.35 + 0.06, capped at 0.45 |
| Follow-up chance | Profile value | Profile × 1.5, capped at 0.45 |
| Normal spacing decision interval | 1.25–2.30 seconds | 0.95–2.00 seconds |

The rival learns only completed punches and reacts to accepted visible punches. It cannot read a newly selected, unthrown Attack/Power wheel value. Guard changes still announce themselves 0.32 seconds before activation. Heavy-shot counters preserve the rival's current recovery plus a 0.35-second gap and then their own visible windup. Costs, health, base damage rules, reach, root speeds and maximum combo lengths are unchanged. Reactions and memory use combat time, freeze with pause/hit-stop/knockout, and clear on reset/retry. No controller wiring or firmware change is required.

## Verification and limits

- 106 regression tests pass, including awareness privacy/delay, frozen clocks, guard learning, heavy retreat, recovery and long seeded runs.
- TypeScript and production build pass. The existing large Three.js scene chunk warning remains.
- 192 synthetic campaign runs per difficulty: 16 seeds × 3 rivals × 4 policies, 700ms decision interval, 240-second cutoff.
- The mixed cycling policy won 46/48 Standard runs and 40/48 Ring Sense runs. A current-state tactical policy still won all 48 in both modes. Heavy-Jab won 16/48 Standard and 18/48 Hard: pressure changes do not make every seed/policy harder.
- These are automated engine policies with precise state access, not human or ESP32 playtests. Human difficulty, fun and 6–10 minute campaign pacing remain tuning targets.
- Browser verification: selection persisted on reload; an active/paused bout disabled both choices; a heavy-punch bout ran and took damage under normal combat rules. Desktop 1440×1000 and mobile 390×844 with reduced motion showed the selector and complete roster without horizontal overflow. Selector buttons are at least 44px high. Temporary motion/viewport overrides were restored; Hard is left ready for review.

Evidence: `.impeccable/review/balance-standard-difficulty.json`, `balance-ring-sense.json`, `ring-sense-manifest.json`, and desktop/mobile screenshots.
