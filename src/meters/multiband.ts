/** Crossovers aligned with EasyMeter defaults. */
export const LOW_CROSSOVER_HZ = 160;
export const HIGH_CROSSOVER_HZ = 4000;

export interface BandBounds {
  lowEnd: number;
  midEnd: number;
  fftBins: number;
}

export function getBandBounds(sampleRate: number, fftSize: number): BandBounds {
  const binHz = sampleRate / fftSize;
  const fftBins = fftSize / 2;
  return {
    lowEnd: Math.min(fftBins, Math.max(1, Math.ceil(LOW_CROSSOVER_HZ / binHz))),
    midEnd: Math.min(fftBins, Math.max(2, Math.ceil(HIGH_CROSSOVER_HZ / binHz))),
    fftBins,
  };
}

export function bandEnergiesFromSpectrum(
  spectrum: Float32Array,
  bounds: BandBounds,
): { low: number; mid: number; high: number } {
  let low = 0;
  let mid = 0;
  let high = 0;
  for (let i = 0; i < bounds.lowEnd; i++) low += spectrum[i];
  for (let i = bounds.lowEnd; i < bounds.midEnd; i++) mid += spectrum[i];
  for (let i = bounds.midEnd; i < bounds.fftBins; i++) high += spectrum[i];
  return { low, mid, high };
}

/** RGB from low=red, mid=green, high=blue band balance. */
export function multibandColor(
  low: number,
  mid: number,
  high: number,
  alpha = 1,
): string {
  const total = low + mid + high + 1e-9;
  const r = Math.round((low / total) * 255);
  const g = Math.round((mid / total) * 255);
  const b = Math.round((high / total) * 255);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function multibandStroke(
  low: number,
  mid: number,
  high: number,
): string {
  return multibandColor(low, mid, high, 0.95);
}
