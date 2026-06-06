import { METER_FFT_SIZE, METER_SPECTRUM_FFT_SIZE } from "../audio/meterBus";
import type { MeterBus } from "../audio/meterBus";
import {
  applySpectrumTilt,
  byteFreqToNorm,
  gainToDb,
  smoothSpectrum,
} from "./dsp";
import {
  METER_SETTINGS,
  SPECTRUM_DB_MAX,
  SPECTRUM_DB_MIN,
} from "./meterSettings";
import {
  bandEnergiesFromSpectrum,
  getBandBounds,
  type BandBounds,
} from "./multiband";

export const WAVEFORM_BUCKETS = 512;
export const SPECTROGRAM_COLUMNS = 1024;
export const LISSAJOUS_POINTS = METER_SETTINGS.scopeHistoryPoints;
/** Per-point floats in the goniometer ring: [L, R]. Single-colour scope — no
 * per-band data (the visualization is one colour). */
export const LISSAJOUS_STRIDE = 2;
export const CORRELATION_HISTORY = 120;

/**
 * Ground-truth stereo metrics measured offline by `audio-analyzer-rs`
 * (preprocessing workflow — see scripts/analyze-stems.mjs). Optional: when
 * present for the current song the stereometer can show the validated
 * reference value alongside the live measurement. Definitions match the
 * crate's `stereo.rs`: correlation [-1,1], width = side/mid RMS ratio,
 * balance [-1,1] (negative = left).
 */
export interface StereoReference {
  correlationAvg: number;
  widthAvg: number;
  balance: number;
  monoCompatibility?: number;
}

export interface MeterSnapshot {
  spectrum: Float32Array;
  spectrogram: Float32Array;
  spectrogramWrite: number;
  spectrogramWrapped: boolean;
  waveformMidMin: Float32Array;
  waveformMidMax: Float32Array;
  waveformSideMin: Float32Array;
  waveformSideMax: Float32Array;
  waveformLow: Float32Array;
  waveformMid: Float32Array;
  waveformHigh: Float32Array;
  waveformFilled: number;
  waveformWrite: number;
  waveformPeak: number;
  waveformScale: number;
  lissajous: Float32Array;
  lissajousWrite: number;
  lissajousCount: number;
  correlation: number;
  correlationHistory: Float32Array;
  correlationHistoryWrite: number;
  stereoWidth: number;
  /** Side/Mid RMS ratio (matches audio-analyzer-rs width; unbounded). */
  stereoWidthRatio: number;
  /** L/R balance, -1 (left) … +1 (right). */
  balance: number;
  balanceDb: number;
  referenceStereo: StereoReference | null;
  sampleRate: number;
  spectrumFftSize: number;
  spectrogramFftSize: number;
  bandBounds: BandBounds;
  hasSignal: boolean;
  peakLevel: number;
  version: number;
}

const spectrogramFftBins = METER_FFT_SIZE / 2;
const spectrumFftBins = METER_SPECTRUM_FFT_SIZE / 2;

const spectrum = new Float32Array(spectrumFftBins);
const spectrumSmooth = new Float32Array(spectrumFftBins);
const spectrumScratch = new Float32Array(spectrumFftBins);
const spectrogramColumnScratch = new Float32Array(spectrogramFftBins);
const spectrogram = new Float32Array(spectrogramFftBins * SPECTROGRAM_COLUMNS);
let spectrogramWrite = 0;
let spectrogramWrapped = false;

const waveformMidMin = new Float32Array(WAVEFORM_BUCKETS);
const waveformMidMax = new Float32Array(WAVEFORM_BUCKETS);
const waveformSideMin = new Float32Array(WAVEFORM_BUCKETS);
const waveformSideMax = new Float32Array(WAVEFORM_BUCKETS);
const waveformLow = new Float32Array(WAVEFORM_BUCKETS);
const waveformMid = new Float32Array(WAVEFORM_BUCKETS);
const waveformHigh = new Float32Array(WAVEFORM_BUCKETS);

