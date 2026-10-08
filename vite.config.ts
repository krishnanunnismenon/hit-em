import { defineConfig } from "vite";
import { motionProof } from "./tools/dev/motion-proof.ts";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), motionProof()],
  server: { port: 5174, strictPort: true },
});
