import { useEffect, useRef } from "react";
import { getMeterSnapshot } from "../../meters/meterStore";

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
          drawRef.current(ctx, w, h, dpr);
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
      className={`block h-full w-full ${className}`}
      aria-hidden
    />
  );
}
