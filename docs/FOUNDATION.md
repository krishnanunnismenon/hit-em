# Session 00 — foundation handoff

Completed 2026-10-04.

## Delivered

- Independent local Git repository on `main`, no remote configured; initial files are uncommitted for review.
- React/TypeScript/Vite/pnpm setup with exact dependency versions and its own pnpm lockfile/store.
- Development port 5174 and preview port 4174; planned relay port 3110.
- Agreed product/design/architecture briefs and five ordered build-session prompts.
- Copied rotation firmware/decoder baseline with source hashes; no source-project edits.
- Standalone serial list/monitor, corrected wheel mapping and bounded v1 parser.
- VS Code run/build/test/controller/firmware-status tasks.

## Verification

- `pnpm install`: dependencies installed; only serialport native setup and esbuild setup scripts approved in pnpm-workspace.yaml.
- `pnpm test`: 3 tests passed, covering bounded framing, corrected physical mapping/direction and malformed input rejection.
- `pnpm build`: TypeScript and production Vite bundle passed.
- `pnpm format:check`: passed.
- Temporary development startup on 5174: HTML and transformed React entry returned HTTP 200; the test server was stopped afterward.
- `pnpm controller:list`: serial native driver loaded and devices enumerated. The ESP32 was not attached during this check; no physical input test was performed in this repository.
- `pnpm firmware:status`: Arduino ESP32 core 3.3.12 present. No compile/upload was needed for byte-identical baseline copying.
- Copied firmware/decoder compared byte-for-byte with Signal Lock; source worktree status retained its pre-existing changes.

## Next session

The user changed the build order on 2026-10-04: begin with docs/sessions/01-design.md, then docs/sessions/02-controller.md. Settle fighter style, ring atmosphere, composition and motion through concept frames or a browser design prototype. The current React page is a foundation placeholder. Hardware/button work comes after visual direction is approved.
