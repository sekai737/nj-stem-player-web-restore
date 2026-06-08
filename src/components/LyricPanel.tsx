import { useMemo, type CSSProperties } from "react";
import { MEMBERS } from "../data/members";
import { LYRICS_FIGMA } from "../figma/lyricsLayout";
import { FIGMA } from "../figma/layout";
import { useLyrics } from "../hooks/useLyrics";
import { shouldShowMemberLyrics, getActiveLyricIndex, getNextLyric } from "../utils/lyrics";
import { isPauseLine } from "../utils/lyricsDisplay";
import type { LyricLine, SongLrcFiles } from "../types";
import { usePlayerStore } from "../store/playerStore";
import LanguageOptionsBox from "./LanguageOptionsBox";
import MemberLyricsBox from "./MemberLyricsBox";
import SelectableCopyRegion from "./SelectableCopyRegion";
import StemLyricsCarousel from "./StemLyricsCarousel";
import "./selectable-copy-stem.css";
import "./stem-lyrics-panel.css";

const LONG_PAUSE_SEC = 8;

interface LyricPanelProps {
  lrc?: SongLrcFiles;
  fontsReady?: boolean;
  onSeek?: (time: number) => void;
  lyricsWidth?: number;
  lyricsMarginLeft?: number;
}

function findNextSungTime(lyrics: LyricLine[], fromIndex: number): number | null {
  for (let i = fromIndex + 1; i < lyrics.length; i++) {
    if (!isPauseLine(lyrics[i]?.text)) return lyrics[i]!.time;
  }
  return null;
}

/**
 * Figma lyrics column (node 26:214) — active line + one preview below.
 * Carousel motion on line advance; fadeDo on first paint / seek snap.
 */
export default function LyricPanel({
  lrc,
  fontsReady = true,
  onSeek,
  lyricsWidth = FIGMA.titleRow.lyricsWidth,
  lyricsMarginLeft = -FIGMA.titleRow.titleLyricsOverlap,
}: LyricPanelProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const { lines, loading, error } = useLyrics(lrc);

  const activeIndex = useMemo(
    () => (loading || error ? -1 : getActiveLyricIndex(lines, currentTime)),
    [lines, currentTime, loading, error],
  );
  const active = activeIndex >= 0 ? lines[activeIndex] : undefined;
  const next = !loading && !error ? getNextLyric(lines, currentTime) : undefined;
  const showMember =
    !loading && !error && lines.length > 0 && shouldShowMemberLyrics(lines, currentTime);
  const memberSource = showMember && active ? active : lines[1] ?? lines[0];
  const member = memberSource ? MEMBERS[memberSource.member] : MEMBERS.group;

  const pauseDurationSec =
    active && activeIndex >= 0
      ? (findNextSungTime(lines, activeIndex) ?? 0) - active.time
      : 0;
  const showIdling =
    Boolean(active) &&
    isPauseLine(active.text) &&
    pauseDurationSec >= LONG_PAUSE_SEC &&
    currentTime >= active.time;
  const idlingProgress =
    showIdling && pauseDurationSec > 0
      ? (currentTime - active!.time) / pauseDurationSec
      : 0;
  const idlingDelayMs = showIdling ? (pauseDurationSec * 1000) / 3 : 0;

  return (
    <section
      className="figma-surface flex shrink-0 items-center overflow-visible"
      style={{
        width: lyricsWidth,
        height: FIGMA.titleRow.lyricsHeight,
        marginLeft: lyricsMarginLeft,
        gap: LYRICS_FIGMA.container.gap,
        paddingLeft: LYRICS_FIGMA.container.paddingX,
        paddingRight: LYRICS_FIGMA.container.paddingX,
        paddingTop: LYRICS_FIGMA.container.paddingY,
        paddingBottom: LYRICS_FIGMA.container.paddingY,
        borderRadius: LYRICS_FIGMA.container.radius,
      }}
    >
      <MemberLyricsBox
        portrait={member.emojiIcon}
        name={member.name.toUpperCase()}
        loading={loading}
        fontsReady={fontsReady}
        visible={showMember}
      />

      <SelectableCopyRegion
        copyLabel="Lyrics"
        className="stem-lyrics-copy flex min-w-0 flex-1 flex-col items-center justify-center overflow-visible text-center"
        regionClassName="flex w-full flex-col items-center justify-center overflow-visible text-center"
        enablePointerCapture={!onSeek}
      >
        {loading ? (
          <p className="lyric-line-main stem-lyrics-panel__line" data-copy-block>
            Loading lyrics…
          </p>
        ) : error ? (
          <p className="lyric-line-preview stem-lyrics-panel__line" data-copy-block>
            {error}
          </p>
        ) : active ? (
          <StemLyricsCarousel
            lines={lines}
            activeIndex={activeIndex}
            next={next}
            showIdling={showIdling}
            idlingProgress={idlingProgress}
            idlingDelayMs={idlingDelayMs}
            onSeek={onSeek}
          />
        ) : (
          <p className="lyric-line-preview stem-lyrics-panel__line" data-copy-block>
            {lines.length > 0 ? "…" : "No lyrics for this language."}
          </p>
        )}
      </SelectableCopyRegion>

      <LanguageOptionsBox lrc={lrc} />
    </section>
  );
}
