import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MEMBERS } from "../../data/members";
import {
  computeLyricsScrollOffset,
  getAdjustedLyricAnimationIndices,
  getLyricTransitionDuration,
  getLyricsAnimationTempo,
  isLyricPaddingLine,
  parseAnimationTempoSeconds,
} from "../../utils/lyricsAnimation";
import {
  getActiveMergedLyricIndex,
  getVisibleLyricWindow,
  isPauseLine,
  resolveLyricLineDisplay,
} from "../../utils/lyricsDisplay";
import type { LyricsViewSettings, MergedLyricLine } from "../../types/lyricsPlus";
import { usePlayerStore } from "../../store/playerStore";
import LyricText from "../LyricText";
import LyricIdlingIndicator from "./LyricIdlingIndicator";
import "./synced-lyrics.css";

const LONG_PAUSE_MS = 8000;

export type SyncedLyricsVariant = "in-player" | "fullscreen";

interface SyncedLyricsDisplayProps {
  lines: MergedLyricLine[];
  loading: boolean;
  error: string | null;
  settings: LyricsViewSettings;
  visible?: boolean;
  variant?: SyncedLyricsVariant;
  onSeek?: (time: number) => void;
  className?: string;
  bpm?: number;
  textAlign?: "left" | "center" | "right";
}

function findNextLineStartMs(lines: MergedLyricLine[], fromIndex: number): number | null {
  for (let j = fromIndex + 1; j < lines.length; j++) {
    if (!isPauseLine(lines[j]?.original)) {
      return lines[j]!.startTimeMs;
    }
  }
  return null;
}

