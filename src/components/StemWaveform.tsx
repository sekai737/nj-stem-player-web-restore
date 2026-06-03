import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import type { StemId } from "../types";
import { usePlayerStore } from "../store/playerStore";

interface StemWaveformProps {
  stemId: StemId;
  /** Fallback URL when peaks are unavailable (e.g. small MP3 demos). */
  src: string;
  onSeek: (time: number) => void;
  disabled?: boolean;
}

const WAVE_COLOR = "rgba(0, 0, 0, 0.35)";
const WAVE_PROGRESS = "#000000";
const WAVE_HEIGHT = 80;

export default function StemWaveform({ stemId, src, onSeek, disabled = false }: StemWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const peaks = usePlayerStore((s) => s.stemPeaks[stemId]);
  const stemsLoading = usePlayerStore((s) => s.stemsLoading);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || stemsLoading) return;

    setIsLoading(true);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: WAVE_HEIGHT,
      waveColor: WAVE_COLOR,
      progressColor: WAVE_PROGRESS,
      cursorColor: WAVE_PROGRESS,
      barWidth: 2,
      barGap: 2,
      normalize: true,
      interact: !disabled,
    });

    const onReady = () => setIsLoading(false);
    const onError = (err: unknown) => {
      console.warn("[waveform]", stemId, err);
      setIsLoading(false);
    };

    const onInteraction = () => {
      if (!disabled) onSeek(ws.getCurrentTime());
    };
    const onDoubleClick = () => {
      if (disabled) return;
      onSeek(0);
      ws.seekTo(0);
    };

    ws.on("ready", onReady);
    ws.on("error", onError);
    ws.on("interaction", onInteraction);
    ws.on("dblclick", onDoubleClick);

    wsRef.current = ws;

    const load = async () => {
      try {
        if (peaks && peaks.length > 0 && duration > 0) {
          await ws.load("", [peaks], duration);
          return;
        }
        if (/\.flac$/i.test(src)) {
          setIsLoading(false);
          return;
        }
        await ws.load(src);
      } catch (err) {
        onError(err);
      }
    };

    void load();

    return () => {
      ws.un("ready", onReady);
      ws.un("error", onError);
      ws.un("interaction", onInteraction);
      ws.un("dblclick", onDoubleClick);
      ws.destroy();
      wsRef.current = null;
    };
  }, [src, stemId, peaks, duration, stemsLoading, onSeek, disabled]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !duration || isLoading) return;
    const progress = currentTime / duration;
    if (Math.abs(ws.getCurrentTime() - currentTime) > 0.15) {
      ws.seekTo(Math.min(1, Math.max(0, progress)));
    }
  }, [currentTime, duration, isLoading]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-cr bg-stem-waveform ${disabled ? "opacity-60" : ""}`}
      style={{ height: WAVE_HEIGHT }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          role="status"
          aria-label="Loading waveform"
        >
          <div
            className="size-5 animate-spin rounded-full border-2 border-content-secondary/25 border-t-content-primary"
            aria-hidden
          />
        </div>
      )}
      <div ref={containerRef} className="size-full" />
    </div>
  );
}