let waveformWrite = 0;
let waveformFilled = 0;
let waveformSampleCounter = 0;
let waveformSamplesPerBucket = 256;
let waveformPeak = 0.05;
let waveformScale = METER_SETTINGS.waveformFixedScale;

let currentMidMin = 0;
let currentMidMax = 0;
let currentSideMin = 0;
let currentSideMax = 0;

const lissajous = new Float32Array(LISSAJOUS_POINTS * LISSAJOUS_STRIDE);
let lissajousWrite = 0;
const correlationHistory = new Float32Array(CORRELATION_HISTORY);
let correlationHistoryWrite = 0;

let correlation = 0;
let stereoWidth = 0;
let stereoWidthRatio = 0;
let balance = 0;
let balanceDb = 0;
let referenceStereo: StereoReference | null = null;
let sampleRate = 48000;
let bandBounds: BandBounds = getBandBounds(48000, METER_FFT_SIZE);
let hasSignal = false;
let peakLevel = 0;
let version = 0;

const freqByte = new Uint8Array(spectrogramFftBins);
const freqByteSpectrum = new Uint8Array(spectrumFftBins);
const timeL = new Float32Array(METER_FFT_SIZE);
const timeR = new Float32Array(METER_FFT_SIZE);
/** Temporally smoothed L/R used for the scope display only (metrics use raw). */
const scopeSmoothL = new Float32Array(METER_FFT_SIZE);
const scopeSmoothR = new Float32Array(METER_FFT_SIZE);
/** EWMA coefficient (polarity/app.vectorscope curve): higher smoothing → lower. */
const scopeSmoothAlpha =
  1 - 0.94 * Math.pow(Math.max(0, Math.min(1, METER_SETTINGS.scopeSmoothing)), 1.5);

let lastFrameMs = 0;
const frameIntervalMs = 1000 / 60;
let lastSpectrogramPushMs = 0;
const spectrogramColumnIntervalMs = 1000 / 90;

export function resetMeterStore(): void {
  spectrum.fill(0);
  spectrumSmooth.fill(0);
  spectrogram.fill(0);
  spectrogramWrite = 0;
  spectrogramWrapped = false;
  waveformMidMin.fill(0);
  waveformMidMax.fill(0);
  waveformSideMin.fill(0);
  waveformSideMax.fill(0);
  waveformLow.fill(0);
  waveformMid.fill(0);
  waveformHigh.fill(0);
  scopeSmoothL.fill(0);
  scopeSmoothR.fill(0);
  waveformWrite = 0;
  waveformFilled = 0;
  waveformSampleCounter = 0;
  waveformPeak = 0.05;
  waveformScale = METER_SETTINGS.waveformFixedScale;
  currentMidMin = 0;
  currentMidMax = 0;
  currentSideMin = 0;
  currentSideMax = 0;
  lissajous.fill(0);
  lissajousWrite = 0;
  correlationHistory.fill(0);
  correlationHistoryWrite = 0;
  correlation = 0;
  stereoWidth = 0;
  stereoWidthRatio = 0;
  balance = 0;
  balanceDb = 0;
  hasSignal = false;
  peakLevel = 0;
  lastFrameMs = 0;
  lastSpectrogramPushMs = 0;
  version++;
}

function commitWaveformBucket(): void {
  const i = waveformWrite;
  waveformMidMin[i] = currentMidMin;
  waveformMidMax[i] = currentMidMax;
  waveformSideMin[i] = currentSideMin;
  waveformSideMax[i] = currentSideMax;

  const b = bandEnergiesFromSpectrum(spectrumScratch, bandBounds);
  const total = b.low + b.mid + b.high + 1e-9;
  waveformLow[i] = b.low / total;
  waveformMid[i] = b.mid / total;
  waveformHigh[i] = b.high / total;

  const bucketPeak = Math.max(
    Math.abs(currentMidMin),
    Math.abs(currentMidMax),
    Math.abs(currentSideMin),
    Math.abs(currentSideMax),
  );
  waveformPeak = bucketPeak;
  waveformScale = METER_SETTINGS.waveformFixedScale;

  waveformWrite = (waveformWrite + 1) % WAVEFORM_BUCKETS;
  waveformFilled = Math.min(WAVEFORM_BUCKETS, waveformFilled + 1);

  currentMidMin = 0;
  currentMidMax = 0;
  currentSideMin = 0;
  currentSideMax = 0;
  waveformSampleCounter = 0;
}

