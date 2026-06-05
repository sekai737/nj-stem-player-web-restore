import { METER_SETTINGS } from "./meterSettings";

export const METER_MIN_DB = -90;
export const METER_MAX_DB = -18;
export const SPECTROGRAM_GAMMA = METER_SETTINGS.spectrogramGamma;
export const SPECTRUM_GAMMA = 1.1;

export function byteFreqToNorm(
  byte: number,
  minDb = METER_MIN_DB,
  maxDb = METER_MAX_DB,
): number {
  const db = minDb + (byte / 255) * (maxDb - minDb);
  const range = Math.max(0.01, maxDb - minDb);
  return Math.max(0, Math.min(1, (db - minDb) / range));
}

export function applyDisplayGamma(norm: number, gamma: number): number {
  return Math.pow(Math.max(0, Math.min(1, norm)), gamma);
}

/** Soft-knee compression so peaks keep texture instead of clipping to white. */
export function softCompressDisplay(norm: number, knee = 0.55): number {
  const n = Math.max(0, Math.min(1, norm));
  return n / (knee + n * (1 - knee));
}

export function gainToDb(gain: number, floor = 1e-6): number {
  return 20 * Math.log10(Math.max(gain, floor));
}

export function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}

export function melToHz(mel: number): number {
  return 700 * (10 ** (mel / 2595) - 1);
}

/** 0–1 position on mel scale between minHz and maxHz. */
export function hzToMelNorm(hz: number, minHz: number, maxHz: number): number {
  const lo = hzToMel(minHz);
  const hi = hzToMel(maxHz);
  return Math.max(0, Math.min(1, (hzToMel(hz) - lo) / Math.max(1e-6, hi - lo)));
}

/** Mel-normalized position (0–1) to Hz between minHz and maxHz. */
export function melNormToHz(t: number, minHz: number, maxHz: number): number {
  const lo = hzToMel(minHz);
  const hi = hzToMel(maxHz);
  return melToHz(lo + (hi - lo) * Math.max(0, Math.min(1, t)));
}

export function freqToLogNorm(hz: number, minHz: number, maxHz: number): number {
  const logMin = Math.log10(minHz);
  const logMax = Math.log10(maxHz);
  return Math.max(0, Math.min(1, (Math.log10(hz) - logMin) / Math.max(1e-6, logMax - logMin)));
}

export function freqToLogY(
  freq: number,
  height: number,
  minFreq = 20,
  maxFreq: number,
): number {
  return height - freqToLogNorm(freq, minFreq, maxFreq) * height;
}

export function binToFrequency(bin: number, sampleRate: number, fftSize: number): number {
  return (bin * sampleRate) / fftSize;
}

export function smoothSpectrum(
  target: Float32Array,
  source: Float32Array,
  smoothing: number,
): void {
  const s = Math.max(0, Math.min(0.99, smoothing));
  for (let i = 0; i < target.length; i++) {
    target[i] = s * target[i] + (1 - s) * source[i];
  }
}

/** Optional display tilt (dB/oct relative to 1 kHz); 0 leaves slope from source only. */
export function applySpectrumTilt(
  values: Float32Array,
  sampleRate: number,
  fftSize: number,
  tiltDbPerOct = METER_SETTINGS.spectrumTiltDbPerOct,
): void {
  const refHz = 1000;
  for (let bin = 1; bin < values.length; bin++) {
    const hz = binToFrequency(bin, sampleRate, fftSize);
    if (hz < 20) continue;
    const oct = Math.log2(hz / refHz);
    const gain = 10 ** ((tiltDbPerOct * oct) / 20);
    values[bin] = Math.min(1, values[bin] * gain);
  }
}

export function interpolateSpectrumAtHz(
  spectrum: Float32Array,
  hz: number,
  sampleRate: number,
  fftSize: number,
): number {
  const binF = (hz * fftSize) / sampleRate;
  const lower = Math.floor(binF);
  const upper = Math.min(spectrum.length - 1, lower + 1);
  const frac = binF - lower;
  return spectrum[lower] * (1 - frac) + spectrum[upper] * frac;
}
