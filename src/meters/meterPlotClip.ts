import { METER_PLOT_CORNER_RADIUS_PX } from "./meterSettings";

/** Inner corner radius (padding box) — matches `.meter-plot-slot` after its border. */
export function resolveMeterPlotRadius(cornerRadius: number): number {
  return cornerRadius > 0 ? cornerRadius : METER_PLOT_CORNER_RADIUS_PX;
}

export function meterPlotCornerRadiusPx(
  width: number,
  height: number,
  radiusPx: number,
): number {
  return Math.min(Math.max(0, resolveMeterPlotRadius(radiusPx)), width / 2, height / 2);
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radiusPx: number,
): void {
  const r = meterPlotCornerRadiusPx(width, height, radiusPx);
  ctx.beginPath();
  if (r <= 0) {
    ctx.rect(x, y, width, height);
    return;
  }
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function clipMeterPlotCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radiusPx: number,
): void {
  roundRectPath(ctx, 0, 0, width, height, radiusPx);
  ctx.clip();
}

/** Clip the data plot (spectrogram / spectrum / etc.) to rounded bottom corners. */
export function clipMeterPlotRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radiusPx: number,
): void {
  roundRectPath(ctx, x, y, width, height, radiusPx);
  ctx.clip();
}

export function fillRoundedMeterPlot(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radiusPx: number,
  color: string,
): void {
  ctx.fillStyle = color;
  roundRectPath(ctx, 0, 0, width, height, radiusPx);
  ctx.fill();
}

/** Mask bitmap in device pixels (call with identity transform). */
export function maskMeterPlotCanvasDevice(
  ctx: CanvasRenderingContext2D,
  widthPx: number,
  heightPx: number,
  radiusPx: number,
): void {
  const r = meterPlotCornerRadiusPx(widthPx, heightPx, radiusPx);
  if (r <= 0) return;

  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = "#fff";
  roundRectPath(ctx, 0, 0, widthPx, heightPx, r);
  ctx.fill();
  ctx.globalCompositeOperation = prevOp;
}

export function syncMeterPlotWrapClip(
  wrap: HTMLElement,
  canvas: HTMLCanvasElement,
  radiusPx: number,
): void {
  const r = `${resolveMeterPlotRadius(radiusPx)}px`;
  wrap.style.overflow = "hidden";
  wrap.style.borderRadius = r;
  canvas.style.borderRadius = r;
}
