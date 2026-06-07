import { useEffect, useRef, type RefObject } from "react";

function readScale(root: HTMLElement): number {
  return Number.parseFloat(getComputedStyle(root).getPropertyValue("--home-scale")) || 1;
}

interface UseSongSelectRemixScrollOptions {
  rootRef: RefObject<HTMLElement | null>;
  remixOpen: boolean;
  remixScrollExtent: number;
  remixScrollOffset: number;
  setRemixScrollOffset: (value: number | ((prev: number) => number)) => void;
}

/** Wheel/touch scroll clamped to remix panel overflow (design px inside scaled frame). */
export function useSongSelectRemixScroll({
  rootRef,
  remixOpen,
  remixScrollExtent,
  remixScrollOffset,
  setRemixScrollOffset,
}: UseSongSelectRemixScrollOptions) {
  const offsetRef = useRef(remixScrollOffset);
  offsetRef.current = remixScrollOffset;

  useEffect(() => {
    if (!remixOpen) {
      setRemixScrollOffset(0);
    }
  }, [remixOpen, setRemixScrollOffset]);

  useEffect(() => {
    setRemixScrollOffset((prev) => Math.min(prev, remixScrollExtent));
  }, [remixScrollExtent, setRemixScrollOffset]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !remixOpen || remixScrollExtent <= 0) return;

    const clamp = (value: number) =>
      Math.max(0, Math.min(remixScrollExtent, value));

    const applyDelta = (deltaScreenPx: number) => {
      const scale = readScale(root);
      setRemixScrollOffset((prev) => clamp(prev + deltaScreenPx / scale));
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      applyDelta(event.deltaY);
    };

    let touchStartY = 0;
    let touchStartOffset = 0;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      touchStartY = event.touches[0].clientY;
      touchStartOffset = offsetRef.current;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      event.preventDefault();
      const delta = touchStartY - event.touches[0].clientY;
      const scale = readScale(root);
      setRemixScrollOffset(clamp(touchStartOffset + delta / scale));
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
    };
  }, [rootRef, remixOpen, remixScrollExtent, setRemixScrollOffset]);
}

export function measureRemixScrollExtent(
  panel: HTMLElement,
  root: HTMLElement | null,
  scrollOffsetDesign = 0,
): number {
  const scale = root ? readScale(root) : 1;
  const overflowPx = Math.max(0, panel.getBoundingClientRect().bottom - window.innerHeight);
  return Math.ceil(overflowPx / scale + scrollOffsetDesign);
}
