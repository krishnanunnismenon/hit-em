# Boxing game working instructions

- Work only in this repository. Signal Lock is an independent working sibling project; do not edit it as a side effect.
- Read PRODUCT.md, docs/ARCHITECTURE.md and the relevant docs/sessions prompt before implementing a milestone. Planned behavior is not shipped behavior.
- Use pnpm 11.3.0. Development page is 5174; future input relay is 3110.
- Keep the confirmed wheel pin order and direction correction in shared/input.ts/server/controller-protocol.ts. Do not apply a second inversion in firmware.
- Keep hardware/baseline immutable and record provenance for copied assets/code. Build active firmware before upload; do not flash or stop an existing serial process automatically.
- Combat decisions belong to a pure fixed-step TypeScript engine. Rendering/audio consume its events; animation callbacks must not determine damage.
- Keep rapid transforms outside React state. Share Three.js resources and pool transient effects. Performance targets require measurement.
- User asked for staged clarification and detailed build sessions. Ask focused questions for unresolved rules; preserve settled choices.
- Run meaningful tests and pnpm build for implementation changes. Verify visuals on the shipped device classes and include reduced-motion behavior.
