import { METER_FFT_SIZE, METER_SPECTRUM_FFT_SIZE } from "../audio/meterBus";
import type { MeterBus } from "../audio/meterBus";
import {
  applySpectrumTilt,
  byteFreqToNorm,
  gainToDb,
  smoothSpectrum,
} from "./dsp";
import { METER_SETTINGS } from "./meterSettings";
import {
  bandEnergiesFromSpectrum,
  getBandBounds,
  type BandBounds,
} from "./multiband";

export const WAVEFORM_BUCKETS = 512;
export const SPECTROGRAM_COLUMNS = 1024;
export const LISSAJOUS_POINTS = METER_SETTINGS.scopeHistoryPoints;
export const LISSAJOUS_STRIDE = 5;
export const CORRELATION_HISTORY = 120;

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
  scopePeak: number;
  correlation: number;
  correlationHistory: Float32Array;
  correlationHistoryWrite: number;
  stereoWidth: number;
  balanceDb: number;
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
let scopePeak = 0.05;

const correlationHistory = new Float32Array(CORRELATION_HISTORY);
let correlationHistoryWrite = 0;

let correlation = 0;
let stereoWidth = 0;
let balanceDb = 0;
let sampleRate = 48000;
let bandBounds: BandBounds = getBandBounds(48000, METER_FFT_SIZE);
let hasSignal = false;
let peakLevel = 0;
let version = 0;

const freqByte = new Uint8Array(spectrogramFftBins);
const freqByteSpectrum = new Uint8Array(spectrumFftBins);
const timeL = new Float32Array(METER_FFT_SIZE);
const timeR = new Float32Array(METER_FFT_SIZE);

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
  scopePeak = 0.05;
  correlationHistory.fill(0);
  correlationHistoryWrite = 0;
  correlation = 0;
  stereoWidth = 0;
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

function pushScopePoint(
  l: number,
  r: number,
  low: number,
  midE: number,
  high: number,
): void {
  const base = lissajousWrite * LISSAJOUS_STRIDE;
  lissajous[base] = l;
  lissajous[base + 1] = r;
  lissajous[base + 2] = low;
  lissajous[base + 3] = midE;
  lissajous[base + 4] = high;
  lissajousWrite = (lissajousWrite + 1) % LISSAJOUS_POINTS;

  const peak = Math.sqrt(l * l + r * r);
  if (peak > scopePeak) {
    scopePeak = peak * 1.04;
  } else {
    scopePeak = scopePeak * 0.996 + peak * 0.004;
  }
  if (scopePeak < 0.02) scopePeak = 0.02;
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
    const norm = byteFreqToNorm(freqByteSpectrum[i]);
    spectrumScratch[i] = norm;
    peak = Math.max(peak, norm);
  }
  applySpectrumTilt(spectrumScratch, sampleRate, METER_SPECTRUM_FFT_SIZE);
  peakLevel = peak;
  smoothSpectrum(spectrumSmooth, spectrumScratch, METER_SETTINGS.spectrumSmoothing);
  spectrum.set(spectrumSmooth);

  if (peak > 0.03) {
    hasSignal = true;
  } else if (!isPlaying) {
    hasSignal = false;
  }

  analyserL.getFloatTimeDomainData(timeL);
  analyserR.getFloatTimeDomainData(timeR);

  let sumLL = 0;
  let sumRR = 0;
  let sumLR = 0;
  let sumMid = 0;
  let sumSide = 0;
  let rmsL = 0;
  let rmsR = 0;
  const step = 2;

  for (let i = 0; i < timeL.length; i += step) {
    const l = timeL[i];
    const r = timeR[i];
    const mid = (l + r) * 0.5;
    const side = (l - r) * 0.5;

    currentMidMin = Math.min(currentMidMin, mid);
    currentMidMax = Math.max(currentMidMax, mid);
    currentSideMin = Math.min(currentSideMin, side);
    currentSideMax = Math.max(currentSideMax, side);

    sumLL += l * l;
    sumRR += r * r;
    sumLR += l * r;
    rmsL += l * l;
    rmsR += r * r;
    sumMid += Math.abs(mid);
    sumSide += Math.abs(side);

    if (isPlaying && peak > 0.03) {
      pushScopePoint(l, r, 0, 0, 0);
    }

    waveformSampleCounter += step;
    if (waveformSampleCounter >= waveformSamplesPerBucket) {
      commitWaveformBucket();
    }
  }

  const denom = Math.sqrt(sumLL * sumRR);
  correlation = denom > 1e-9 ? sumLR / denom : 1;
  correlation = Math.max(-1, Math.min(1, correlation));
  pushCorrelation(correlation);

  const total = sumMid + sumSide;
  stereoWidth = total > 1e-9 ? sumSide / total : 0;
  balanceDb = Math.max(-12, Math.min(12, gainToDb(rmsL + 1e-9) - gainToDb(rmsR + 1e-9)));

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
    scopePeak,
    correlation,
    correlationHistory,
    correlationHistoryWrite,
    stereoWidth,
    balanceDb,
    sampleRate,
    spectrumFftSize: METER_SPECTRUM_FFT_SIZE,
    spectrogramFftSize: METER_FFT_SIZE,
    bandBounds,
    hasSignal,
    peakLevel,
    version,
  };
}
