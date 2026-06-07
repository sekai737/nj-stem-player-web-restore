import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const DEV_HINT_NAME = ".electron-library-path";

function stemContentType(filePath: string): string {
  if (filePath.endsWith(".flac")) return "audio/flac";
  if (filePath.endsWith(".wav")) return "audio/wav";
  if (filePath.endsWith(".mp3")) return "audio/mpeg";
  if (filePath.endsWith(".mid") || filePath.endsWith(".midi")) return "audio/midi";
  return "application/octet-stream";
}

/** Dev-only: serve `/stems/*` from the Electron library folder when `.electron-library-path` exists. */
export function electronLibraryStemsPlugin(): Plugin {
  return {
    name: "electron-library-stems",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.startsWith("/stems/")) {
          next();
          return;
        }

        const hintPath = path.join(process.cwd(), DEV_HINT_NAME);
        if (!fs.existsSync(hintPath)) {
          next();
          return;
        }

        const libraryRoot = fs.readFileSync(hintPath, "utf8").trim();
        if (!libraryRoot) {
          next();
          return;
        }

        const rel = decodeURIComponent(url.slice(1));
        const filePath = path.join(libraryRoot, rel);
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          next();
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", stemContentType(filePath));
        res.setHeader("Accept-Ranges", "bytes");
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}
