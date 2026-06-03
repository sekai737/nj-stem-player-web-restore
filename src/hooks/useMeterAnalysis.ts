import { useEffect } from "react";
import { getMeterBus } from "../audio/meterBus";
import { processMeterFrame } from "../meters/meterStore";
import { usePlayerStore } from "../store/playerStore";

/** Drives meter analysis at ~30fps from the shared audio bus. */
export function useMeterAnalysis(): void {
  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const bus = getMeterBus();
      if (bus) {
        processMeterFrame(bus, usePlayerStore.getState().isPlaying);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}
