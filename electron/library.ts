import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

const CONFIG_NAME = "library-config.json";
const DEV_HINT_NAME = ".electron-library-path";

export interface LibraryConfig {
  libraryRoot: string;
}

function configPath(): string {
  return path.join(app.getPath("userData"), CONFIG_NAME);
}

function devHintPath(): string {
  return path.join(process.cwd(), DEV_HINT_NAME);
}

function writeDevHint(libraryRoot: string | null): void {
  const hint = devHintPath();
  if (!app.isPackaged) {
    if (libraryRoot) {
      fs.writeFileSync(hint, `${libraryRoot}\n`, "utf8");
    } else if (fs.existsSync(hint)) {
      fs.unlinkSync(hint);
    }
  }
}

export function readLibraryRoot(): string | null {
  try {
    const raw = fs.readFileSync(configPath(), "utf8");
    const parsed = JSON.parse(raw) as LibraryConfig;
    if (parsed.libraryRoot && fs.existsSync(parsed.libraryRoot)) {
      return parsed.libraryRoot;
    }
  } catch {
    /* no saved config */
  }
  return null;
}

export function normalizeLibraryRoot(selectedPath: string): string | null {
  if (fs.existsSync(path.join(selectedPath, "stems"))) {
    return selectedPath;
  }
  if (path.basename(selectedPath).toLowerCase() === "stems") {
    return path.dirname(selectedPath);
  }
  return null;
}

export function setLibraryRoot(libraryRoot: string): void {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), `${JSON.stringify({ libraryRoot }, null, 2)}\n`, "utf8");
  writeDevHint(libraryRoot);
}

export function resolveStemFile(libraryRoot: string, pathname: string): string | null {
  const rel = decodeURIComponent(pathname.replace(/^\/+/, ""));
  if (!rel.startsWith("stems/")) return null;

  const filePath = path.join(libraryRoot, rel);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return null;
  }
  return filePath;
}

export function ensureDefaultLibrary(): string | null {
  const existing = readLibraryRoot();
  if (existing) {
    writeDevHint(existing);
    return existing;
  }

  const candidates = app.isPackaged
    ? [
        path.join(path.dirname(process.execPath), "library"),
        path.join(app.getPath("userData"), "library"),
      ]
    : [path.join(process.cwd(), "public")];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "stems"))) {
      setLibraryRoot(candidate);
      return candidate;
    }
  }

  return null;
}

export function clearDevHint(): void {
  writeDevHint(null);
}
