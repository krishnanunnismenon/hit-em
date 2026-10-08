import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { SerialPort } from "serialport";
import { WebSocketServer, WebSocket } from "ws";
import { KnobLines, parseKnobLine } from "./controller-protocol";
import { RelaySession, validOrigin } from "./relay-session";
const { values } = parseArgs({
  options: { port: { type: "string" }, simulate: { type: "boolean" } },
});
if (!values.simulate && !values.port)
  throw Error(
    "Pass --port with the ESP32 path, or --simulate for a controller test without hardware.",
  );
const sessions = new Map<string, number>(),
  gate = new RelaySession();
let client: WebSocket | null = null,
  serial: SerialPort | null = null,
  connected = !!values.simulate,
  wanted = false,
  stopping = false,
  retry: ReturnType<typeof setTimeout> | null = null;
const send = (data: unknown) => {
  if (client?.readyState === WebSocket.OPEN) client.send(JSON.stringify(data));
};
const write = (data: string) => {
  if (serial?.isOpen) serial.write(data);
};
const status = (message = connected ? "connected" : "waiting for USB") =>
  send({
    type: "status",
    connected,
    message,
    epoch: gate.epoch,
    simulated: !!values.simulate,
  });
const arm = () => {
  write(gate.arm(wanted && connected));
  status();
};
const server = createServer((req, res) => {
  if (!validOrigin(req.headers.origin)) {
    res.writeHead(403);
    res.end();
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin!);
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" || req.url !== "/session") {
    res.writeHead(404);
    res.end();
    return;
  }
  for (const [key, time] of sessions)
    if (time < Date.now()) sessions.delete(key);
  if (sessions.size >= 8) {
    res.writeHead(429);
    res.end();
    return;
  }
  const token = randomBytes(24).toString("hex");
  sessions.set(token, Date.now() + 10000);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ token }));
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 512 });
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:3110"),
    token = url.searchParams.get("token") ?? "";
  if (
    !validOrigin(req.headers.origin) ||
    url.pathname !== "/controller" ||
    (sessions.get(token) ?? 0) < Date.now()
  ) {
    socket.destroy();
    return;
  }
  sessions.delete(token);
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws));
});
wss.on("connection", (ws) => {
  client?.close(1000, "New controller session");
  client = ws;
  wanted = false;
  arm();
  ws.on("message", (bytes) => {
    try {
      const message = JSON.parse(bytes.toString());
      if (message.type === "arm" && typeof message.enabled === "boolean") {
        wanted = message.enabled;
        arm();
      }
      if (values.simulate && message.type === "simulate" && wanted) {
        const input = message.input;
        if (!(
          input?.type === "punch" ||
          (input?.type === "turn" &&
            ["attack", "stance", "power"].includes(input.wheel) &&
            [-1, 1].includes(input.delta))
        ))
          return;
        send({
          type: "input",
          epoch: gate.epoch,
          seq: ++gate.sequence,
          at: Date.now(),
          input,
        });
      }
    } catch {
      /* Invalid client data cannot become an input. */
    }
  });
  ws.on("close", () => {
    if (client !== ws) return;
    client = null;
    wanted = false;
    write(gate.arm(false));
  });
  ws.on("error", () => ws.close());
});
function openSerial() {
  if (stopping || values.simulate) return;
  const port = new SerialPort({
      path: values.port!,
      baudRate: 115200,
      autoOpen: false,
    }),
    lines = new KnobLines();
  serial = port;
  let lost = false;
  const disconnect = (message: string) => {
    if (lost) return;
    lost = true;
    connected = false;
    gate.arm(false);
    status(message);
    if (!stopping) retry = setTimeout(openSerial, 2000);
  };
  port.on("data", (data: Buffer) => {
    for (const line of lines.push(data.toString("utf8"))) {
      if (parseKnobLine(line) === "ready") {
        connected = true;
        arm();
        continue;
      }
      const event = gate.receive(line);
      if (event) send(event);
    }
  });
  port.on("error", () =>
    disconnect(
      "USB unavailable — stop the other bridge or check the selected port",
    ),
  );
  port.on("close", () =>
    disconnect("USB disconnected — reconnect, then resume in your corner"),
  );
  port.open((error) => {
    if (error)
      disconnect("USB port busy or unavailable — close the other bridge first");
    else {
      write("STOP\n");
      status("USB open — waiting for firmware");
    }
  });
}
const stop = () => {
  stopping = true;
  if (retry) clearTimeout(retry);
  write("STOP\n");
  if (serial?.isOpen) serial.close();
  client?.close();
  wss.close();
  server.close();
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
server.on("error", (error) => {
  console.error(
    (error as NodeJS.ErrnoException).code === "EADDRINUSE"
      ? "Port 3110 is occupied. Stop the existing boxing relay before starting another."
      : error.message,
  );
  stop();
  process.exitCode = 1;
});
server.listen(3110, "127.0.0.1", () => {
  console.log(
    `Boxing relay: 127.0.0.1:3110${values.simulate ? " · SIMULATION, no hardware" : ""}`,
  );
  openSerial();
});
