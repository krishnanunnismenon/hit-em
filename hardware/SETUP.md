# Power press and local USB setup

The user has resumed physical controller setup and selected free G4 for the Power push switch. This guide prepares that connection. **G4 firmware has compiled. The user reports the three wheels and G4 Power press working after setup.** The ESP32 was detected at `/dev/cu.usbserial-0001`. No upload was performed by Codex; physical timing/disconnect recovery were not measured.

## 1. Wire the Power switch with USB unplugged

Find the encoder whose rotation wires are **yellow G22 and orange G19**. This is Power after the installed position correction. Keep its existing three rotation connections.

On this EC11-style encoder, the side with **two small electrical terminals** is the push switch. The opposite side has the three rotation terminals. The two large metal tabs belong to the housing and are not the switch. The exact part number is unconfirmed; this identification is inferred from the supplied five-terminal encoder photos and the usual EC11 layout. If the shaft does not click inward or the switch terminals are broken, stop at keyboard/pointer play and have your friend check the switch.

| Power encoder connection | ESP32 connection |
| --- | --- |
| Either one of its two small switch terminals | G4 / GPIO4 |
| The other small switch terminal | GND, shared with the red encoder commons |
| Existing yellow rotation lead | G22 — keep it |
| Existing orange rotation lead | G19 — keep it |

The switch has no polarity. Use stable soldered leads or a soldered header for the two switch connections; earlier loose female jumpers were unreliable. Do not force a connector onto a broad housing tab. No 3V3 or 5V lead goes to this switch: the firmware enables the GPIO's internal pull-up, and pressing connects it to ground.

GPIO4 is unused by the confirmed wheel map and supports digital input with pull-up on this classic ESP32. Reference: [Espressif ESP32 pin table](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/gpio.html), [Espressif Arduino GPIO API](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/gpio.html), [Alps EC11 encoder catalogue](https://tech.alpsalpine.com/assets/catalog/product-catalog-ec-all.en.pdf). The catalogue is a layout reference, not proof of this unnamed encoder's model.

## 2. Build and upload deliberately in VS Code

1. Open the **boxing-game** folder, not Signal Lock.
2. Connect the ESP32 with the USB data cable.
3. Run Terminal → Run Task → **Boxing: Find controller port**. Use the ESP32 CP2102 `/dev/cu.*` port.
4. Stop your Signal Lock bridge or serial monitor yourself. One process can own this USB port.
5. Run **Boxing: Build boxing firmware**. The active sketch is `hardware/active/boxing-controller`; `hardware/baseline` stays unchanged.
6. Only when ready to replace the installed firmware, run **Boxing: Upload boxing firmware** and enter that port. This task compiles again before uploading.
7. Run **Boxing: Monitor controller**. Turn each wheel, then press and release Power. Expect named turn messages and `{"type":"punch"}` once per deliberate press. A held button must not repeat.
8. Stop that monitor before starting the relay.

The active sketch retains the v1 rotation/ARM/STOP protocol and applies no additional inversion. Signal Lock ignores the additional press message; its existing rotation map stays compatible. Software compatibility is tested; a physical run in both games still needs your confirmation.

## 3. Connect to the game

1. Run **Boxing: Run project** and open `http://localhost:5174/`.
2. Run **Boxing: Controller relay**, choosing the same serial port. It binds only `127.0.0.1:3110`.
3. In the game, open Your corner → **Connect controller**. Wait for the firmware connection status.
4. Choose Done, enter the ring and turn each wheel. Press Power to punch.
5. Unplug USB during a bout: play should pause. Reconnect, wait for connection, then deliberately resume. Release Power before pressing again. No old turns/presses should replay.
6. Try pause/resume and changing to the next rival. Inputs from the previous session should be rejected.

If the relay says the port is busy, close the other bridge/monitor. If it says Port3110 is occupied, stop the earlier boxing relay. Do not change the working rotation wiring to fix a software connection error.

## Without a controller

Use Space/pointer to punch, A/D for Attack, J/L for Stance and arrow keys for Power. For transport rehearsal, run **Boxing: Simulated controller relay**. Settings explicitly labels that session as simulated. It does not confirm an ESP32 connection. The corner pauses active fights, so the simulation buttons demonstrate setup turns; close the corner to resume gameplay.

## Compiled evidence

ESP32 core 3.3.12, generic ESP32 board, 115200 upload. Active sketch compiled using 273,736 bytes program / 22,292 bytes static RAM. Native C++ debounce checks pass for bounce, hold, release, rearm and millisecond rollover. Authenticated simulated transport passed origin rejection, turns/press, pause suppression and fresh resume epoch. The user subsequently confirmed physical play working. USB latency, unplug/reconnect recovery and a physical compatibility run back in Signal Lock remain unmeasured.
