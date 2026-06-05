/** Downsampled peak envelope for WaveSurfer (avoids re-fetching large stem files). */
export function extractPeaks(buffer: AudioBuffer, barCount = 512): number[] {
  const channel = buffer.getChannelData(0);
  if (channel.length === 0) return [];

  const samplesPerBar = Math.max(1, Math.floor(channel.length / barCount));
  const peaks: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * samplesPerBar;
    const end = Math.min(channel.length, start + samplesPerBar);
    let max = 0;
    for (let j = start; j < end; j++) {
      const v = Math.abs(channel[j]!);
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
