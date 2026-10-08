# Ordered completion — 2026-10-05

The user authorized the roadmap, selected three playful underground rivals and a 6–10 minute campaign target, then explicitly deferred hardware until after their personal design review. Design and software functionality are ready for that review.

| Order | Milestone | Current outcome |
| --- | --- | --- |
| 1 | Contact accuracy | Implemented and tested: committed swept paths, fitted head/guard proxies, interception and evasion. A physics-inspired proxy model, not a full mesh/rigid-body simulation. |
| 2 | Opponent behaviour | Implemented: three seeded profiles with range-aware choices, readable attacks, capped follow-ups, stamina and harmless feints. |
| 3 | Balance | Tested across 192 seeded campaign simulations, with three policies that attack and a held-defence control. Reduced heavy-stun chaining. Human pacing and long-term engagement remain playtest targets. |
| 4 | Presentation | Revised sculptures/trunks, distinct rival hair/equipment, original impact audio, campaign entry/result screens and production practice. Exact concept-model fidelity remains the user's review item; no new independent fidelity approval is claimed. |
| 5 | Controller | Deferred by user until after personal design review. Software was prepared and simulated; no physical connection, wiring verification or firmware upload was performed. |
| 6 | First-fight validation | Keyboard/pointer win, loss and retry verified. Sustained laptop rendering/input sampled; narrow viewport and reduced motion checked. Phone hardware remains untested. |
| 7 | Three-rival campaign | Pip, Bram and Juno implemented with distinct fighting profiles and equipment. All three browser victory paths, loss/retry and transitions verified. |
| 8 | Progression/final checks | Versioned local settings/progress validated; next-bout reload, completed-campaign reload and new-run restart exercised. 99 tests pass; TypeScript/production build and formatting checked. |

Review the game at http://localhost:5174/ and practice at http://localhost:5174/?practice=1. Hardware is the next milestone only after the user's personal review. Hosting and remote repository creation are outside the request.

See [completion evidence](COMPLETION-EVIDENCE.md) for evidence, methods and practical limits. Historical character reviews remain preserved; implementation progress does not erase their earlier unresolved fidelity findings.


## Controller setup resumed

The user resumed the controller milestone on 2026-10-05 and selected G4 for Power press. The active sketch, game instructions and setup guide now use GPIO4. Firmware compiled successfully (273,736 bytes program / 22,292 bytes static RAM); native debounce tests and the app build passed. Wiring, upload and physical input tests remain pending. No upload or real serial opening was performed. The earlier deferral remains historical rather than the current task status.
