import type { Plugin } from "vite";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Local, development-only opt-in ring capture. Fixed filenames; no arbitrary file/path API. */
export function motionProof(): Plugin {
  return {
    name: "local-motion-proof",
    apply: "serve",
    configureServer(server) {
      const folder = resolve(server.config.root, ".impeccable/review");
      server.middlewares.use(async (req, res, next) => {
        const route = req.url?.split("?")[0];
        if (!route?.startsWith("/__motion-proof")) return next();
        const host = req.headers.host;
        if (!["localhost:5174", "127.0.0.1:5174"].includes(host ?? "")) {
          res.statusCode = 403;
          res.end();
          return;
        }
        try {
          if (req.method === "POST" && route === "/__motion-proof") {
            if (req.headers.origin !== `http://${host}`) {
              res.statusCode = 403;
              res.end();
              return;
            }
            const type = req.headers["content-type"]?.split(";")[0];
            if (type !== "video/webm" && type !== "video/mp4") {
              res.statusCode = 415;
              res.end();
              return;
            }
            const chunks: Buffer[] = [];
            let size = 0;
            for await (const chunk of req) {
              const bytes = Buffer.from(chunk);
              size += bytes.length;
              if (size > 32 * 1024 * 1024) {
                res.statusCode = 413;
                res.end();
                return;
              }
              chunks.push(bytes);
            }
            if (!size) {
              res.statusCode = 400;
              res.end();
              return;
            }
            const extension = type === "video/mp4" ? "mp4" : "webm";
            await mkdir(folder, { recursive: true });
            await writeFile(
              resolve(folder, `technique-motion.${extension}`),
              Buffer.concat(chunks),
            );
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                url: `/__motion-proof.${extension}`,
                bytes: size,
              }),
            );
          } else if (
            req.method === "GET" &&
            ["/__motion-proof.webm", "/__motion-proof.mp4"].includes(route)
          ) {
            const extension = route.endsWith("mp4") ? "mp4" : "webm";
            const bytes = await readFile(
              resolve(folder, `technique-motion.${extension}`),
            );
            res.setHeader("Content-Type", `video/${extension}`);
            res.setHeader("Cache-Control", "no-store");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="boxing-techniques.${extension}"`,
            );
            res.end(bytes);
          } else {
            res.statusCode = 404;
            res.end();
          }
        } catch {
          res.statusCode = 500;
          res.end("Motion capture could not be saved.");
        }
      });
    },
  };
}
