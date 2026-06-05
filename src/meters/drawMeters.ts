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
import { METER_SETTINGS } from "./meterSettings";
import type { MeterVisualTokens } from "./meterVisualThemes";

let spectrogramScratchCanvas: HTMLCanvasElement | null = null;
let spectrogramScratchW = 0;
let spectrogramScratchH = 0;

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
): { plotX: number; plotY: number; plotW: number; plotH: number } {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = theme.plotWell;
  ctx.fillRect(0, 0, w, h);

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
): void {
  const { plotX, plotY, plotW, plotH } = drawPlotChrome(
    ctx,
    w,
    h,
    theme,
    "Spectrogram",
    `Horizontal · ${spanSeconds}s`,
  );

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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(spectrogramScratchCanvas, plotX, plotY, plotW, plotH);
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
): void {
  const { plotX, plotY, plotW, plotH } = drawPlotChrome(
    ctx,
    w,
    h,
    theme,
    "Spectrum",
    `Mel · ${METER_SETTINGS.spectrumTiltDbPerOct} dB · M/S`,
  );

  const nyquist = snap.sampleRate * 0.5;
  const minHz = 40;
  const maxHz = Math.min(nyquist, 16000);
  const displayScale = METER_SETTINGS.spectrumDisplayScale;

  const spectrumNormAt = (t: number): number => {
    const hzAt = melNormToHz(t, minHz, maxHz);
    const raw = interpolateSpectrumAtHz(snap.spectrum, hzAt, snap.sampleRate, snap.spectrumFftSize);
    return softCompressDisplay(raw, 0.5) * displayScale;
  };

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
}

export function drawStereo(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  snap: MeterSnapshot,
  theme: MeterVisualTokens,
): void {
  const { plotX, plotY, plotW, plotH } = drawPlotChrome(
    ctx,
    w,
    h,
    theme,
    "Stereometer",
    "Lissajous",
  );

  const scopeW = plotW - 22;
  const scopeH = plotH - 4;
  const scopeX = plotX + 2;
  const scopeY = plotY + 2;
  const cx = scopeX + scopeW * 0.5;
  const cy = scopeY + scopeH;
  const radius = Math.min(scopeW * 0.48, scopeH * 0.92);
  const pointSize = METER_SETTINGS.scopePointSize;

  const count = snap.lissajousCount;
  const stride = LISSAJOUS_STRIDE;
  const peak = snap.scopePeak;

  for (let i = 0; i < count; i++) {
    const idx = (snap.lissajousWrite + i) % count;
    const base = idx * stride;
    const l = snap.lissajous[base];
    const rch = snap.lissajous[base + 1];
    const lN = l / peak;
    const rN = rch / peak;
    const sum = Math.abs(lN) + Math.abs(rN);
    if (sum < 0.04) continue;

    const pan = Math.max(-1, Math.min(1, (rN - lN) / (sum + 1e-6)));
    const energy = Math.min(1, sum * 0.5);
    const angle = Math.PI * (0.5 - pan * 0.5);
    const rad = energy * radius;
    const px = cx + Math.cos(angle) * rad;
    const py = cy - Math.sin(angle) * rad;

    ctx.fillStyle = theme.primary;
    ctx.beginPath();
    ctx.arc(px, py, pointSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const corrX = plotX + plotW - 14;
  const corrY = plotY + 4;
  const corrH = plotH - 8;
  ctx.fillStyle = theme.correlationTrough;
  ctx.fillRect(corrX, corrY, 10, corrH);
  const corr = Math.max(0, snap.correlation);
  const fillH = corr * corrH;
  const grad = ctx.createLinearGradient(0, corrY + corrH, 0, corrY);
  grad.addColorStop(0, theme.tertiary);
  grad.addColorStop(1, theme.primary);
  ctx.fillStyle = grad;
  ctx.fillRect(corrX + 1, corrY + corrH - fillH, 8, fillH);
  ctx.strokeStyle = theme.gridStrong;
  ctx.lineWidth = 1;
  ctx.strokeRect(corrX + 0.5, corrY + 0.5, 9, corrH - 1);

  /** Peak line on correlation meter (theme accent) */
  if (corr > 0.02) {
    const peakY = corrY + corrH - fillH;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(corrX + 0.5, peakY);
    ctx.lineTo(corrX + 9.5, peakY);
    ctx.stroke();
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

  for (let i = 0; i < filled - 1; i++) {
    const idx0 = (start + i) % WAVEFORM_BUCKETS;
    const idx1 = (start + i + 1) % WAVEFORM_BUCKETS;
    const x0 = plotX + (i / (filled - 1)) * plotW;
    const x1 = plotX + ((i + 1) / (filled - 1)) * plotW;

    const yTop0 = centerY - maxs[idx0] * scale;
    const yBot0 = centerY - mins[idx0] * scale;
    const yTop1 = centerY - maxs[idx1] * scale;
    const yBot1 = centerY - mins[idx1] * scale;

    ctx.fillStyle = theme.spectrumFill;
    ctx.beginPath();
    ctx.moveTo(x0, yTop0);
    ctx.lineTo(x1, yTop1);
    ctx.lineTo(x1, yBot1);
    ctx.lineTo(x0, yBot0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = theme.spectrumLine;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x0, yTop0);
    ctx.lineTo(x1, yTop1);
    ctx.moveTo(x0, yBot0);
    ctx.lineTo(x1, yBot1);
    ctx.stroke();
  }

  /** Peak ticks — accent at latest bucket min/max on the right edge */
  if (filled >= 2) {
    const lastIdx = (start + filled - 1) % WAVEFORM_BUCKETS;
    const yPeakT = centerY - maxs[lastIdx] * scale;
    const yPeakB = centerY - mins[lastIdx] * scale;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(plotX + plotW - 3, yPeakT - 1);
    ctx.lineTo(plotX + plotW, yPeakT - 1);
    ctx.moveTo(plotX + plotW - 3, yPeakB + 1);
    ctx.lineTo(plotX + plotW, yPeakB + 1);
    ctx.stroke();
  }
}

export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  snap: MeterSnapshot,
  theme: MeterVisualTokens,
): void {
  const { plotX, plotY, plotW, plotH } = drawPlotChrome(
    ctx,
    w,
    h,
    theme,
    "Waveform",
    "Mid / Side",
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
