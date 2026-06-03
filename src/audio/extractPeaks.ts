/** Downsampled peak envelope for WaveSurfer (avoids re-fetching large stem files). */
export function extractPeaks(buffer: AudioBuffer, barCount = 256): number[] {
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

  return peaks;
}
