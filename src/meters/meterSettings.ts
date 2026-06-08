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
  spectrumTiltDbPerOct: 1.5,
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
  /** Dot size for the half-circle goniometer scatter. */
  scopePointSize: 1.6,
  /**
   * Audio→radius curve drive (fixed). Maps raw sample magnitude to display
   * position — tune for stereo-field fidelity, not visual size.
   */
  scopeAudioDrive: 2.2,
  /** Max fraction of the inscribed radius loud peaks may approach (headroom from rim). */
  scopeMaxFill: 0.94,
  /**
   * Independent render-only scale for the vectorscope foreground (1 = default).
   * Scales only the audio-reactive dot cloud from the bottom-centre origin; the
   * background grid stays fixed. Does not affect audio analysis or correlation.
   */
  scopeVisualScale: 1.7,
  /** Samples plotted in the half-circle goniometer cloud per frame. */
  scopeHistoryPoints: 1100,
  /** Temporal smoothing for the vectorscope, 0 (off) … 1 (max). Light EWMA that
   * takes the edge off jitter without blurring the trace shape. */
  scopeSmoothing: 0.28,
  waveformMidRatio: 0.58,
  waveformFixedScale: 0.92,
  waveformBandAmplitude: 0.88,
  /** Render-only: trace line width for the meter waveform (px). */
  waveformLineWidth: 1,
} as const;

/**
 * Fallback canvas clip radius when CSS vars are unavailable.
 * Live value: `--meter-plot-inner-radius` on `.meter-plot-slot`.
 * @see src/components/meters/meter-panel.css
 */
export const METER_PLOT_CORNER_RADIUS_PX = 13;

/** Canvas plot titles — short subtitles under each meter name. */
export const METER_PLOT_LABELS = {
  spectrogram: {
    title: "Spectrogram",
    subtitle: (spanSeconds: number) => `Log frequency · ${spanSeconds}s`,
  },
  spectrum: {
    title: "Spectrum",
    subtitle: `Log · 1 kHz center · ${METER_SETTINGS.spectrumTiltDbPerOct} dB/oct`,
  },
  stereometer: {
    title: "Stereometer",
    subtitle: "Scaled · Unipolar",
  },
  waveform: {
    title: "Waveform",
    subtitle: "Mid / side",
  },
} as const;

/** Visible dB window for spectrum (center ± range/2). */
export const SPECTRUM_DB_MIN =
  METER_SETTINGS.spectrumCenterDb - METER_SETTINGS.spectrumRangeDb / 2;
export const SPECTRUM_DB_MAX =
  METER_SETTINGS.spectrumCenterDb + METER_SETTINGS.spectrumRangeDb / 2;
