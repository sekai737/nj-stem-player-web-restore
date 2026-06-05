import { useEffect, useRef } from "react";
import { METER_PLOT_CORNER_RADIUS_PX } from "../../meters/meterSettings";
import { getMeterSnapshot } from "../../meters/meterStore";

function clipMeterPlotCorners(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const r = Math.min(METER_PLOT_CORNER_RADIUS_PX, width / 2, height / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(0, 0, width, height, r);
  } else {
    ctx.moveTo(r, 0);
    ctx.lineTo(width - r, 0);
    ctx.quadraticCurveTo(width, 0, width, r);
    ctx.lineTo(width, height - r);
    ctx.quadraticCurveTo(width, height, width - r, height);
    ctx.lineTo(r, height);
    ctx.quadraticCurveTo(0, height, 0, height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
  }
  ctx.clip();
}

interface MeterCanvasProps {
  className?: string;
  draw: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dpr: number,
  ) => void;
}

export default function MeterCanvas({ className = "", draw }: MeterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;

    const paint = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        raf = requestAnimationFrame(paint);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w > 0 && h > 0) {
        const pw = Math.floor(w * dpr);
        const ph = Math.floor(h * dpr);
        if (canvas.width !== pw || canvas.height !== ph) {
          canvas.width = pw;
          canvas.height = ph;
          canvas.style.width = `${w}px`;
          canvas.style.height = `${h}px`;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.save();
          clipMeterPlotCorners(ctx, w, h);
          drawRef.current(ctx, w, h, dpr);
          ctx.restore();
          void getMeterSnapshot().version;
        }
      }
      raf = requestAnimationFrame(paint);
    };

    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`meter-plot-canvas block h-full w-full ${className}`}
      aria-hidden
    />
  );
}
