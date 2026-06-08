import { useLayoutEffect, type RefObject } from "react";
import { FIGMA_FULLSCREEN as FS } from "../figma/fullscreenLayout";

/**
 * Scale factor for cluster/card UI — fills viewport using Figma 1800×956 proportions
 * (no cap at 1; scales up on large screens so content hugs the edges).
 */
function readUiScale(): number {
  const w = window.visualViewport?.width ?? window.innerWidth;
  const h = window.visualViewport?.height ?? window.innerHeight;
  const sx = w / FS.frame.width;
  const sy = (h - FS.header.height - FS.footer.height) / FS.main.usableHeight;
  return Math.round(Math.min(sx, sy) * 10000) / 10000;
}

export function useFullscreenScale(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useLayoutEffect(() => {
    if (!enabled) return;

    let rafId = 0;

    const apply = () => {
      const node = rootRef.current;
      if (!node) return;
      node.style.setProperty("--fs-ui-scale", String(readUiScale()));
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
  }, [rootRef, enabled]);
}
