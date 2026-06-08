import { formatTime } from "./time";
import { isPlaceholderKey } from "../metadata/keyNotation";
import { METADATA_UNKNOWN } from "../metadata/types";

/** Figma Title metadata (3:280) — middle dot between fields. */
export const TRACK_METADATA_SEP = "\u00B7";

/** Shorthand keys from catalog (e.g. Bbm, Db) → Figma labels (Bb minor, Db major). */
export function formatMusicalKey(keyLabel: string): string {
  const trimmed = keyLabel.trim();
  if (!trimmed || trimmed === METADATA_UNKNOWN || isPlaceholderKey(trimmed)) {
    return METADATA_UNKNOWN;
  }
  if (/\s+(major|minor)$/i.test(trimmed)) return trimmed;

  const shortMinor = trimmed.match(/^([A-G](?:#|b)?)m$/i);
  if (shortMinor) return `${shortMinor[1]} minor`;

  const shortMajor = trimmed.match(/^([A-G](?:#|b)?)$/i);
  if (shortMajor) return `${shortMajor[1]} major`;

  return trimmed;
}

/** `3:11 · Bb minor · 109 BPM · (Winter ver.)` — matches Figma node 3:280. */
export function formatTrackMetadata(
  durationSec: number | null | undefined,
  keyLabel: string | null | undefined,
  bpm: number | null | undefined,
  options?: { titleSuffixes?: string[] },
): string {
  const parts = [
    durationSec != null && durationSec > 0 ? formatTime(durationSec) : METADATA_UNKNOWN,
    keyLabel && !isPlaceholderKey(keyLabel) ? formatMusicalKey(keyLabel) : METADATA_UNKNOWN,
    bpm != null && bpm > 0 ? `${bpm} BPM` : METADATA_UNKNOWN,
  ];
  if (options?.titleSuffixes?.length) parts.push(...options.titleSuffixes);
  /* Double spaces around · match pre–Figma-fix layout (white-space: pre). */
  return parts.join(`  ${TRACK_METADATA_SEP}  `);
}
