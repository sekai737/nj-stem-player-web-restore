/** Analyzer settings aligned with the reference UI. */
export const METER_SETTINGS = {
  fftSize: 4096,
  spectrumSmoothing: 0.55,
  spectrumTiltDbPerOct: 4.5,
  spectrogramFade: 0.4,
  spectrogramSpeed: 0.8,
  spectrogramMinDb: -78,
  spectrogramMaxDb: -16,
  spectrogramGamma: 1.15,
  scopePointSize: 3,
  scopeHistoryPoints: 512,
  waveformMidRatio: 0.58,
} as const;
