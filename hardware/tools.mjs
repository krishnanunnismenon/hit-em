import { spawnSync } from "node:child_process";
import { statfsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = resolve(root, "hardware/arduino-cli.yaml");
const sketch = resolve(root, "hardware/active/boxing-controller");
const output = resolve(root, ".hardware-build");
const board = "esp32:esp32:esp32:UploadSpeed=115200,PSRAM=disabled";
const core = "esp32:esp32@3.3.12";
const bundledCLI =
  "/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli";

function availableGiB(path) {
  const disk = statfsSync(path);
  return (disk.bavail * disk.bsize) / 1024 ** 3;
}

function requireSpace(minimum) {
  const free = Math.min(availableGiB(homedir()), availableGiB(root));
  if (free < minimum)
    throw Error(
      `Only ${free.toFixed(2)} GiB free. Free at least ${minimum} GiB before continuing. This is a working-space allowance, not an exact package size. No files were deleted.`,
    );
}

function findCLI() {
  const candidates = process.env.ARDUINO_CLI
    ? [process.env.ARDUINO_CLI]
    : ["arduino-cli", ...(process.platform === "darwin" ? [bundledCLI] : [])];
  for (const path of candidates) {
    const result = spawnSync(path, ["version"], { encoding: "utf8" });
    if (!result.error && result.status === 0) return path;
  }
  throw Error(
    "Arduino CLI was not found. Install arduino-cli, or set ARDUINO_CLI to its executable path. The installed macOS Arduino app's CLI is also supported; its window can stay closed.",
  );
}

try {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { port: { type: "string" } },
  });
  const action = positionals[0];
  if (positionals.length !== 1 || !["status", "build", "upload"].includes(action))
    throw Error(
      "Use pnpm firmware:status, firmware:build or firmware:upload --port /dev/cu.usbserial-0001. Upload is always an explicit user-run step.",
    );

  const cli = findCLI();
  const run = (args) => {
    const result = spawnSync(cli, [...args, "--config-file", config], {
      cwd: root,
      stdio: "inherit",
    });
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw Error(
        "The Arduino command did not finish successfully. See the error above; no later step was run.",
      );
  };
  if (action === "status") {
    console.log(
      `Arduino CLI: ${cli}\nFree space: ${availableGiB(homedir()).toFixed(2)} GiB\nExpected core: ${core}`,
    );
    run(["core", "list"]);
  } else if (action === "upload") {
    if (!values.port?.startsWith("/dev/")) throw Error("Pass --port with the ESP32 serial path. Stop your other bridge first.");
    requireSpace(1);
    run(["compile", "--fqbn", board, "--output-dir", output, sketch]);
    run(["upload", "--fqbn", board, "--port", values.port, "--input-dir", output, sketch]);
  } else {
    requireSpace(1);
    run(["compile", "--fqbn", board, "--output-dir", output, sketch]);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
