import { useEffect, useRef } from "react";
import { METER_PLOT_CORNER_RADIUS_PX } from "../../meters/meterSettings";
import { getMeterSnapshot } from "../../meters/meterStore";
import {
  clipMeterPlotCanvas,
  maskMeterPlotCanvasDevice,
  resolveMeterPlotRadius,
  syncMeterPlotWrapClip,
} from "../../meters/meterPlotClip";

interface MeterCanvasProps {
  className?: string;
  draw: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dpr: number,
    cornerRadius: number,
  ) => void;
}

export default function MeterCanvas({ className = "", draw }: MeterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let raf = 0;
    const cornerRadius = METER_PLOT_CORNER_RADIUS_PX;
    syncMeterPlotWrapClip(wrap, canvas, cornerRadius);

    const paint = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w <= 0 || h <= 0) {
        raf = requestAnimationFrame(paint);
        return;
      }

      const pw = Math.max(1, Math.floor(w * dpr));
      const ph = Math.max(1, Math.floor(h * dpr));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }

      let offscreen = offscreenRef.current;
      if (!offscreen || offscreen.width !== pw || offscreen.height !== ph) {
        offscreen = document.createElement("canvas");
        offscreen.width = pw;
        offscreen.height = ph;
        offscreenRef.current = offscreen;
      }

      const offCtx = offscreen.getContext("2d", { alpha: true });
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!offCtx || !ctx) {
        raf = requestAnimationFrame(paint);
        return;
      }

      const r = resolveMeterPlotRadius(cornerRadius);
      const radiusDevice = r * dpr;

      offCtx.setTransform(1, 0, 0, 1, 0, 0);
      offCtx.clearRect(0, 0, pw, ph);
      offCtx.save();
      offCtx.scale(dpr, dpr);
      clipMeterPlotCanvas(offCtx, w, h, r);
      drawRef.current(offCtx, w, h, dpr, r);
      offCtx.restore();
      maskMeterPlotCanvasDevice(offCtx, pw, ph, radiusDevice);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pw, ph);
      ctx.drawImage(offscreen, 0, 0);
      void getMeterSnapshot().version;

      raf = requestAnimationFrame(paint);
    };

    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} className="meter-plot-canvas-wrap" aria-hidden>
      <canvas ref={canvasRef} className={`meter-plot-canvas ${className}`.trim()} />
    </div>
  );
}
