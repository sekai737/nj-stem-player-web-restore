import {
  LISSAJOUS_STRIDE,
  SPECTROGRAM_COLUMNS,
  type MeterSnapshot,
  WAVEFORM_BUCKETS,
} from "./meterStore";
import {
  applyDisplayGamma,
  interpolateSpectrumAtHz,
  melNormToHz,
  softCompressDisplay,
} from "./dsp";
import {
  clipMeterPlotRegion,
  fillRoundedMeterPlot,
  resolveMeterPlotRadius,
} from "./meterPlotClip";
import { METER_SETTINGS } from "./meterSettings";
import type { MeterVisualTokens } from "./meterVisualThemes";

let spectrogramScratchCanvas: HTMLCanvasElement | null = null;
let spectrogramScratchW = 0;
let spectrogramScratchH = 0;

/** Universal "phase problem" red for negative correlation (theme-independent). */
const CORRELATION_NEGATIVE = "#ff4d4f";
const CORRELATION_NEGATIVE_SOFT = "rgba(255, 77, 79, 0.55)";

/**
 * Draws the half-circle goniometer reference frame: the outer semicircle, two
 * concentric arcs, and the Left / mid / Right radial axes from the origin.
 */
function drawStereoGrid(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  theme: MeterVisualTokens,
): void {
  ctx.save();
  ctx.lineWidth = 1;

  /** Concentric arcs (upper half spans canvas angles π … 2π). */
  ctx.strokeStyle = theme.grid;
  for (const frac of [0.4, 0.7, 1]) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * frac, Math.PI, 2 * Math.PI);
    ctx.stroke();
  }

  /** Radial axes: Right (45°), mid (90°, up), Left (135°). */
  ctx.strokeStyle = theme.gridStrong;
  for (const deg of [45, 90, 135]) {
    const a = (deg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * radius, cy - Math.sin(a) * radius);
    ctx.stroke();
  }

  ctx.restore();
}

/** Maps raw sample magnitude → radius in audio-reference space (no visual scale). */
function scopeRadiusFromMag(mag: number, radius: number): number {
  const maxRad = radius * METER_SETTINGS.scopeMaxFill;
  const unit = 1 - Math.exp(-mag * METER_SETTINGS.scopeAudioDrive);
  return maxRad * unit;
}

function spectrogramBinsFromSnap(snap: MeterSnapshot): number {
  return snap.spectrogramFftSize / 2;
}

function filledSpectrogramCols(snap: MeterSnapshot): number {
  if (!snap.spectrogramWrapped) {
    return Math.max(1, snap.spectrogramWrite);
  }
  return SPECTROGRAM_COLUMNS;
}

function spectrogramColumnAt(snap: MeterSnapshot, colsFromNewest: number): number {
  const filled = filledSpectrogramCols(snap);
  const offset = Math.min(Math.max(0, colsFromNewest), filled - 1);
  return (snap.spectrogramWrite - 1 - offset + SPECTROGRAM_COLUMNS) % SPECTROGRAM_COLUMNS;
}

function sampleSpectrogram(
  snap: MeterSnapshot,
  binF: number,
  pxFromRight: number,
  renderW: number,
): number {
  const fftBins = spectrogramBinsFromSnap(snap);
  const b0 = Math.max(0, Math.min(fftBins - 1, Math.floor(binF)));
  const b1 = Math.min(fftBins - 1, b0 + 1);
  const bFrac = binF - b0;

  const filled = filledSpectrogramCols(snap);
  const historySpan = snap.spectrogramWrapped
    ? Math.min(renderW, SPECTROGRAM_COLUMNS)
    : filled;

  if (pxFromRight >= historySpan) {
    return 0;
  }

  const colOffsetF = historySpan <= 1 ? 0 : pxFromRight;
  const c0 = Math.floor(colOffsetF);
  const c1 = Math.min(historySpan - 1, c0 + 1);
  const cFrac = colOffsetF - c0;

  const read = (bin: number, colOff: number): number => {
    const col = spectrogramColumnAt(snap, colOff);
    return snap.spectrogram[bin * SPECTROGRAM_COLUMNS + col];
  };

  const n00 = read(b0, c0);
  const n01 = read(b0, c1);
  const n10 = read(b1, c0);
  const n11 = read(b1, c1);
  const top = n00 * (1 - cFrac) + n01 * cFrac;
  const bot = n10 * (1 - cFrac) + n11 * cFrac;
  return top * (1 - bFrac) + bot * bFrac;
}

