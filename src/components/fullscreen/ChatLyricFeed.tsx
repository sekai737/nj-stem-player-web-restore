import { useEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent } from "react";
import SelectableCopyRegion from "../SelectableCopyRegion";
import { FULLSCREEN_CHAT_OPENER, MEMBERS } from "../../data/members";
import RightChatMessage from "./RightChatMessage";
import { figmaAssets } from "../../figma/assets";
import { FIGMA_FULLSCREEN as FS } from "../../figma/fullscreenLayout";
import { getActiveMergedLyricIndex } from "../../utils/lyricsDisplay";
import { formatFullscreenChatSongTitle } from "../../utils/displayTrackTitle";
import { formatLyricTimestamp, getLyricBubbleLines } from "../../utils/fullscreenLyrics";
import { useSmoothScrollContainer } from "../../hooks/useSmoothScrollContainer";
import LyricText from "../LyricText";
import { hasDisplayableLyricContent } from "../../utils/mergeLyrics";
import type { LyricLanguage } from "../../types";
import type { MergedLyricLine } from "../../types/lyricsPlus";
import { usePlayerStore } from "../../store/playerStore";
import "./fullscreen-lyric-feed.css";

interface ChatLyricFeedProps {
  songTitle: string;
  lines: MergedLyricLine[];
  loading: boolean;
  error: string | null;
  language: LyricLanguage;
  onSeek?: (time: number) => void;
}

function hasTextSelection(): boolean {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed);
}

function seekFromFeedClick(e: MouseEvent<HTMLDivElement>, onSeek?: (time: number) => void) {
  if (!onSeek || hasTextSelection()) return;
  const bubble = (e.target as HTMLElement).closest<HTMLElement>("[data-seek-time]");
  if (!bubble) return;
  const time = Number(bubble.dataset.seekTime);
  if (Number.isFinite(time)) onSeek(time);
}

function seekFromBubbleKey(e: KeyboardEvent, time: number, onSeek?: (time: number) => void) {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  onSeek?.(time);
}

function SongTitleChatMessage({
  label,
  onSeek,
}: {
  label: string;
  onSeek?: (time: number) => void;
}) {
  return (
    <RightChatMessage
      name={FULLSCREEN_CHAT_OPENER.name}
      lines={[label]}
      time={0}
      emojiIcons={FULLSCREEN_CHAT_OPENER.emojiIconOrder}
      portrait={FULLSCREEN_CHAT_OPENER.portrait}
      onSeek={onSeek}
    />
  );
}

