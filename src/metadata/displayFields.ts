import type { Song } from "../types";
import { isPlaceholderKey } from "./keyNotation";
import type { TrackMetadata } from "./types";

/** Values for SongTitleBlock — catalog wins when complete; Unknown when placeholders stay empty. */
export function getDisplayMetadataFields(
  metadata: TrackMetadata | null,
  song: Song,
  liveDurationSec?: number,
): {
  durationSec: number;
  keyLabel: string | null | undefined;
  bpm: number | null | undefined;
} {
  const catalogPlaceholder = isPlaceholderKey(song.key);

  return {
    durationSec: metadata?.durationSec ?? liveDurationSec ?? song.durationSec,
    keyLabel: metadata?.keyLabel ?? (catalogPlaceholder ? undefined : song.key),
    bpm: metadata?.bpm ?? (catalogPlaceholder ? undefined : song.bpm),
  };
}