function spectrogramNormToColor(
  norm: number,
  lut: Uint8ClampedArray,
): { r: number; g: number; b: number } {
  const shaped = applyDisplayGamma(
    softCompressDisplay(norm, 0.5),
    METER_SETTINGS.spectrogramGamma,
  );
  const capped = Math.min(METER_SETTINGS.spectrogramLutCeiling, shaped);
  const lutIdx = Math.round(capped * (lut.length / 4 - 1)) * 4;
  return {
    r: lut[lutIdx],
    g: lut[lutIdx + 1],
    b: lut[lutIdx + 2],
  };
}

/** Plot header + data region; outer border/radius come from `.meter-plot-slot`. */
function drawPlotChrome(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: MeterVisualTokens,
  title: string,
  subtitle?: string,
  cornerRadius = 0,
): { plotX: number; plotY: number; plotW: number; plotH: number } {
  fillRoundedMeterPlot(ctx, w, h, resolveMeterPlotRadius(cornerRadius), theme.plotWell);

  ctx.fillStyle = theme.text;
  ctx.font = `normal 11px ${theme.fontMedium}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, 8, 13);

  if (subtitle) {
    ctx.fillStyle = theme.textMuted;
    ctx.font = `normal 9px ${theme.fontRegular}`;
    ctx.fillText(subtitle, 8, 23);
  }

  const plotTop = subtitle ? 28 : 20;
  const plotH = Math.max(8, h - plotTop - 4);
  const plotW = Math.max(8, w - 8);
  const plotX = 4;
  const plotY = plotTop;

  return { plotX, plotY, plotW, plotH };
}

export function drawSpectrogram(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  snap: MeterSnapshot,
  spanSeconds: number,
  theme: MeterVisualTokens,
  dpr = 1,
  cornerRadius = 0,
): void {
  const { plotX, plotY, plotW, plotH } = drawPlotChrome(
    ctx,
    w,
    h,
    theme,
    "Spectrogram",
    `Horizontal · ${spanSeconds}s`,
    cornerRadius,
  );

  const plotRadius = resolveMeterPlotRadius(cornerRadius);

  if (!snap.hasSignal && !snap.spectrogramWrapped) {
    ctx.fillStyle = theme.textMuted;
    ctx.font = `normal 11px ${theme.fontRegular}`;
    ctx.textAlign = "center";
    ctx.fillText("Play audio to fill spectrogram", w / 2, h / 2);
    return;
  }

  const nyquist = snap.sampleRate * 0.5;
  const fftBins = spectrogramBinsFromSnap(snap);
  const scale = METER_SETTINGS.spectrogramRenderScale * Math.max(1, dpr);
  const renderW = Math.max(8, Math.floor(plotW * scale));
  const renderH = Math.max(8, Math.floor(plotH * scale));
  const img = ctx.createImageData(renderW, renderH);
  const data = img.data;
  const logMin = Math.log10(20);
  const logMax = Math.log10(nyquist);
  const fade = METER_SETTINGS.spectrogramFade;
  const { lut } = theme;

  for (let py = 0; py < renderH; py++) {
    const ratio = 1 - py / renderH;
    const freq = 10 ** (logMin + (logMax - logMin) * ratio);
    const binF = (freq / nyquist) * (fftBins - 1);

    for (let px = 0; px < renderW; px++) {
      const pxFromRight = renderW - 1 - px;
      const norm = sampleSpectrogram(snap, binF, pxFromRight, renderW);
      const o = (py * renderW + px) * 4;
      if (norm < 0.002) {
        data[o + 3] = 0;
        continue;
      }
      const age = pxFromRight / Math.max(1, renderW - 1);
      const alpha = 1 - fade * age * 0.85;
      const { r, g, b } = spectrogramNormToColor(norm, lut);
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = Math.round(255 * alpha);
    }
  }

  if (!spectrogramScratchCanvas || spectrogramScratchW !== renderW || spectrogramScratchH !== renderH) {
    spectrogramScratchCanvas = document.createElement("canvas");
    spectrogramScratchW = renderW;
    spectrogramScratchH = renderH;
    spectrogramScratchCanvas.width = renderW;
    spectrogramScratchCanvas.height = renderH;
  }
  const offCtx = spectrogramScratchCanvas.getContext("2d");
  if (offCtx) {
    offCtx.putImageData(img, 0, 0);
    ctx.save();
    clipMeterPlotRegion(ctx, plotX, plotY, plotW, plotH, plotRadius);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(spectrogramScratchCanvas, plotX, plotY, plotW, plotH);
    ctx.restore();
  }

  ctx.fillStyle = theme.textMuted;
  ctx.font = `normal 8px ${theme.fontRegular}`;
  ctx.textAlign = "right";
  ctx.fillText(`${snap.spectrogramFftSize} FFT`, plotX + plotW - 4, h - 5);
}

function strokeSpectrumCurve(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
): void {
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
}

function spectrumGradientAtX(
  ctx: CanvasRenderingContext2D,
  plotX: number,
  plotW: number,
  theme: MeterVisualTokens,
): CanvasGradient {
  const g = ctx.createLinearGradient(plotX, 0, plotX + plotW, 0);
  g.addColorStop(0, theme.spectrumBarLow);
  g.addColorStop(0.32, theme.spectrumBarMid);
  g.addColorStop(0.62, theme.spectrumBarHigh);
  g.addColorStop(1, theme.spectrumLine);
  return g;
}

function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ] as const;
  const [r0, g0, b0] = parse(a);
  const [r1, g1, b1] = parse(b);
  const r = Math.round(r0 + (r1 - r0) * t);
  const g = Math.round(g0 + (g1 - g0) * t);
  const bch = Math.round(b0 + (b1 - b0) * t);
  return `rgb(${r},${g},${bch})`;
}

export function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  snap: MeterSnapshot,
  theme: MeterVisualTokens,
  cornerRadius = 0,
): void {
  const { plotX, plotY, plotW, plotH } = drawPlotChrome(
    ctx,
    w,
    h,
    theme,
    "Spectrum",
    `Mel · ${METER_SETTINGS.spectrumTiltDbPerOct} dB · M/S`,
    cornerRadius,
  );

  const plotRadius = resolveMeterPlotRadius(cornerRadius);
  const nyquist = snap.sampleRate * 0.5;
  const minHz = 40;
  const maxHz = Math.min(nyquist, 16000);
  const displayScale = METER_SETTINGS.spectrumDisplayScale;

  const spectrumNormAt = (t: number): number => {
    const hzAt = melNormToHz(t, minHz, maxHz);
    const raw = interpolateSpectrumAtHz(snap.spectrum, hzAt, snap.sampleRate, snap.spectrumFftSize);
    return softCompressDisplay(raw, 0.5) * displayScale;
  };

  ctx.save();
  clipMeterPlotRegion(ctx, plotX, plotY, plotW, plotH, plotRadius);

  /** Style "Both" — thin bars; color from horizontal freq gradient (kept from minimeters bar pass). */
  if (METER_SETTINGS.spectrumStyleBoth) {
    ctx.globalAlpha = METER_SETTINGS.spectrumBarOpacity;
    for (let px = 0; px < plotW; px++) {
      const t = px / Math.max(1, plotW - 1);
      const norm = applyDisplayGamma(spectrumNormAt(t), 1.2);
      const barH = norm * plotH * 0.92;
      const barColor =
        t < 0.32
          ? theme.spectrumBarLow
          : t < 0.62
            ? mixHex(theme.spectrumBarLow, theme.spectrumBarMid, (t - 0.32) / 0.3)
            : t < 0.85
              ? mixHex(theme.spectrumBarMid, theme.spectrumBarHigh, (t - 0.62) / 0.23)
              : mixHex(theme.spectrumBarHigh, theme.spectrumLine, (t - 0.85) / 0.15);
      ctx.fillStyle = barColor;
      ctx.fillRect(plotX + px, plotY + plotH - barH, 1, barH);
    }
    ctx.globalAlpha = 1;
  }

  const curvePoints: { x: number; y: number }[] = [];
  const steps = Math.max(plotW * 2, 256);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const norm = applyDisplayGamma(spectrumNormAt(t), 1.2);
    curvePoints.push({
      x: plotX + t * plotW,
      y: plotY + plotH - norm * plotH,
    });
  }

  ctx.beginPath();
  curvePoints.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.closePath();
  if (METER_SETTINGS.spectrumStyleBoth) {
    /** Minimeters-style fill — horizontal gradient under the trace. */
    ctx.fillStyle = spectrumGradientAtX(ctx, plotX, plotW, theme);
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = theme.spectrumFill;
    ctx.fill();
  }

  ctx.strokeStyle = theme.spectrumFill;
  ctx.lineWidth = 2;
  strokeSpectrumCurve(ctx, curvePoints);
  ctx.strokeStyle = theme.spectrumLine;
  ctx.lineWidth = 1.25;
  strokeSpectrumCurve(ctx, curvePoints);
  ctx.restore();
}

export function drawStereo(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  snap: MeterSnapshot,
  theme: MeterVisualTokens,
  cornerRadius = 0,
): void {
  const { plotX, plotY, plotW, plotH } = drawPlotChrome(
    ctx,
    w,
    h,
    theme,
    "Stereometer",
    "Vectorscope",
    cornerRadius,
  );

  /**
   * Half-circle stereo goniometer. Audio analysis follows polarity/app.vectorscope
   * (real L/R time-domain samples, channel temporal smoothing) but is rendered in
   * a unipolar half-circle anchored at the bottom-centre origin:
   *   angle  = stereo position from the L/R balance — mono → straight up ("mid"),
   *            right-leaning → upper-right, left-leaning → upper-left;
   *   radius = instantaneous level (raw L/R amplitude, fixed audio curve).
   * Faint radial axes (Left / mid / Right) and concentric arcs give the cloud a
   * readable reference frame. Cleared fresh each frame (no trail), single colour.
   */
  const scopeW = plotW - 18;
  const scopeX = plotX;
  const scopeY = plotY;
  const scopeH = plotH;

  const cx = scopeX + scopeW * 0.5;
  const cy = scopeY + scopeH;
  /** Fixed grid + audio-reference disc (Figma layout; never scaled). */
  const gridRadius = Math.max(2, Math.min(scopeW * 0.48, scopeH * 0.96));
  const visualScale = METER_SETTINGS.scopeVisualScale;

  drawStereoGrid(ctx, cx, cy, gridRadius, theme);

  if (snap.hasSignal) {
    const pointSize = METER_SETTINGS.scopePointSize;
    const half = pointSize * 0.5;
    const count = snap.lissajousCount;
    const stride = LISSAJOUS_STRIDE;
    const visRim = gridRadius * METER_SETTINGS.scopeMaxFill * visualScale;
    ctx.fillStyle = theme.primary;
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < count; i++) {
      const base = ((snap.lissajousWrite + i) % count) * stride;
      const l = snap.lissajous[base];
      const r = snap.lissajous[base + 1];
      const mag = Math.hypot(l, r);
      if (mag < 0.006) continue;

      /** Angle in [0, π]: π/2 = mono (up), < π/2 right, > π/2 left. */
      const ang = Math.atan2(Math.abs(l + r), r - l);
      const audioRad = scopeRadiusFromMag(mag, gridRadius);
      const rad = Math.min(visRim, audioRad * visualScale);
      const px = Math.round(cx + Math.cos(ang) * rad);
      const py = Math.round(cy - Math.sin(ang) * rad);

      ctx.fillRect(px - half, py - half, pointSize, pointSize);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Phase-correlation meter. Bottom-anchored bar maps the full correlation
   * range [-1, +1] to its height with a zero (uncorrelated) reference line at
   * the centre: mono/in-phase (+1) fills to the top, decorrelated wide stereo
   * (0) sits at the centre, anti-phase (-1) drops to empty. Negative
   * correlation is flagged in red so out-of-phase content reads correctly.
   */
  const corrX = plotX + plotW - 14;
  const corrY = plotY + 4;
  const corrH = plotH - 8;
  const corr = Math.max(-1, Math.min(1, snap.correlation));
  const centerY = corrY + corrH * 0.5;
  const fillH = ((corr + 1) / 2) * corrH;
  const valueY = corrY + corrH - fillH;

  ctx.fillStyle = theme.correlationTrough;
  ctx.fillRect(corrX, corrY, 10, corrH);

  if (corr >= 0) {
    const grad = ctx.createLinearGradient(0, corrY + corrH, 0, corrY);
    grad.addColorStop(0, theme.tertiary);
    grad.addColorStop(1, theme.primary);
    ctx.fillStyle = grad;
  } else {
    const grad = ctx.createLinearGradient(0, corrY + corrH, 0, centerY);
    grad.addColorStop(0, CORRELATION_NEGATIVE);
    grad.addColorStop(1, CORRELATION_NEGATIVE_SOFT);
    ctx.fillStyle = grad;
  }
  ctx.fillRect(corrX + 1, valueY, 8, fillH);

  /** Zero / uncorrelated reference line at the bar centre. */
  ctx.strokeStyle = theme.gridStrong;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(corrX + 0.5, centerY);
  ctx.lineTo(corrX + 9.5, centerY);
  ctx.stroke();

  ctx.strokeRect(corrX + 0.5, corrY + 0.5, 9, corrH - 1);

  /** Value line (theme accent for in-phase, red for out-of-phase). */
  ctx.strokeStyle = corr >= 0 ? theme.accent : CORRELATION_NEGATIVE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(corrX + 0.5, valueY);
  ctx.lineTo(corrX + 9.5, valueY);
  ctx.stroke();

  /** Validated reference tick from offline audio-analyzer-rs (if loaded). */
  const ref = snap.referenceStereo;
  if (ref) {
    const refCorr = Math.max(-1, Math.min(1, ref.correlationAvg));
    const refY = corrY + corrH - ((refCorr + 1) / 2) * corrH;
    ctx.strokeStyle = theme.text;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(corrX - 2.5, refY);
    ctx.lineTo(corrX - 0.5, refY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = theme.textMuted;
  ctx.font = `normal 8px ${theme.fontRegular}`;
  ctx.textAlign = "center";
  ctx.fillText(
    `W ${Math.round(snap.stereoWidth * 100)}% · C ${Math.round(corr * 100)}%`,
    plotX + plotW * 0.45,
    plotY + plotH + 12,
  );
}

/** Snap a coordinate for crisp 1px canvas strokes (stem-waveform style). */
function snapStrokeCoord(v: number): number {
  return Math.round(v) + 0.5;
}

function waveformBucketX(
  plotX: number,
  plotW: number,
  index: number,
  filled: number,
): number {
  if (filled <= 1) return snapStrokeCoord(plotX);
  return snapStrokeCoord(plotX + (index / (filled - 1)) * plotW);
}

/** Filled band between max/min envelopes (theme.spectrumFill). */
function fillWaveformBand(
  ctx: CanvasRenderingContext2D,
  plotX: number,
  plotW: number,
  centerY: number,
  mins: Float32Array,
  maxs: Float32Array,
  filled: number,
  start: number,
  scale: number,
): void {
  if (filled < 2) return;

  ctx.beginPath();
  for (let i = 0; i < filled; i++) {
    const idx = (start + i) % WAVEFORM_BUCKETS;
    const x = plotX + (i / (filled - 1)) * plotW;
    const y = centerY - maxs[idx] * scale;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = filled - 1; i >= 0; i--) {
    const idx = (start + i) % WAVEFORM_BUCKETS;
    const x = plotX + (i / (filled - 1)) * plotW;
    const y = centerY - mins[idx] * scale;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws one bipolar envelope trace (max or min) as a single continuous path.
 */
function strokeWaveformEnvelope(
  ctx: CanvasRenderingContext2D,
  plotX: number,
  plotW: number,
  centerY: number,
  samples: Float32Array,
  filled: number,
  start: number,
  scale: number,
): void {
  if (filled < 2) return;

  ctx.beginPath();
  for (let i = 0; i < filled; i++) {
    const idx = (start + i) % WAVEFORM_BUCKETS;
    const x = waveformBucketX(plotX, plotW, i, filled);
    const y = snapStrokeCoord(centerY - samples[idx] * scale);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawBipolarBandWave(
  ctx: CanvasRenderingContext2D,
  theme: MeterVisualTokens,
  plotX: number,
  plotY: number,
  plotW: number,
  plotH: number,
  centerY: number,
  mins: Float32Array,
  maxs: Float32Array,
  filled: number,
  start: number,
  peak: number,
  label: string,
): void {
  const scale = (plotH * METER_SETTINGS.waveformBandAmplitude) / peak;

  ctx.fillStyle = theme.text;
  ctx.font = `normal 9px ${theme.fontMedium}`;
  ctx.textAlign = "left";
  ctx.fillText(label, plotX + 4, plotY + 11);

  ctx.save();
  ctx.fillStyle = theme.spectrumFill;
  fillWaveformBand(ctx, plotX, plotW, centerY, mins, maxs, filled, start, scale);

  ctx.strokeStyle = theme.spectrumLine;
  ctx.lineWidth = METER_SETTINGS.waveformLineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  strokeWaveformEnvelope(ctx, plotX, plotW, centerY, maxs, filled, start, scale);
  strokeWaveformEnvelope(ctx, plotX, plotW, centerY, mins, filled, start, scale);
  ctx.restore();

  /** Peak ticks — accent at latest bucket min/max on the right edge */
  if (filled >= 2) {
    const lastIdx = (start + filled - 1) % WAVEFORM_BUCKETS;
    const yPeakT = snapStrokeCoord(centerY - maxs[lastIdx] * scale);
    const yPeakB = snapStrokeCoord(centerY - mins[lastIdx] * scale);
    const tickRight = snapStrokeCoord(plotX + plotW);
    const tickLeft = snapStrokeCoord(plotX + plotW - 3);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = METER_SETTINGS.waveformLineWidth;
    ctx.beginPath();
    ctx.moveTo(tickLeft, yPeakT);
    ctx.lineTo(tickRight, yPeakT);
    ctx.moveTo(tickLeft, yPeakB);
    ctx.lineTo(tickRight, yPeakB);
    ctx.stroke();
  }
}

export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  snap: MeterSnapshot,
  theme: MeterVisualTokens,
  cornerRadius = 0,
): void {
  const { plotX, plotY, plotW, plotH } = drawPlotChrome(
    ctx,
    w,
    h,
    theme,
    "Waveform",
    "Mid / Side",
    cornerRadius,
  );

  const filled = snap.waveformFilled;
  if (filled < 2 && snap.peakLevel < 0.008) {
    ctx.fillStyle = theme.textMuted;
    ctx.font = `normal 11px ${theme.fontRegular}`;
    ctx.textAlign = "center";
    ctx.fillText("Waveform builds while playing", w / 2, h / 2);
    return;
  }

  const start = snap.waveformFilled >= WAVEFORM_BUCKETS ? snap.waveformWrite : 0;
  const peak = snap.waveformScale;
  const midH = plotH * METER_SETTINGS.waveformMidRatio;
  const midCenter = plotY + midH * 0.48;
  const sideCenter = plotY + midH + (plotH - midH) * 0.52;

  drawBipolarBandWave(
    ctx,
    theme,
    plotX,
    plotY,
    plotW,
    midH,
    midCenter,
    snap.waveformMidMin,
    snap.waveformMidMax,
    filled,
    start,
    peak,
    "Mid",
  );

  drawBipolarBandWave(
    ctx,
    theme,
    plotX,
    plotY + midH,
    plotW,
    plotH - midH,
    sideCenter,
    snap.waveformSideMin,
    snap.waveformSideMax,
    filled,
    start,
    peak,
    "Side",
  );
}
