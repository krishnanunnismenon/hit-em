# Tactical scenarios — 2026-10-05

The user requested distinct boxing situations, effective stance choices and combinations that discourage repetitive play. This pass implements situational advantages in the existing prototype. Several choices remain viable; a protected lane or an out-of-range punch can still fail regardless of power. No character sculpt, firmware, hardware mapping or Signal Lock source changed.

## Boxing principles and prototype parameters

The [IBA coach manual](https://www.iba.sport/documents/iba-coach-manual/) describes straight punches as tools for distance control and attack preparation (printed p41), distance-dependent use of straights, hooks and uppercuts (p71), coordinated combinations (p69), and the timing of counters after defence (p56). Those principles inform the rules below. Numeric damage, guard coverage, reach, windows and probabilities are game tuning values, not experimentally measured boxing force or validated biomechanics.

Both prototype fighters are orthodox. Labels use the rival's anatomical side: their right glove protects the player's lead left Jab; their left protects the rear right Cross. This corrects the perspective ambiguity in the user's illustrative left-guard example. It does not require real boxing to have one universally correct response.

| Punch    | Favourable prototype situation                | Timing/position tradeoff                                                                                                       |
| -------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Jab      | Rival's right glove low, at long reach        | Power 1–2 can intercept a windup; heavier versions lose that fast-interception rule.                                           |
| Cross    | Rival's left glove low, medium distance       | Extra reward for catching recovery; cramped distance weakens straight punches.                                                 |
| Hook     | Tight central high guard, inside medium reach | Travels around the central protection; a wide guard covers its lane. Defensive check hooks reward an advancing rival's windup. |
| Uppercut | Wide gloves with an open chin, close range    | Can intercept a non-Jab windup inside 1.25 world units; tucked elbows or tight central coverage stop it.                       |

Defensive keeps its existing retreat and timed-parry window and gains a counter multiplier. Holding Defensive covers straight/uppercut lanes, while a Hook can get around it; a correctly timed defensive change can still parry a valid in-range incoming shot. Offensive retains pressure movement and improves close shots/recovery attacks. Neutral positions for the selected punch and restores stamina fastest: 17/s between attacks, compared with Defensive 14/s and Offensive/Super 12/s. Earned Super amplifies a valid attack without bypassing guard or reach.

## Contact assessment

`domain/tactics.ts` evaluates the selected punch using guard, actual root distance, opponent windup/recovery/stagger, movement intent, stance, power, recent completed attacks and the preceding landed line. The engine reevaluates these at contact. There is no extra random hit roll. An already out-of-reach press remains a miss; later movement can also cause a miss. Misses and player blocks grant no damage, stun or Super.

Seven guard shapes carry explicit per-punch coverage: open, balanced, left-low, right-low, tight high, wide and tucked elbows. Coverage at or above 0.9 blocks a player lane. Lesser coverage changes its damage multiplier. Base damage is Jab 3, Cross 4.5, Hook 4 and Uppercut 4.75, multiplied by power and the combined situational factor, rounded to whole points. Combined nonzero multipliers are bounded at 0.55–1.8; overlapping bonuses can saturate that bound. These values are intentionally inspectable and tunable.

A different punch following a clean hit within 2.3 seconds earns a 1.12 combination multiplier for a chain shorter than three. Blocked/missed shots break the chain. Consecutive repeats after two completed identical attacks get a 0.72 surprise multiplier. A new opening never overrides the range/coverage checks.

The rival's seeded weighted decisions continue to use distance, stamina, health and stance. Guard weights additionally respond to completed player punches: repeated straights encourage central high coverage, repeated Hooks encourage wide gloves, and repeated Uppercuts encourage tucked elbows. Wheel selection alone does not teach the rival. Other guard choices retain nonzero weight, and retaining the current guard is discouraged. A planned change starts moving the visible gloves and announces its direction 0.32 seconds before coverage commits. Low stamina favours lowered gloves; low health favours a high guard. This is a small adaptive prototype, not a production opponent model or a guarantee that every fight is unique.

## Visible rules and controlled studies

The ink timing strip now names the selected punch's opening, protected lane or counter window and explains the reason. It still shows actual range. Impact lettering gives the resolved reason, such as `Chin open`, `Caught the recovery` or `Repeat anticipated`. Anatomical glove changes use the existing damped rig with fixed limb lengths. Essential guard posing remains enabled with reduced motion.

At `/?motionLab=1`, Opening study offers four punch openings, a held recovery-window rule study, a protected high guard, Free technique and Live spacing. Fixed studies hold roots and guard, use ordinary punch/stance/power selections, and preserve health. The recovery study holds the timing condition for comparison; it is not a recorded rival whiff. Live spacing returns to moving weighted decisions without rival attacks or damage. Normal `/` applies the same assessments to actual combat.

## Verification and evidence

- 79 tests pass, including distinct best punches in controlled openings, viable alternatives, guard laterality, counter/stance/power timing, combination expiry, repeat adaptation, contact reevaluation, and no reward for guarded/distant shots.
- A deterministic 5,376-case matrix covers seven guards, four opponent phases, three movement intents, four stances, four powers and four punches at stated controlled distances. It verifies finite bounded damage and that each punch wins some cases. It is a consistency experiment, not a statistical balance or engagement study.
- Actual player/rival GLBs pass all seven visible guard shapes: the correct glove lowers, wide/high guards separate, arms remain 0.5 + 0.5 and legs 0.43 + 0.43, a toe remains planted, and pause/reset retain their behavior. Existing reach, gait, impact, birds and six-fall tests remain green.
- TypeScript/Vite production build and formatting pass. App 346.66 KB / 115.55 KB gzip; lazy scene 690.78 KB / 178.01 KB gzip. Existing Vite chunk-size advisory remains.
- Desktop 1672×941 and narrow 390×844 layouts, protected lane, all four opening presets, reduced motion and live spacing were exercised through the native UI. Narrow document width equals scroll width at 390px. Normal combat's power-three Cross changed rival health 100→80 and Super 0→16; later central coverage showed `Cross guarded`. No browser console errors were observed.
- `tactics-motion.webm` is an actual 26-second canvas capture made with the in-app recorder. `tactics-motion.mp4` uses H.264/yuv420p with one-pixel right/bottom padding and unchanged timing: 1658×512, 25.968 seconds, 778 decoded frames. It includes fixed Jab/Cross/Hook/Uppercut studies. Protected-lane and live-spacing verification are documented by the UI checks rather than asserted for this clip. HUD and DOM impact words are outside the canvas capture and appear in screenshots. Capture throughput is not a game FPS measurement.

The capture manifest in `.impeccable/review/tactics-capture-manifest.json` binds source/model/evidence hashes. Earlier character-fidelity REBUILD verdicts remain unchanged. This pass adds no full mesh hit volumes or rigid-body contact solver; the existing initial latched presentation aim can differ from a coverage change at contact. Mobile hardware performance, input latency, sustained frame pacing, player-study engagement and long-run optimal-strategy balance remain unmeasured. Next balance work should compare success and stamina use across seeded fights and human playtests, rather than equating permutation count with replayability.
