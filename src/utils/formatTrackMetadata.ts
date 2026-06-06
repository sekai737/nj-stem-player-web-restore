import { formatTime } from "./time";

/** Figma Title metadata (3:280) — middle dot between fields. */
export const TRACK_METADATA_SEP = "\u00B7";

/** Shorthand keys from catalog (e.g. Bbm) → Figma labels (Bb minor). */
export function formatMusicalKey(keyLabel: string): string {
  const trimmed = keyLabel.trim();
  const shortMinor = trimmed.match(/^([A-G](?:#|b)?)m$/i);
  if (shortMinor) return `${shortMinor[1]} minor`;
  return trimmed;
}

/** `3:11 · Bb minor · 109 BPM · (Winter ver.)` — matches Figma node 3:280. */
export function formatTrackMetadata(
  durationSec: number,
  keyLabel: string,
  bpm: number,
  options?: { titleSuffixes?: string[] },
): string {
  const parts = [
    formatTime(durationSec),
    formatMusicalKey(keyLabel),
    `${bpm} BPM`,
  ];
  if (options?.titleSuffixes?.length) parts.push(...options.titleSuffixes);
  /* Double spaces around · match pre–Figma-fix layout (white-space: pre). */
  return parts.join(`  ${TRACK_METADATA_SEP}  `);
}
