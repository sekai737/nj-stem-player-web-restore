import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type TransitionEvent,
} from "react";
import { LYRICS_FIGMA } from "../figma/lyricsLayout";
import type { LyricLine } from "../types";
import { isPauseLine } from "../utils/lyricsDisplay";
import LyricIdlingIndicator from "./lyrics/LyricIdlingIndicator";
import LyricText from "./LyricText";
import "./stem-lyrics-panel.css";

const STEP_Y = LYRICS_FIGMA.lyrics.mainLineHeight + LYRICS_FIGMA.lyrics.lineGap;

interface StemLyricsCarouselProps {
  lines: LyricLine[];
  activeIndex: number;
  next?: LyricLine;
  showIdling: boolean;
  idlingProgress: number;
  idlingDelayMs: number;
  onSeek?: (time: number) => void;
}

function hasTextSelection(): boolean {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed);
}

function seekFromPreviewClick(e: MouseEvent<HTMLDivElement>, onSeek?: (time: number) => void) {
  if (!onSeek || hasTextSelection()) return;
  const target = (e.target as HTMLElement).closest<HTMLElement>("[data-seek-time]");
  if (!target) return;
  const time = Number(target.dataset.seekTime);
  if (Number.isFinite(time)) onSeek(time);
}

function seekFromPreviewKey(e: KeyboardEvent, time: number, onSeek?: (time: number) => void) {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  onSeek?.(time);
}

type Phase = "idle" | "push" | "intro";

function previewIndexFor(lines: LyricLine[], activeIndex: number, next?: LyricLine): number | null {
  if (activeIndex < 0) return null;
  if (next) {
    const idx = lines.findIndex(
      (line, i) => i > activeIndex && line.text === next.text && line.time === next.time,
    );
    if (idx >= 0) return idx;
  }
  return activeIndex + 1 < lines.length ? activeIndex + 1 : null;
}

/**
 * Stable main + preview slots; push adds a temporary exit overlay on the same track.
 */
