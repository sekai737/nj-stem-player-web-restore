/** Peak amplitude across every channel (stereo drum stems often split L/R). */
function samplePeak(buffer: AudioBuffer, index: number): number {
  let max = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const v = Math.abs(buffer.getChannelData(c)[index]!);
    if (v > max) max = v;
  }
  return max;
}

/**
 * Pad peaks with silence when a stem is shorter than the shared transport timeline
 * so WaveSurfer bars stay aligned with the global playhead.
 */
export function padPeaksForTimeline(
  peaks: number[],
  stemDurationSec: number,
  transportDurationSec: number,
): number[] {
  if (
    peaks.length === 0 ||
    stemDurationSec <= 0 ||
    transportDurationSec <= 0 ||
    stemDurationSec >= transportDurationSec
  ) {
    return peaks;
  }

  const activeBars = Math.max(1, Math.round(peaks.length * (stemDurationSec / transportDurationSec)));
  if (activeBars >= peaks.length) return peaks;

  return [...peaks.slice(0, activeBars), ...Array(peaks.length - activeBars).fill(0)];
}

/** Downsampled peak envelope for WaveSurfer (avoids re-fetching large stem files). */
export function extractPeaks(buffer: AudioBuffer, barCount = 512): number[] {
  const sampleCount = buffer.length;
  if (sampleCount === 0) return [];

  const peaks: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const start = Math.floor((i * sampleCount) / barCount);
    const end = Math.floor(((i + 1) * sampleCount) / barCount);
    let max = 0;
    for (let j = start; j < end; j++) {
      const v = samplePeak(buffer, j);
      if (v > max) max = v;
    }
    peaks.push(max);
  }

  return normalizePeaks(peaks);
}

/** Percentile of an already-prepared (unsorted) array, q in [0, 1]. */
function percentile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round(q * (sorted.length - 1))),
  );
  return sorted[idx]!;
}

/**
 * Visual loudness normalization — scales the whole envelope by one factor so
 * each stem's *body* amplitude maps to a consistent level. Uses the 95th
 * percentile (not the absolute max) as the loudness reference so a single
 * transient doesn't shrink the rest of the waveform. Every bar is scaled by
 * the same gain (shape + timing preserved); only rare peaks above the target
 * clamp to the box edge, so the waveform is never flattened or redrawn.
 */
export function normalizePeaks(peaks: number[]): number[] {
  if (peaks.length === 0) return peaks;

  const reference = percentile(peaks, 0.95);
  if (reference < 1e-8) return peaks;

  /** Map the 95th-percentile level to 90% of the box for headroom. */
  const TARGET_LEVEL = 0.9;
  const gain = TARGET_LEVEL / reference;

  return peaks.map((p) => Math.min(1, p * gain));
}
