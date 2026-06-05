import { useEffect, useRef, useState, type MouseEvent } from "react";
import WaveSurfer from "wavesurfer.js";
import {
  disableWaveSurferProgress,
  GGD_WAVESURFER_OPTIONS,
  setPlayheadPosition,
} from "../audio/ggdMediaPlayer";
import { getStemWaveformTraceColor } from "../figma/stemWaveformTokens";
import type { StemId } from "../types";
import { usePlayerStore } from "../store/playerStore";
import { FIGMA } from "../figma/layout";
import "./ggd-waveform.css";

interface StemWaveformProps {
  stemId: StemId;
  /** Fallback URL when peaks are unavailable (e.g. small MP3 demos). */
  src: string;
  onSeek: (time: number) => void;
  disabled?: boolean;
  /** Catalog duration — playhead works before decode finishes. */
  fallbackDurationSec?: number;
}

const WAVE_HEIGHT = FIGMA.stems.waveformHeight;

export default function StemWaveform({
  stemId,
  src,
  onSeek,
  disabled = false,
  fallbackDurationSec = 0,
}: StemWaveformProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const storeDuration = usePlayerStore((s) => s.duration);
  const peaks = usePlayerStore((s) => s.stemPeaks[stemId]);
  const stemsLoading = usePlayerStore((s) => s.stemsLoading);
  const [isLoading, setIsLoading] = useState(true);

  const duration = storeDuration > 0 ? storeDuration : fallbackDurationSec;

  useEffect(() => {
    if (!waveformRef.current || stemsLoading) return;

    setIsLoading(true);

    const traceColor = getStemWaveformTraceColor();
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      height: WAVE_HEIGHT,
      waveColor: traceColor,
      progressColor: traceColor,
      ...GGD_WAVESURFER_OPTIONS,
      interact: false,
    });

    const onReady = () => {
      disableWaveSurferProgress(waveformRef.current);
      setIsLoading(false);
    };
    const onRedraw = () => disableWaveSurferProgress(waveformRef.current);
    const onError = (err: unknown) => {
      console.warn("[waveform]", stemId, err);
      setIsLoading(false);
    };

    ws.on("ready", onReady);
    ws.on("error", onError);
    ws.on("redraw", onRedraw);
    wsRef.current = ws;

    const load = async () => {
      try {
        const loadDuration = storeDuration > 0 ? storeDuration : fallbackDurationSec;
        if (peaks && peaks.length > 0 && loadDuration > 0) {
          await ws.load("", [peaks], loadDuration);
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
      ws.un("redraw", onRedraw);
      ws.destroy();
      wsRef.current = null;
    };
  }, [src, stemId, peaks, storeDuration, fallbackDurationSec, stemsLoading]);

  /**
   * GGD updateTimeline() — direct DOM playhead position, snapped to whole pixels.
   */
  useEffect(() => {
    if (!duration) return;

    let active = true;
    let frame = 0;

    const updatePlayhead = () => {
      const time = usePlayerStore.getState().currentTime;
      setPlayheadPosition(playheadRef.current, outerRef.current, time / duration);
    };

    const tick = () => {
      if (!active) return;
      updatePlayhead();
      frame = requestAnimationFrame(tick);
    };

    const observer =
      outerRef.current &&
      new ResizeObserver(() => {
        updatePlayhead();
      });
    if (observer && outerRef.current) observer.observe(outerRef.current);

    frame = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [duration]);

  const seekFromClientX = (clientX: number) => {
    if (disabled || !duration || !outerRef.current) return;
    const rect = outerRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    seekFromClientX(event.clientX);
  };

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    onSeek(0);
    setPlayheadPosition(playheadRef.current, outerRef.current, 0);
  };

  return (
    <div
      ref={outerRef}
      id={`progress-bar-outer-${stemId}`}
      className={`ggd-waveform progress-bar-outer ${disabled ? "ggd-waveform--disabled" : ""}`}
      style={{ height: WAVE_HEIGHT }}
      role="slider"
      aria-label={`${stemId} waveform`}
      aria-valuemin={0}
      aria-valuemax={duration || 0}
      aria-disabled={disabled}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Progress bar for track position — GGD: width-only updates on #progress-bar-inner */}
      <div ref={playheadRef} id={`progress-bar-inner-${stemId}`} className="progress-bar-inner" />

      <div className="wave-set visible" aria-hidden>
        <div ref={waveformRef} className="waveform visible" />
      </div>

      {isLoading && (
        <div className="ggd-waveform__loading" role="status" aria-label="Loading waveform">
          <div className="ggd-waveform__spinner" aria-hidden />
        </div>
      )}
    </div>
  );
}