export default function ChatLyricFeed({
  songTitle,
  lines,
  loading,
  error,
  language,
  onSeek,
}: ChatLyricFeedProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const translationDisplay = usePlayerStore((s) => s.lyricsViewSettings.translationDisplay);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLElement | null>(null);
  const { scrollToElement, isScrolledUp } = useSmoothScrollContainer(scrollRef, {
    getSyncElement: () => activeRef.current,
  });

  const visibleLines = useMemo(() => {
    if (loading || error) return [];
    return lines.filter(
      (line) => line.time <= currentTime && hasDisplayableLyricContent(line),
    );
  }, [lines, currentTime, loading, error]);

  const { rightLines, memberLines } = useMemo(() => {
    const right: MergedLyricLine[] = [];
    const members: MergedLyricLine[] = [];
    for (const line of visibleLines) {
      if (line.member === "pharrell") right.push(line);
      else members.push(line);
    }
    return { rightLines: right, memberLines: members };
  }, [visibleLines]);

  const chatSongTitle = formatFullscreenChatSongTitle(songTitle);
  const pharrell = MEMBERS.pharrell;

  /** One active bubble for the whole feed — avoids left shadow lingering when right lines are current. */
  const activeLineId = useMemo(() => {
    if (loading || error || visibleLines.length === 0) return null;
    const idx = getActiveMergedLyricIndex(visibleLines, currentTime);
    return idx >= 0 ? visibleLines[idx].id : null;
  }, [visibleLines, currentTime, loading, error]);

  useEffect(() => {
    if (!activeRef.current || !activeLineId || isScrolledUp) return;
    scrollToElement(activeRef.current);
  }, [activeLineId, isScrolledUp, scrollToElement]);

  const showResync = isScrolledUp && isPlaying && !loading && !error && lines.length > 0;

  const handleResync = () => {
    if (activeRef.current) scrollToElement(activeRef.current);
  };

  return (
    <section className="fs-lyric-feed" aria-label="Synchronized lyrics">
      <div
        className="fs-lyric-feed__scroll"
        ref={scrollRef}
        onClick={(e) => seekFromFeedClick(e, onSeek)}
      >
        <SelectableCopyRegion
          copyLabel="Lyrics"
          className="fs-lyric-feed__copy"
          enablePointerCapture={false}
        >
          {loading ? (
            <>
              <SongTitleChatMessage label={chatSongTitle} onSeek={onSeek} />
              <p className="fs-lyric-feed__status" data-copy-block>
                Loading lyrics…
              </p>
            </>
          ) : error ? (
            <>
              <SongTitleChatMessage label={chatSongTitle} onSeek={onSeek} />
              <p className="fs-lyric-feed__status" data-copy-block>
                {error}
              </p>
            </>
          ) : lines.length === 0 ? (
            <>
              <SongTitleChatMessage label={chatSongTitle} onSeek={onSeek} />
              <p className="fs-lyric-feed__status" data-copy-block>
                No lyrics for this track.
              </p>
            </>
          ) : (
            <>
              <SongTitleChatMessage label={chatSongTitle} onSeek={onSeek} />
              {rightLines.map((line) => {
                const bubbleLines = getLyricBubbleLines(line, language, { translationDisplay });
                if (bubbleLines.length === 0) return null;
                const isActive = line.id === activeLineId;
                return (
                  <RightChatMessage
                    key={line.id}
                    ref={isActive ? (el) => { activeRef.current = el; } : undefined}
                    name={pharrell.name}
                    emojiIcons={[pharrell.emojiIcon]}
                    portrait={pharrell.portrait}

                    lines={bubbleLines}
                    time={line.time}
                    active={isActive}
                    onSeek={onSeek}
                  />
                );
              })}
              {memberLines.map((line) => {
            const member = MEMBERS[line.member];
            const isActive = line.id === activeLineId;
            const bubbleLines = getLyricBubbleLines(line, language, { translationDisplay });
            if (bubbleLines.length === 0) return null;

            const isHaerin = line.member === "haerin";
            const avatarW = isHaerin ? FS.lyricFeed.haerinAvatarWidth : FS.lyricFeed.avatarSize;

            return (
              <article
                key={line.id}
                ref={isActive ? (el) => { activeRef.current = el; } : undefined}
                className="fs-lyric-message fs-lyric-message--enter"
              >
                <p className="fs-lyric-message__sender">
                  <span>{member.name}</span>
                  <img
                    src={member.emojiIcon}
                    alt=""
                    className="fs-lyric-message__emoji"
                    width={FS.lyricFeed.emojiSize}
                    height={FS.lyricFeed.emojiSize}
                    draggable={false}
                  />
                </p>
                <div className="fs-lyric-message__row">
                  <div
                    className="fs-lyric-message__avatar"
                    style={{ width: avatarW, height: FS.lyricFeed.avatarSize }}
                  >
                    <img src={member.portrait} alt="" width={avatarW} height={FS.lyricFeed.avatarSize} draggable={false} />
                  </div>
                  <div
                    className={`fs-lyric-bubble${isActive ? " fs-lyric-bubble--active" : ""}`}
                    role={onSeek ? "button" : undefined}
                    tabIndex={onSeek ? 0 : undefined}
                    data-seek-time={onSeek ? line.time : undefined}
                    onKeyDown={(e) => seekFromBubbleKey(e, line.time, onSeek)}
                  >
                    {bubbleLines.map((text, i) => (
                      <p key={`${line.id}-${i}`} className="fs-lyric-bubble__line" data-copy-block>
                        <LyricText text={text} />
                      </p>
                    ))}
                  </div>
                  <time className="fs-lyric-message__time" dateTime={`${line.time}s`}>
                    {formatLyricTimestamp(line.time)}
                  </time>
                </div>
              </article>
            );
              })}
            </>
          )}
        </SelectableCopyRegion>
      </div>
      <button
        type="button"
        aria-label="Jump to current lyric"
        onClick={handleResync}
        className={`fs-lyric-feed__resync${
          showResync ? " fs-lyric-feed__resync--visible" : " fs-lyric-feed__resync--hidden"
        }`}
      >
        <img src={figmaAssets.homePageBackUp} alt="" className="fs-lyric-feed__resync-icon" />
      </button>
    </section>
  );
}
