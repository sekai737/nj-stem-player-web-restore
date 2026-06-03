import { useEffect } from "react";
import { usePlayerStore } from "../store/playerStore";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

interface FullscreenKeyboardHandlers {
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  durationSec: number;
}

/** Spicetify-style shortcuts while full-screen is open. */
export function useFullscreenKeyboard(open: boolean, handlers: FullscreenKeyboardHandlers) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const state = usePlayerStore.getState();
      const seekStep = 5;

      switch (e.key) {
        case "Escape": {
          if (state.fullscreenShowConversionPanel) {
            usePlayerStore.setState({ fullscreenShowConversionPanel: false });
            return;
          }

          handlers.onClose();
          return;
        }
        case "f":
        case "F":
          e.preventDefault();
          handlers.onClose();
          return;
        case "t":
        case "T":
          e.preventDefault();
          usePlayerStore.setState({ fullscreenTvMode: !state.fullscreenTvMode });
          return;
        case "c":
        case "C":
          e.preventDefault();
          usePlayerStore.setState({
            fullscreenShowConversionPanel: !state.fullscreenShowConversionPanel,
          });
          return;
        case "l":
        case "L":
          e.preventDefault();
          usePlayerStore.setState({ fullscreenShowLyrics: !state.fullscreenShowLyrics });
          return;
        case " ":
          e.preventDefault();
          handlers.onTogglePlay();
          return;
        case "ArrowLeft":
          e.preventDefault();
          handlers.onSeek(Math.max(0, state.currentTime - seekStep));
          return;
        case "ArrowRight":
          e.preventDefault();
          handlers.onSeek(
            Math.min(handlers.durationSec, state.currentTime + seekStep),
          );
          return;
        case "ArrowUp":
          e.preventDefault();
          usePlayerStore.getState().setMasterVolume(state.masterVolume + 0.05);
          return;
        case "ArrowDown":
          e.preventDefault();
          usePlayerStore.getState().setMasterVolume(state.masterVolume - 0.05);
          return;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handlers]);
}
