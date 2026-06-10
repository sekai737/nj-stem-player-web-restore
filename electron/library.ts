import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { findInstalledStemsFolder } from "./stemsDistribution.js";

const CONFIG_NAME = "library-config.json";
const DEV_HINT_NAME = ".electron-library-path";

export interface LibraryConfig {
  libraryRoot?: string;
  stemsSearchPaths?: string[];
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

export function readLibraryConfig(): LibraryConfig | null {
  try {
    const raw = fs.readFileSync(configPath(), "utf8");
    return JSON.parse(raw) as LibraryConfig;
  } catch {
    return null;
  }
}

export function readLibraryRoot(): string | null {
  const parsed = readLibraryConfig();
  if (parsed?.libraryRoot && fs.existsSync(parsed.libraryRoot)) {
    return parsed.libraryRoot;
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

export function setLibraryConfig(config: LibraryConfig): void {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  writeDevHint(config.libraryRoot ?? null);
}

export function setLibraryRoot(libraryRoot: string, stemsSearchPaths?: string[]): void {
  const existing = readLibraryConfig();
  const paths = new Set(existing?.stemsSearchPaths ?? []);
  if (stemsSearchPaths) {
    stemsSearchPaths.forEach((entry) => paths.add(entry));
  }
  paths.add(path.join(libraryRoot, "stems"));
  setLibraryConfig({
    libraryRoot,
    stemsSearchPaths: [...paths],
  });
}

export function clearLibraryRoot(): void {
  try {
    if (fs.existsSync(configPath())) fs.unlinkSync(configPath());
  } catch {
    /* ignore */
  }
  writeDevHint(null);
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
  const stemsPath = findInstalledStemsFolder();
  if (!stemsPath) {
    return null;
  }

  const libraryRoot = normalizeLibraryRoot(stemsPath) ?? path.dirname(stemsPath);
  setLibraryRoot(libraryRoot, [stemsPath]);
  return libraryRoot;
}

export function clearDevHint(): void {
  writeDevHint(null);
}
