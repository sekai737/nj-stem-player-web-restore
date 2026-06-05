import { METER_MAX_DB, METER_MIN_DB } from "../meters/dsp";
import {
  METER_SETTINGS,
  SPECTRUM_DB_MAX,
  SPECTRUM_DB_MIN,
} from "../meters/meterSettings";

export const METER_FFT_SIZE = METER_SETTINGS.fftSize;
export const METER_SPECTRUM_FFT_SIZE = METER_SETTINGS.spectrumFftSize;

export interface MeterBus {
  ctx: AudioContext;
  source: AudioNode;
  analyser: AnalyserNode;
  analyserSpectrum: AnalyserNode;
  analyserL: AnalyserNode;
  analyserR: AnalyserNode;
}

let meterBus: MeterBus | null = null;

export function attachMeterBus(ctx: AudioContext, source: AudioNode): MeterBus {
  if (meterBus?.ctx === ctx && meterBus.source === source) {
    return meterBus;
  }

  detachMeterBus();

  const trim = ctx.createGain();
  trim.gain.value = 1;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = METER_FFT_SIZE;
  analyser.smoothingTimeConstant = 0.35;
  analyser.minDecibels = METER_MIN_DB;
  analyser.maxDecibels = METER_MAX_DB;

  const analyserSpectrum = ctx.createAnalyser();
  analyserSpectrum.fftSize = METER_SPECTRUM_FFT_SIZE;
  analyserSpectrum.smoothingTimeConstant = METER_SETTINGS.spectrumSmoothing;
  analyserSpectrum.minDecibels = SPECTRUM_DB_MIN;
  analyserSpectrum.maxDecibels = SPECTRUM_DB_MAX;

  const splitter = ctx.createChannelSplitter(2);
  const midGainL = ctx.createGain();
  midGainL.gain.value = 0.5;
  const midGainR = ctx.createGain();
  midGainR.gain.value = 0.5;
  const midBus = ctx.createGain();

  const analyserL = ctx.createAnalyser();
  analyserL.fftSize = METER_FFT_SIZE;
  analyserL.smoothingTimeConstant = 0.45;
  const analyserR = ctx.createAnalyser();
  analyserR.fftSize = METER_FFT_SIZE;
  analyserR.smoothingTimeConstant = 0.45;

  try {
    source.disconnect(ctx.destination);
  } catch {
    /* not connected */
  }

  source.connect(trim);
  trim.connect(analyser);
  analyser.connect(ctx.destination);

  /** Minimeters Audio → Mid/Side (spectrum uses Mid = (L+R)/2). */
  source.connect(splitter);
  splitter.connect(midGainL, 0);
  splitter.connect(midGainR, 1);
  midGainL.connect(midBus);
  midGainR.connect(midBus);
  midBus.connect(analyserSpectrum);

  splitter.connect(analyserL, 0);
  splitter.connect(analyserR, 1);

  meterBus = { ctx, source, analyser, analyserSpectrum, analyserL, analyserR };
  return meterBus;
}

export function getMeterBus(): MeterBus | null {
  return meterBus;
}

export function detachMeterBus(): void {
  if (!meterBus) return;
  const { ctx, source, analyser } = meterBus;
  try {
    source.disconnect();
    analyser.disconnect();
    if (source instanceof GainNode) {
      source.connect(ctx.destination);
    }
  } catch {
    /* ignore */
  }
  meterBus = null;
}