export default function SyncedLyricsDisplay({
  lines,
  loading,
  error,
  settings,
  visible = true,
  variant = "fullscreen",
  onSeek,
  className = "",
  bpm,
  textAlign,
}: SyncedLyricsDisplayProps) {
  const isFullscreen = variant === "fullscreen";
  const align = textAlign ?? (isFullscreen ? "center" : "left");
  const currentTime = usePlayerStore((s) => s.currentTime);
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const activeIndex = useMemo(
    () => (loading || error ? -1 : getActiveMergedLyricIndex(lines, currentTime)),
    [lines, currentTime, loading, error],
  );

  const linesBefore = isFullscreen ? settings.linesBefore : 0;
  const linesAfter = settings.linesAfter;

  const { displayLines, activeDisplayIndex } = useMemo(() => {
    if (!isFullscreen || activeIndex < 0) {
      return { displayLines: lines, activeDisplayIndex: activeIndex };
    }
    const win = getVisibleLyricWindow(lines, activeIndex, linesBefore, linesAfter);
    return { displayLines: win.lines, activeDisplayIndex: win.activeWindowIndex };
  }, [lines, activeIndex, isFullscreen, linesBefore, linesAfter]);

  const animationIndices = useMemo(
    () =>
      isFullscreen && activeDisplayIndex >= 0 && displayLines.length > 0
        ? getAdjustedLyricAnimationIndices(displayLines, activeDisplayIndex)
        : [],
    [displayLines, activeDisplayIndex, isFullscreen],
  );

  const animationTempo = useMemo(
    () => (isFullscreen ? getLyricsAnimationTempo(bpm) : "0.25s"),
    [bpm, isFullscreen],
  );
  const tempoSec = useMemo(() => parseAnimationTempoSeconds(animationTempo), [animationTempo]);

  const measureScroll = () => {
    if (!isFullscreen) return;
    const viewport = viewportRef.current;
    const activeEl = activeLineRef.current;
    if (!viewport || !activeEl) return;
    setScrollOffset(
      computeLyricsScrollOffset(
        viewport.clientHeight,
        activeEl.offsetTop,
        activeEl.offsetHeight,
      ),
    );
  };

  useLayoutEffect(() => {
    if (!isFullscreen || !visible || activeDisplayIndex < 0) {
      setScrollOffset(0);
      return;
    }
    measureScroll();
  }, [activeDisplayIndex, displayLines, lines, loading, error, visible, isFullscreen]);

  useLayoutEffect(() => {
    if (!isFullscreen) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const ro = new ResizeObserver(() => measureScroll());
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [activeDisplayIndex, visible, isFullscreen]);

  if (!visible) {
    return (
      <section className={`synced-lyrics synced-lyrics--hidden ${className}`.trim()} aria-hidden>
        <p className="synced-lyrics__message">Lyrics hidden (L)</p>
      </section>
    );
  }

  const blurEnabled = isFullscreen && settings.fadeBlur;
  const linesStyle: CSSProperties | undefined = isFullscreen
    ? {
        transform: `translate3d(0, ${scrollOffset}px, 0)`,
        transitionDuration: getLyricTransitionDuration(0, tempoSec),
      }
    : undefined;

  return (
    <section
      className={[
        "synced-lyrics",
        isFullscreen ? "synced-lyrics--fullscreen" : "",
        blurEnabled ? "synced-lyrics--blur" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Synced lyrics"
      style={{ "--lyrics-align-text": align } as CSSProperties}
    >
      <div className="synced-lyrics__viewport">
        <div className="synced-lyrics__scroll" ref={viewportRef}>
          {loading ? (
            <p className="synced-lyrics__message">Loading lyrics…</p>
          ) : error ? (
            <p className="synced-lyrics__message">{error}</p>
          ) : displayLines.length === 0 ? (
            <p className="synced-lyrics__message">No lyrics for this track.</p>
          ) : (
            <div className="synced-lyrics__lines" style={linesStyle}>
              {displayLines.map((line, i) => {
                const animationIndex = animationIndices[i] ?? 0;
                const isFocused = i === activeDisplayIndex;
                const pause = isPauseLine(line.original);
                const globalIndex = lines.findIndex((l) => l.id === line.id);
                const isPast = globalIndex >= 0 && globalIndex < activeIndex;
                const paddingLine =
                  isFullscreen &&
                  isLyricPaddingLine(animationIndex, linesBefore, linesAfter);
                const { primary, secondary } = resolveLyricLineDisplay(line, settings);
                const member = MEMBERS[line.member];
                const showPerformer =
                  settings.showPerformers &&
                  isFocused &&
                  (i === 0 || displayLines[i - 1]?.member !== line.member);

                const nextStartMs =
                  globalIndex >= 0 ? findNextLineStartMs(lines, globalIndex) : null;
                const pauseStartMs = line.startTimeMs;
                const pauseDurationMs =
                  nextStartMs != null ? nextStartMs - pauseStartMs : 0;
                const showIdling =
                  isFocused && pause && pauseDurationMs >= LONG_PAUSE_MS;
                const idlingProgress =
                  pauseDurationMs > 0
                    ? (currentTime * 1000 - pauseStartMs) / pauseDurationMs
                    : 0;
                const idlingDelay = pauseDurationMs / 3;

                const blurPx =
                  blurEnabled && !isFocused && !isPast && !paddingLine
                    ? Math.abs(animationIndex) * 1.5
                    : 0;

                const lineStyle: CSSProperties = isFullscreen
                  ? { transitionDuration: getLyricTransitionDuration(animationIndex, tempoSec) }
                  : {};

                const textStyle: CSSProperties | undefined =
                  blurPx > 0 ? { filter: `blur(${blurPx}px)` } : undefined;

                const classNames = [
                  "synced-lyrics__line",
                  isFocused ? "synced-lyrics__line--active" : "",
                  isPast ? "synced-lyrics__line--past" : "",
                  paddingLine ? "synced-lyrics__line--padding" : "",
                  pause && !isFocused && !showIdling ? "synced-lyrics__line--hidden" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                if (pause && !isFocused && !showIdling) {
                  return (
                    <div
                      key={line.id}
                      className={classNames}
                      style={lineStyle}
                      aria-hidden
                    />
                  );
                }

                return (
                  <div
                    key={line.id}
                    ref={isFocused ? activeLineRef : undefined}
                    className={classNames}
                    style={lineStyle}
                    role={onSeek ? "button" : undefined}
                    tabIndex={onSeek && !paddingLine ? 0 : undefined}
                    onClick={() => !paddingLine && onSeek?.(line.time)}
                    onKeyDown={(e) => {
                      if (paddingLine || !onSeek) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSeek(line.time);
                      }
                    }}
                  >
                    {showPerformer && (
                      <span className="synced-lyrics__performer">{member.name}</span>
                    )}
                    {showIdling ? (
                      <LyricIdlingIndicator
                        progress={Math.min(1, Math.max(0, idlingProgress))}
                        delayMs={idlingDelay}
                      />
                    ) : (
                      <>
                        <p
                          className={`synced-lyrics__primary ${isFocused ? "lyric-line-main" : "lyric-line-preview"}`}
                          style={textStyle}
                        >
                          <LyricText text={primary} />
                        </p>
                        {secondary && (
                          <p className="synced-lyrics__secondary lyric-line-preview" style={textStyle}>
                            <LyricText text={secondary} />
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}