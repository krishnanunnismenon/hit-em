# Session 03 — Combat engine

## Prompt

Read PRODUCT.md, docs/ARCHITECTURE.md and shared/input.ts. Build the pure TypeScript combat engine before visual effects. Use a 60 Hz fixed simulation and deterministic controllable randomness for tests. Implement Jab/Cross/Hook/Uppercut, immediate stance selection, timed Defensive blocks/slips, four power levels with stamina and recovery costs, situational punch advantages, counter-earned stagger windows and earned temporary Super. Unready Super preserves the previous effective stance and reports why it did not activate. Automatic movement/spacing is the starting default; no separate locomotion input.

Clarify only material unset rules: what makes a perfect defence, legal stance changes during punch windup/recovery/stagger, whether held Defensive has a cost, low-stamina punch behavior, Super duration/benefits and minimum stagger interaction time. Recommend concrete tunable values but label them prototype defaults. Latch Attack/Power when a punch starts; later wheel changes prepare the next attack. Damage is decided by legal combat windows/range/guard, not animation callbacks. Provide keyboard/synthetic inputs while controller session 02 is pending. Emit presentation events with a stable contract.

## Acceptance

- All four attacks have a useful situation; maximum power is not universally optimal.
- Defence cannot be farmed by repeatedly spinning without an incoming attack.
- Stagger permits a realistic rotary follow-up; Super gains/restrictions are explicit.
- Identical input schedules produce equivalent results across render frame rates.
- Tests cover resource costs, counter timing, recovery, stale input, pause, Super and victory/loss.

## Handoff

State diagram, timing/balance table, command/event contract, deterministic scenarios and unresolved tuning decisions. No animation benchmark claims.