function pushSpectrogramColumn(magnitudes: Float32Array): void {
  const col = spectrogramWrite;
  for (let bin = 0; bin < spectrogramFftBins; bin++) {
    spectrogram[bin * SPECTROGRAM_COLUMNS + col] = magnitudes[bin];
  }
  spectrogramWrite = (spectrogramWrite + 1) % SPECTROGRAM_COLUMNS;
  if (spectrogramWrite === 0) spectrogramWrapped = true;
}

function pushScopePoint(l: number, r: number): void {
  const base = lissajousWrite * LISSAJOUS_STRIDE;
  lissajous[base] = l;
  lissajous[base + 1] = r;
  lissajousWrite = (lissajousWrite + 1) % LISSAJOUS_POINTS;
}

function pushCorrelation(value: number): void {
  correlationHistory[correlationHistoryWrite] = value;
  correlationHistoryWrite = (correlationHistoryWrite + 1) % CORRELATION_HISTORY;
}

export function processMeterFrame(bus: MeterBus, isPlaying: boolean): void {
  const now = performance.now();
  if (now - lastFrameMs < frameIntervalMs) return;
  lastFrameMs = now;

  const { analyser, analyserSpectrum, analyserL, analyserR, ctx } = bus;
  sampleRate = ctx.sampleRate;
  bandBounds = getBandBounds(sampleRate, METER_SPECTRUM_FFT_SIZE);

  if (isPlaying && ctx.state === "suspended") {
    void ctx.resume();
  }

  waveformSamplesPerBucket = Math.max(
    96,
    Math.floor((sampleRate / 30) * METER_SETTINGS.spectrogramSpeed),
  );

  analyser.getByteFrequencyData(freqByte);
  let spectrogramPeak = 0;
  for (let i = 0; i < spectrogramFftBins; i++) {
    const norm = byteFreqToNorm(
      freqByte[i],
      METER_SETTINGS.spectrogramMinDb,
      METER_SETTINGS.spectrogramMaxDb,
    );
    spectrogramColumnScratch[i] = norm;
    spectrogramPeak = Math.max(spectrogramPeak, norm);
  }
  if (spectrogramPeak > 0.03 && isPlaying) {
    if (lastSpectrogramPushMs === 0) lastSpectrogramPushMs = now;
    let pushed = 0;
    while (
      now - lastSpectrogramPushMs >= spectrogramColumnIntervalMs &&
      pushed < 4
    ) {
      pushSpectrogramColumn(spectrogramColumnScratch);
      lastSpectrogramPushMs += spectrogramColumnIntervalMs;
      pushed += 1;
    }
  }

  analyserSpectrum.getByteFrequencyData(freqByteSpectrum);
  let peak = 0;
  for (let i = 0; i < spectrumFftBins; i++) {
    const norm = byteFreqToNorm(
      freqByteSpectrum[i],
      SPECTRUM_DB_MIN,
      SPECTRUM_DB_MAX,
    );
    spectrumScratch[i] = norm;
    peak = Math.max(peak, norm);
  }
  applySpectrumTilt(spectrumScratch, sampleRate, METER_SPECTRUM_FFT_SIZE);
  peakLevel = peak;
  smoothSpectrum(
    spectrumSmooth,
    spectrumScratch,
    METER_SETTINGS.spectrumDisplaySmoothing,
  );
  spectrum.set(spectrumSmooth);

  if (peak > 0.03) {
    hasSignal = true;
  } else if (!isPlaying) {
    hasSignal = false;
  }

  analyserL.getFloatTimeDomainData(timeL);
  analyserR.getFloatTimeDomainData(timeR);

  /**
   * Stereo metrics from the real L/R time-domain frames (energy based):
   * - correlation = Pearson coefficient of L,R (phase: +1 mono … -1 anti-phase)
   * - width       = RMS(side)/RMS(mid) (mid/side energy ratio)
   * - balance     = (RMS_R - RMS_L) / (RMS_R + RMS_L)  (-1 left … +1 right)
   * Computed at full sample resolution for accuracy; the goniometer scope is
   * sampled on an even stride so it represents the whole frame.
   */
  const n = timeL.length;
  let sumLL = 0;
  let sumRR = 0;
  let sumLR = 0;
  let sumMidSq = 0;
  let sumSideSq = 0;

  const scopeStride = Math.max(1, Math.floor(n / LISSAJOUS_POINTS));

  for (let i = 0; i < n; i++) {
    const l = timeL[i];
    const r = timeR[i];
    const mid = (l + r) * 0.5;
    const side = (l - r) * 0.5;

    if (mid < currentMidMin) currentMidMin = mid;
    if (mid > currentMidMax) currentMidMax = mid;
    if (side < currentSideMin) currentSideMin = side;
    if (side > currentSideMax) currentSideMax = side;

    sumLL += l * l;
    sumRR += r * r;
    sumLR += l * r;
    sumMidSq += mid * mid;
    sumSideSq += side * side;

    /** Temporal smoothing for the display trace (raw l/r stay for metrics). */
    scopeSmoothL[i] += (l - scopeSmoothL[i]) * scopeSmoothAlpha;
    scopeSmoothR[i] += (r - scopeSmoothR[i]) * scopeSmoothAlpha;

    if (isPlaying && i % scopeStride === 0) {
      pushScopePoint(scopeSmoothL[i], scopeSmoothR[i]);
    }

    waveformSampleCounter += 1;
    if (waveformSampleCounter >= waveformSamplesPerBucket) {
      commitWaveformBucket();
    }
  }

  const denom = Math.sqrt(sumLL * sumRR);
  correlation = denom > 1e-9 ? Math.max(-1, Math.min(1, sumLR / denom)) : 1;
  pushCorrelation(correlation);

  const rmsMid = Math.sqrt(sumMidSq / n);
  const rmsSide = Math.sqrt(sumSideSq / n);
  /** Bounded display width 0…1: mono→0, equal M/S energy→0.5, anti-phase→1. */
  stereoWidth = rmsMid + rmsSide > 1e-9 ? rmsSide / (rmsMid + rmsSide) : 0;
  /** Unbounded side/mid ratio, matching audio-analyzer-rs `stereo.rs`. */
  stereoWidthRatio = rmsMid > 1e-9 ? rmsSide / rmsMid : 0;

  const rmsL = Math.sqrt(sumLL / n);
  const rmsR = Math.sqrt(sumRR / n);
  balance = rmsL + rmsR > 1e-9 ? (rmsR - rmsL) / (rmsR + rmsL) : 0;
  balanceDb = Math.max(-12, Math.min(12, gainToDb(rmsL + 1e-9) - gainToDb(rmsR + 1e-9)));

  version++;
}

/**
 * Attach (or clear) the offline `audio-analyzer-rs` stereo reference for the
 * current song. Live metrics are always computed from real audio; this only
 * supplies a validated comparison value to the stereometer readout.
 */
export function setMeterStereoReference(ref: StereoReference | null): void {
  referenceStereo = ref;
  version++;
}

export function getMeterSnapshot(): MeterSnapshot {
  return {
    spectrum,
    spectrogram,
    spectrogramWrite,
    spectrogramWrapped,
    waveformMidMin,
    waveformMidMax,
    waveformSideMin,
    waveformSideMax,
    waveformLow,
    waveformMid,
    waveformHigh,
    waveformFilled,
    waveformWrite,
    waveformPeak,
    waveformScale,
    lissajous,
    lissajousWrite,
    lissajousCount: LISSAJOUS_POINTS,
    correlation,
    correlationHistory,
    correlationHistoryWrite,
    stereoWidth,
    stereoWidthRatio,
    balance,
    balanceDb,
    referenceStereo,
    sampleRate,
    spectrumFftSize: METER_SPECTRUM_FFT_SIZE,
    spectrogramFftSize: METER_FFT_SIZE,
    bandBounds,
    hasSignal,
    peakLevel,
    version,
  };
}
