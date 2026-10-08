# Session 02 — Controller and Power-button press

## Prompt

Work in the standalone boxing-game repository. Read PRODUCT.md, the approved session 01 design handoff, docs/ARCHITECTURE.md, shared/input.ts and hardware/README.md. Preserve working channels 2=Attack G15/G21, 1=Stance G16/G5, 0=Power G22/G19; reverse raw direction once on the laptop. Identify and document the Power encoder's two switch terminals and an unused ESP32 GPIO before giving the user a step-by-step connection guide. Button wiring is not yet confirmed. Implement pull-up/debounce and one press event per deliberate press, retaining the v1 rotation and ARM/STOP protocol so Signal Lock can continue using the controller. Keep baseline files unchanged; place button-capable firmware in a separate active sketch and expose build/upload tasks. Compile before asking the user to physically connect/test. Do not flash automatically or stop another game's bridge.

Build a local-only authenticated WebSocket relay on 3110 with fresh session epochs, monotonic sequences, duplicate/stale-input rejection, reconnect state, bounded message framing and no queued-input replay. Power press becomes semantic punch. Keep keyboard/pointer input independent of serial transport. Expose VS Code tasks and teach the test steps. Relay should report unready/disconnected state rather than claim a physical button is working.

## Acceptance

- Installed direction and physical order remain correct.
- Held press/contact bounce generates one punch; release permits another.
- Unplug/reconnect and pause invalidate old queued turns/presses.
- Port ownership errors are actionable; only one bridge owns the ESP32.
- Firmware compiles; simulated serial integration passes. Physical press is confirmed by user before marking hardware complete.

## Handoff

Record exact GPIO/terminal wiring, protocol examples, task names, compiled version, automated test output and physical-test status. Include backward-compatibility evidence for Signal Lock rotation.


Current selected switch GPIO: **G4 / GPIO4**, requested by the user on 2026-10-05 when resuming controller setup. It replaces the earlier unused G18 proposal. Either small Power-switch terminal goes to G4; the other goes to shared GND. Rotation channels are unchanged.
