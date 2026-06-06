import { useEffect, type RefObject } from "react";

const DESIGN_W = 1920;
const DESIGN_H = 1080;

function readScale(): number {
  const w = window.visualViewport?.width ?? window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  return Math.round(Math.min(w / DESIGN_W, h / DESIGN_H) * 10000) / 10000;
}

/**
 * Updates --home-scale on the root element via rAF (no React re-renders per tick).
 * Keeps the centered frame and bottom dock in sync during browser zoom / resize.
 */
export function useHomePageScale(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let rafId = 0;

    const apply = () => {
      const node = rootRef.current;
      if (!node) return;
      node.style.setProperty("--home-scale", String(readScale()));
    };

    const schedule = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(apply);
    };

    schedule();
    window.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [rootRef]);
}
