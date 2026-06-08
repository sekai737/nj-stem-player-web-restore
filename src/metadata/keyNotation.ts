import { METADATA_UNKNOWN } from "./types";

const STANDARD_KEY_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
const PLACEHOLDER_KEYS = new Set(["—", "–", "-", "?", "unknown", "tbd", "n/a", "na"]);

/** Catalog uses em dash when key is not filled in yet. */
export function isPlaceholderKey(keyLabel: string | null | undefined): boolean {
  if (!keyLabel?.trim()) return true;
  const trimmed = keyLabel.trim();
  return PLACEHOLDER_KEYS.has(trimmed) || PLACEHOLDER_KEYS.has(trimmed.toLowerCase());
}

/** Numeric Spotify key/mode → catalog-style label (e.g. Bbm). */
export function keyModeToLabel(key: number, mode: number): string | null {
  if (key < 0 || key > 11 || mode < 0 || mode > 1) return null;
  return `${STANDARD_KEY_NAMES[key]}${mode === 0 ? "m" : ""}`;
}

/** Camelot notation (spicetify-dj-info). */
export function keyModeToCamelot(key: number, mode: number): string | null {
  if (key < 0 || mode < 0) return null;
  return `${((7 * key + [4, 7][mode]!) % 12) + 1}${mode === 0 ? "A" : "B"}`;
}

/** Parse catalog shorthand (Bbm, C#m, F) into numeric key/mode when possible. */
export function parseCatalogKey(keyLabel: string): { key: number; mode: number } | null {
  const trimmed = keyLabel.trim();
  const minor = trimmed.match(/^([A-G](?:#|b)?)m$/i);
  if (minor) {
    const key = STANDARD_KEY_NAMES.findIndex(
      (name) => name.toLowerCase() === minor[1]!.toLowerCase(),
    );
    if (key >= 0) return { key, mode: 0 };
  }
  const major = trimmed.match(/^([A-G](?:#|b)?)$/i);
  if (major) {
    const key = STANDARD_KEY_NAMES.findIndex(
      (name) => name.toLowerCase() === major[1]!.toLowerCase(),
    );
    if (key >= 0) return { key, mode: 1 };
  }
  return null;
}

export function displayKeyLabel(keyLabel: string | null | undefined): string {
  if (isPlaceholderKey(keyLabel)) return METADATA_UNKNOWN;
  return keyLabel!.trim();
}

export function displayBpm(bpm: number | null | undefined): number | null {
  if (bpm == null || !Number.isFinite(bpm) || bpm <= 0) return null;
  return Math.round(bpm);
}

export function displayYear(year: number | null | undefined): number | null {
  if (year == null || !Number.isFinite(year) || year <= 0) return null;
  return Math.round(year);
}
