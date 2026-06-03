import type { MergedLyricLine } from "../types/lyricsPlus";
import { isPauseLine } from "./lyricsDisplay";

/** lyrics-plus `fetchTempo` — animation stagger scales with track BPM. */
export function getLyricsAnimationTempo(bpm?: number): string {
  const MIN_TEMPO = 60;
  const MAX_TEMPO = 150;
  const MAX_PERIOD = 0.4;

  let tempo = bpm ?? 105;
  if (tempo < MIN_TEMPO) tempo = MIN_TEMPO;
  if (tempo > MAX_TEMPO) tempo = MAX_TEMPO;

  const period =
    Math.round(
      (MAX_PERIOD - ((tempo - MIN_TEMPO) / (MAX_TEMPO - MIN_TEMPO)) * MAX_PERIOD) * 100,
    ) / 100;

  return `${period}s`;
}

export function parseAnimationTempoSeconds(tempo: string): number {
  const n = parseFloat(tempo);
  return Number.isFinite(n) && n > 0 ? n : 0.25;
}

/** Pixel transform — browsers interpolate explicit translate values reliably. */
export function getLyricLineTransform(
  animationIndex: number,
  lineHeightPx: number,
  scrollOffsetPx: number,
  active: boolean,
): string {
  const y = animationIndex * lineHeightPx + scrollOffsetPx;
  return active
    ? `translate3d(0, ${y}px, 0) scale(1.1)`
    : `translate3d(0, ${y}px, 0)`;
}

export function getLyricTransitionDuration(
  animationIndex: number,
  tempoSec: number,
): string {
  const staggerIndex = (animationIndex < 0 ? 0 : animationIndex) + 1;
  return `${staggerIndex * tempoSec + 0.1}s`;
}

/** lyrics-plus SyncedLyricsPage `adjustedAnimationIndices`. */
export function getAdjustedLyricAnimationIndices(
  activeLines: MergedLyricLine[],
  activeElementIndex: number,
): number[] {
  const indices = new Array<number>(activeLines.length);

  let currentIndex = 0;
  for (let j = activeElementIndex; j < activeLines.length; j++) {
    indices[j] = currentIndex;
    if (!isPauseLine(activeLines[j]?.original) || j === activeElementIndex) {
      currentIndex++;
    }
  }

  currentIndex = -1;
  for (let j = activeElementIndex - 1; j >= 0; j--) {
    indices[j] = currentIndex;
    if (!isPauseLine(activeLines[j]?.original)) {
      currentIndex--;
    }
  }

  return indices;
}

/** lyrics-plus padding lines outside lines-before / lines-after window. */
export function isLyricPaddingLine(
  animationIndex: number,
  linesBefore: number,
  linesAfter: number,
): boolean {
  return (
    (animationIndex < 0 && -animationIndex > linesBefore) ||
    animationIndex > linesAfter
  );
}

/** Center active line in viewport (SyncedLyrics `--offset`). */
export function computeLyricsScrollOffset(
  containerHeight: number,
  activeTop: number,
  activeHeight: number,
): number {
  const center = containerHeight / 2;
  return center - (activeTop + activeHeight / 2);
}

/** Pin active line to top of viewport; preview lines sit below only. */
export function computeLyricsScrollOffsetTop(
  activeTop: number,
  paddingTop = 0,
): number {
  return paddingTop - activeTop;
}
