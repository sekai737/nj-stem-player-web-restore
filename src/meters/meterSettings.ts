/**
 * Analyzer settings — spectrum plot aligned with minimeters reference:
 * - Main: Style Both, Smoothing 90%, Tilt 2 dB/oct, FFT 4096, Scale Mel
 * - Audio: Mid/Side, Range 70 dB, Center -55 dB
 * - Reference: Frequency lines Bright, threshold off (no threshold line drawn)
 */
export const METER_SETTINGS = {
  fftSize: 4096,
  /** Minimeters Main → FFT Size 4096 */
  spectrumFftSize: 4096,
  /** Minimeters Main → Smoothing 90% (AnalyserNode smoothingTimeConstant) */
  spectrumSmoothing: 0.9,
  /** Display tilt (dB/oct @ 1 kHz). */
  spectrumTiltDbPerOct: 2,
  spectrumRangeDb: 70,
  spectrumCenterDb: -55,
  spectrumDisplayScale: 1,
  /** Thinner spectrum bars (minimeters-style). */
  spectrumBarOpacity: 0.45,
  /** Minimeters Main → Style "Both": color bars + FFT line (no solid under-fill) */
  spectrumStyleBoth: true,
  /** Minimeters Reference → Frequency Lines "Bright" */
  spectrumFrequencyLinesBright: true,
  /** Extra JS smooth after analyser (0 = analyser smoothing only) */
  spectrumDisplaySmoothing: 0,
  spectrogramFade: 0.4,
  spectrogramSpeed: 0.8,
  spectrogramMinDb: -78,
  spectrogramMaxDb: -16,
  spectrogramGamma: 1.15,
  spectrogramLutCeiling: 1,
  spectrogramRenderScale: 2,
  scopePointSize: 3,
  scopeHistoryPoints: 512,
  waveformMidRatio: 0.58,
  waveformFixedScale: 0.92,
  waveformBandAmplitude: 0.88,
} as const;

/**
 * Canvas clip radius inside `.meter-plot-slot` (Figma cr-16 minus 2px stroke).
 * @see src/components/meters/meter-panel.css
 */
export const METER_PLOT_CORNER_RADIUS_PX = 14;

/** Visible dB window for spectrum (center ± range/2). */
export const SPECTRUM_DB_MIN =
  METER_SETTINGS.spectrumCenterDb - METER_SETTINGS.spectrumRangeDb / 2;
export const SPECTRUM_DB_MAX =
  METER_SETTINGS.spectrumCenterDb + METER_SETTINGS.spectrumRangeDb / 2;
