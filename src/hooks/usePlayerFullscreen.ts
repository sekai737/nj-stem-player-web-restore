import { useEffect } from "react";
import { usePlayerStore } from "../store/playerStore";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

/** Toggle fullscreen player with F; Escape closes (handled in FullscreenPlayer). */
export function usePlayerFullscreen(enabled: boolean) {
  const fullscreenOpen = usePlayerStore((s) => s.fullscreenOpen);
  const setFullscreenOpen = usePlayerStore((s) => s.setFullscreenOpen);

  useEffect(() => {
    if (!enabled) {
      setFullscreenOpen(false);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "f" && e.key !== "F") return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      const open = usePlayerStore.getState().fullscreenOpen;
      usePlayerStore.getState().setFullscreenOpen(!open);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, setFullscreenOpen]);

  return { fullscreenOpen, setFullscreenOpen };
}