export default function StemLyricsCarousel({
  lines,
  activeIndex,
  next,
  showIdling,
  idlingProgress,
  idlingDelayMs,
  onSeek,
}: StemLyricsCarouselProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [instant, setInstant] = useState(false);
  const [trackY, setTrackY] = useState(0);
  const [active, setActive] = useState(false);

  const [mainIndex, setMainIndex] = useState(activeIndex);
  const [previewIndex, setPreviewIndex] = useState<number | null>(() =>
    previewIndexFor(lines, activeIndex, next),
  );
  const [exitIndex, setExitIndex] = useState<number | null>(null);

  const lastIndexRef = useRef(activeIndex);
  const mountedRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const pushPendingRef = useRef(false);

  const stageStyle = {
    "--stem-lyric-main-h": `${LYRICS_FIGMA.lyrics.mainLineHeight}px`,
    "--stem-lyric-preview-h": `${LYRICS_FIGMA.lyrics.previewLineHeight}px`,
    "--stem-lyric-gap": `${LYRICS_FIGMA.lyrics.lineGap}px`,
  } as CSSProperties;

  const finishPush = useCallback(() => {
    pushPendingRef.current = false;
    setInstant(true);
    setPhase("idle");
    setTrackY(0);
    setActive(false);
    setExitIndex(null);
    requestAnimationFrame(() => setInstant(false));
  }, []);

  const onTrackTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== "transform") return;
      if (event.target !== trackRef.current) return;
      if (!pushPendingRef.current) return;
      finishPush();
    },
    [finishPush],
  );

  useLayoutEffect(() => {
    if (phase !== "push" && phase !== "intro") return;

    const frame = requestAnimationFrame(() => {
      setInstant(false);
      setActive(true);
      if (phase === "push") setTrackY(-STEP_Y);
    });

    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase !== "intro" || !active) return;
    const timer = window.setTimeout(() => setPhase("idle"), 500);
    return () => window.clearTimeout(timer);
  }, [phase, active]);

  useEffect(() => {
    if (activeIndex < 0) {
      lastIndexRef.current = activeIndex;
      setPhase("idle");
      setTrackY(0);
      setActive(false);
      setExitIndex(null);
      pushPendingRef.current = false;
      return;
    }

    if (!mountedRef.current) {
      mountedRef.current = true;
      lastIndexRef.current = activeIndex;
      setMainIndex(activeIndex);
      setPreviewIndex(previewIndexFor(lines, activeIndex, next));
      setInstant(true);
      setPhase("intro");
      setActive(false);
      setTrackY(0);
      return;
    }

    const prev = lastIndexRef.current;
    if (activeIndex === prev) return;

    if (activeIndex !== prev + 1) {
      lastIndexRef.current = activeIndex;
      pushPendingRef.current = false;
      setPhase("idle");
      setTrackY(0);
      setActive(false);
      setExitIndex(null);
      setMainIndex(activeIndex);
      setPreviewIndex(previewIndexFor(lines, activeIndex, next));
      setInstant(true);
      requestAnimationFrame(() => setInstant(false));
      return;
    }

    const outgoing = lines[prev];
    const hadVisiblePreview =
      Boolean(outgoing) && Boolean(lines[activeIndex]) && !isPauseLine(outgoing.text);

    lastIndexRef.current = activeIndex;
    const incoming = previewIndexFor(lines, activeIndex, next);

    if (hadVisiblePreview) {
      pushPendingRef.current = true;
      setInstant(true);
      setPhase("push");
      setActive(false);
      setTrackY(0);
      setExitIndex(prev);
      setMainIndex(activeIndex);
      setPreviewIndex(incoming);
    } else {
      setMainIndex(activeIndex);
      setPreviewIndex(incoming);
      setExitIndex(null);
      setInstant(true);
      setPhase("intro");
      setActive(false);
      setTrackY(0);
    }
  }, [activeIndex, lines, next]);

  const mainLine = lines[mainIndex];
  const previewLine = previewIndex != null ? lines[previewIndex] : undefined;
  const exitLine = exitIndex != null ? lines[exitIndex] : undefined;

  if (showIdling && phase === "idle") {
    return (
      <div className="stem-lyrics-carousel" style={stageStyle}>
        <div className="stem-lyrics-carousel__viewport">
          <LyricIdlingIndicator
            progress={Math.min(1, Math.max(0, idlingProgress))}
            delayMs={idlingDelayMs}
          />
        </div>
      </div>
    );
  }

  const mainClass =
    phase === "push"
      ? "stem-lyrics-carousel__item--push-promote"
      : phase === "intro"
        ? "stem-lyrics-carousel__item--intro"
        : "stem-lyrics-carousel__item--rest-main";

  const previewClass =
    phase === "push" ? "stem-lyrics-carousel__item--push-in" : "stem-lyrics-carousel__item--rest-preview";

  const carouselClass = [
    "stem-lyrics-carousel",
    instant ? "stem-lyrics-carousel--instant" : "",
    phase === "intro" && !active ? "stem-lyrics-carousel--intro-pending" : "",
    phase === "push" && active ? "stem-lyrics-carousel--push-active" : "",
    phase === "intro" && active ? "stem-lyrics-carousel--intro-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={carouselClass}
      style={stageStyle}
      onClick={(e) => seekFromPreviewClick(e, onSeek)}
    >
      <div className="stem-lyrics-carousel__viewport">
        <div
          ref={trackRef}
          className="stem-lyrics-carousel__track"
          style={{
            height: STEP_Y + LYRICS_FIGMA.lyrics.previewLineHeight,
            transform: `translate3d(0, ${trackY}px, 0)`,
          }}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {exitLine && phase === "push" ? (
            <p
              key="slot-exit"
              className="stem-lyrics-carousel__item stem-lyrics-carousel__item--push-out"
              data-copy-block
            >
              <LyricText text={exitLine.text} />
            </p>
          ) : null}

          {mainLine ? (
            <p
              key="slot-main"
              className={`stem-lyrics-carousel__item ${mainClass}`}
              data-copy-block
            >
              <LyricText text={mainLine.text} />
            </p>
          ) : null}

          {previewLine ? (
            <p
              key="slot-preview"
              className={[
                "stem-lyrics-carousel__item",
                previewClass,
                onSeek ? "stem-lyrics-carousel__item--seekable" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-copy-block
              role={onSeek ? "button" : undefined}
              tabIndex={onSeek ? 0 : undefined}
              data-seek-time={onSeek ? previewLine.time : undefined}
              onKeyDown={(e) => seekFromPreviewKey(e, previewLine.time, onSeek)}
            >
              <LyricText text={previewLine.text} />
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
