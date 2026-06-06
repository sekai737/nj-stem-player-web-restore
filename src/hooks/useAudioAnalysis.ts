import { useEffect } from "react";
import { loadSongAnalysis } from "../audio/audioAnalysis";
import { setMeterStereoReference } from "../meters/meterStore";

/**
 * Loads the offline `audio-analyzer-rs` analysis for the current song (if a
 * `public/analysis/<releaseId>.json` file has been generated) and attaches its
 * master-mix stereo metrics to the meter store as a validated reference.
 *
 * No-ops gracefully when no analysis exists — live metering is unaffected.
 */
export function useAudioAnalysis(
  releaseId: string | undefined,
  songId: string | undefined,
): void {
  useEffect(() => {
    if (!releaseId || !songId) {
      setMeterStereoReference(null);
      return;
    }

    let cancelled = false;
    void loadSongAnalysis(releaseId, songId).then((analysis) => {
      if (cancelled) return;
      const stereo = analysis?.master?.stereo;
      setMeterStereoReference(
        stereo
          ? {
              correlationAvg: stereo.correlationAvg,
              widthAvg: stereo.widthAvg,
              balance: stereo.balance,
              monoCompatibility: stereo.monoCompatibility,
            }
          : null,
      );
    });

    return () => {
      cancelled = true;
      setMeterStereoReference(null);
    };
  }, [releaseId, songId]);
}
