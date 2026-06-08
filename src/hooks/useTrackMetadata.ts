import { useEffect, useState } from "react";
import { buildCatalogTrackMetadata } from "../metadata/catalogBaseline";
import { resolveTrackMetadata } from "../metadata/metadataService";
import type { TrackMetadata } from "../metadata/types";

/**
 * Auto-updates track metadata on song change (catalog baseline immediately, then cache/Spotify enrichment).
 * Prevents stale metadata by resetting to the new track's catalog values before async fetch completes.
 */
export function useTrackMetadata(
  releaseId: string | undefined,
  songId: string | undefined,
  liveDurationSec?: number,
): TrackMetadata | null {
  const [metadata, setMetadata] = useState<TrackMetadata | null>(() =>
    releaseId && songId ? buildCatalogTrackMetadata(releaseId, songId, liveDurationSec) : null,
  );

  useEffect(() => {
    if (!releaseId || !songId) {
      setMetadata(null);
      return;
    }

    const baseline = buildCatalogTrackMetadata(releaseId, songId, liveDurationSec);
    setMetadata(baseline);

    let cancelled = false;
    void resolveTrackMetadata(releaseId, songId, baseline?.durationSec ?? undefined)
      .then((resolved) => {
        if (!cancelled && resolved) {
          setMetadata(resolved);
        }
      })
      .catch(() => {
        if (!cancelled && baseline) {
          setMetadata({ ...baseline, isLoading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [releaseId, songId]);

  useEffect(() => {
    if (liveDurationSec == null || liveDurationSec <= 0) return;
    setMetadata((prev) =>
      prev ? { ...prev, durationSec: liveDurationSec } : prev,
    );
  }, [liveDurationSec]);

  return metadata;
}
