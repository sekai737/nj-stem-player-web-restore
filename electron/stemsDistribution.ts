import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { normalizeLibraryRoot, readLibraryConfig, setLibraryRoot } from "./library.js";

import { WINDOWS_PATHS } from "./windowsPaths.js";

export const STEMS_MAGNET_LINK =
  "magnet:?xt=urn:btih:559cadfd07a588cd655e4c6682bc9cf9f922bc99&dn=stems&xl=1636194123&tr=udp%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce";

export const STEMS_ARCHIVE_URL = "https://archive.org/details/newjeans-stem-player-stems";

const STEM_EXTENSIONS = new Set([".mp3", ".flac", ".wav"]);

/** Platform default folder where the stem pack installer places audio files. */
export function getDefaultStemsPath(): string {
  switch (process.platform) {
    case "win32":
      return WINDOWS_PATHS.defaultStemsDir;
    case "darwin":
      return path.join(os.homedir(), "Music", "NewJeans Stem Player", "stems");
    case "linux":
      return path.join(os.homedir(), ".local", "share", "NewJeans Stem Player", "stems");
    default:
      return path.join(os.homedir(), "NewJeans Stem Player", "stems");
  }
}

function walkHasStemFiles(dir: string): boolean {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile()) {
      if (STEM_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        return true;
      }
    } else if (entry.isDirectory()) {
      if (walkHasStemFiles(full)) return true;
    }
  }
  return false;
}

/** True when the folder (recursively) contains stem audio files. */
export function folderHasStemFiles(folderPath: string): boolean {
  if (!folderPath || !fs.existsSync(folderPath)) return false;
  const stat = fs.statSync(folderPath);
  if (!stat.isDirectory()) return false;
  return walkHasStemFiles(folderPath);
}

/** All stem folders the desktop app should check on launch. */
export function getStemsSearchPaths(): string[] {
  const paths = new Set<string>();
  const add = (folderPath: string | undefined) => {
    if (!folderPath) return;
    paths.add(path.normalize(folderPath));
  };

  add(getDefaultStemsPath());

  const config = readLibraryConfig();
  config?.stemsSearchPaths?.forEach(add);
  if (config?.libraryRoot) {
    add(path.join(config.libraryRoot, "stems"));
  }

  return [...paths];
}

/** First stems folder that contains audio, or null. */
export function findInstalledStemsFolder(): string | null {
  for (const stemsPath of getStemsSearchPaths()) {
    if (folderHasStemFiles(stemsPath)) {
      return stemsPath;
    }
  }
  return null;
}

/** Resolve a stems-folder or library-folder selection to a library root and persist it. */
export function confirmStemsFolder(folderPath: string): boolean {
  if (!folderHasStemFiles(folderPath)) return false;

  let libraryRoot = normalizeLibraryRoot(folderPath);
  if (!libraryRoot && path.basename(folderPath).toLowerCase() === "stems") {
    libraryRoot = path.dirname(folderPath);
  }
  if (!libraryRoot || !folderHasStemFiles(path.join(libraryRoot, "stems"))) {
    return false;
  }

  const stemsPath = path.join(libraryRoot, "stems");
  setLibraryRoot(libraryRoot, [stemsPath]);
  return true;
}
