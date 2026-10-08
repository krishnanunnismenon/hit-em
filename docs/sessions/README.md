# Build sessions

Updated on 2026-10-04 at the user's request: focus on visual design first, then controller connection. Each prompt is a self-contained work packet for boxing-game; no new Codex tasks are automatically created. Work in dependency order and pass evidence to the next session.

| Session | Outcome | Prerequisite |
| --- | --- | --- |
| 00 — Foundation | Independent repo, tools, briefs and controller baseline | Complete |
| 01 — Design | Approved fighters, arena, screen composition and motion direction | 00; no hardware required |
| 01b — Motion study | Keyboard/pointer animation prototype and measured motion quality | Accepted 01 frames; no hardware required |
| 02 — Controller | Power-button press and tested local input relay | 01 |
| 03 — Combat | Headless combat rules with deterministic tests | 01; keyboard/synthetic inputs can precede 02 |
| 04 — Opponent | One readable, forgiving opponent and complete fight flow | 03 |
| 05 — Visual slice | Implement approved art/motion with combat, sound and controller | 01–04 |
| 06 — Campaign and validation | Agreed progression, persistence and measured performance | 05 and a scope decision |

The shown design treatment is accepted with revisions. Continue design with `01-motion-study.md` before controller connection; remaining noncombat screens can follow that study. After each session record implemented behavior, evidence, remaining limitations and the next prerequisite. Proposed features in a brief are not shipped features.
