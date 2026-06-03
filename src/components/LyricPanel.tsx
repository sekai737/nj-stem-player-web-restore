import { useMemo } from "react";
import { MEMBERS } from "../data/members";
import { LYRICS_FIGMA } from "../figma/lyricsLayout";
import { FIGMA } from "../figma/layout";
import { useLyrics } from "../hooks/useLyrics";
import { shouldShowMemberLyrics, getActiveLyricIndex, getNextLyric } from "../utils/lyrics";
import type { SongLrcFiles } from "../types";
import { usePlayerStore } from "../store/playerStore";
import LanguageOptionsBox from "./LanguageOptionsBox";
import MemberLyricsBox from "./MemberLyricsBox";
import SelectableCopyRegion from "./SelectableCopyRegion";
import { lyricLineClass } from "../utils/lyricScriptFont";
import "./selectable-copy-stem.css";

interface LyricPanelProps {
  lrc?: SongLrcFiles;
  fontsReady?: boolean;
}

/**
 * Figma lyrics column (node 26:214) — active line + one preview below.
 * Fullscreen uses lyrics-plus synced display separately.
 */
export default function LyricPanel({ lrc, fontsReady = true }: LyricPanelProps) {
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

  const lyricKey = error ? "error" : loading ? "loading" : `${activeIndex}-${active?.text ?? ""}`;

  return (
    <section
      className="figma-surface flex shrink-0 items-center"
      style={{
        width: FIGMA.titleRow.lyricsWidth,
        height: FIGMA.titleRow.lyricsHeight,
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
        className="stem-lyrics-copy flex min-w-0 flex-1 flex-col items-center justify-center text-center"
        regionClassName="flex min-h-0 w-full flex-col items-center justify-center overflow-hidden text-center"
      >
        {loading ? (
          <p className="lyric-line-main" data-copy-block>
            Loading lyrics…
          </p>
        ) : error ? (
          <p className="lyric-line-preview" data-copy-block>
            {error}
          </p>
        ) : active ? (
          <div
            key={lyricKey}
            className="lyrics-lines-enter flex w-full flex-col items-center justify-center"
          >
            <p
              className={`${lyricLineClass("lyric-line-main", active.text)} mb-0 w-full break-words`}
              data-copy-block
            >
              {active.text}
            </p>
            {next ? (
              <p
                className={`${lyricLineClass("lyric-line-preview", next.text)} mt-0 w-full break-words`}
                data-copy-block
              >
                {next.text}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="lyric-line-preview" data-copy-block>
            {lines.length > 0 ? "…" : "No lyrics for this language."}
          </p>
        )}
      </SelectableCopyRegion>

      <LanguageOptionsBox lrc={lrc} />
    </section>
  );
}
