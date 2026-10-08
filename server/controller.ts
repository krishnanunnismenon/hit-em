import { parseArgs } from "node:util";
import { SerialPort } from "serialport";
import { KnobLines, mapTurn, parseKnobLine } from "./controller-protocol.js";

const { values } = parseArgs({
  options: {
    list: { type: "boolean" },
    monitor: { type: "boolean" },
    port: { type: "string" },
  },
});

if (values.list) {
  const ports = await SerialPort.list();
  for (const port of ports) {
    const path =
      process.platform === "darwin"
        ? port.path.replace(/^\/dev\/tty\./, "/dev/cu.")
        : port.path;
    console.log(`${path} ${port.manufacturer ?? ""}`);
  }
  if (!ports.length)
    console.log(
      "No serial devices found. Connect the ESP32 with a USB data cable.",
    );
} else if (values.monitor && values.port?.trim()) {
  const serial = new SerialPort({
    path: values.port,
    baudRate: 115200,
    autoOpen: false,
  });
  const lines = new KnobLines();
  let sequence = 0;
  let stopped = false;
  const arm = () => {
    if (serial.isOpen) serial.write("ARM monitor\nQUIET\n");
  };
  const timer = setInterval(arm, 1000);
  const stop = (message?: string) => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    if (serial.isOpen) serial.close();
    if (message) {
      console.error(message);
      process.exitCode = 1;
    }
  };
  serial.on("data", (buffer: Buffer) => {
    for (const line of lines.push(buffer.toString("utf8"))) {
      const message = parseKnobLine(line);
      if (message === "ready") {
        sequence = 0;
        arm();
      } else if (
        message?.type === "press" &&
        message.epoch === "monitor" &&
        message.seq > sequence
      ) {
        sequence = message.seq;
        console.log(JSON.stringify({ type: "punch" }));
      } else if (
        message?.type === "turn" &&
        message.epoch === "monitor" &&
        message.seq > sequence
      ) {
        sequence = message.seq;
        console.log(JSON.stringify(mapTurn(message)));
      }
    }
  });
  serial.on("error", () =>
    stop(
      "Cannot open the ESP32. Check the port and stop any other controller bridge.",
    ),
  );
  serial.on("close", () =>
    stop("USB disconnected. Reconnect and restart the monitor."),
  );
  process.once("SIGINT", () => stop());
  process.once("SIGTERM", () => stop());
  serial.open((error) => {
    if (error) {
      stop(
        "Cannot open the ESP32. Check the port and stop any other controller bridge.",
      );
      return;
    }
    console.log(
      "Controller monitor ready: turn a wheel. Power presses require the new boxing firmware.",
    );
    arm();
  });
} else {
  console.error(
    "Use pnpm controller:list, or pnpm controller:monitor --port /dev/cu.usbserial-0001",
  );
  process.exitCode = 1;
}
