import { useEffect, useMemo, useRef } from "react";
import LyricText from "../LyricText";
import { MEMBERS } from "../../data/members";
import {
  getActiveMergedLyricIndex,
  getLyricLineVisualState,
  renderLyricTextBlocks,
} from "../../utils/lyricsDisplay";
import type { MergedLyricLine } from "../../types/fullscreenLyrics";
import type { FullscreenLyricsSettings } from "../../types/fullscreenLyrics";
import { usePlayerStore } from "../../store/playerStore";

interface SyncedLyricsDisplayProps {
  lines: MergedLyricLine[];
  loading: boolean;
  error: string | null;
  settings: FullscreenLyricsSettings;
  visible: boolean;
}

export default function SyncedLyricsDisplay({
  lines,
  loading,
  error,
  settings,
  visible,
}: SyncedLyricsDisplayProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const activeIndex = useMemo(
    () => (loading || error ? -1 : getActiveMergedLyricIndex(lines, currentTime)),
    [lines, currentTime, loading, error],
  );

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  if (!visible) {
    return (
      <section className="fs-lyrics fs-lyrics--hidden" aria-hidden>
        <p className="fs-lyrics__placeholder">Lyrics hidden (L)</p>
      </section>
    );
  }

  return (
    <section className="fs-lyrics" aria-label="Synced lyrics">
      <div className="fs-lyrics__scroll" ref={scrollRef}>
        {loading ? (
          <p className="fs-lyrics__message">Loading lyrics…</p>
        ) : error ? (
          <p className="fs-lyrics__message">{error}</p>
        ) : lines.length === 0 ? (
          <p className="fs-lyrics__message">No lyrics for this track.</p>
        ) : (
          lines.map((line, index) => {
            const distance = index - activeIndex;
            const visual = getLyricLineVisualState(distance, true);
            const isActive = index === activeIndex;
            const blocks = renderLyricTextBlocks(line, settings);
            const member = MEMBERS[line.member];

            return (
              <div
                key={line.id}
                ref={isActive ? activeRef : undefined}
                className={`fs-lyric-line fs-lyric-line--${visual}`}
              >
                {isActive && (
                  <span className="fs-lyric-line__member">{member.name}</span>
                )}
                {blocks.map((text, i) => (
                  <p key={`${line.id}-${i}`} className="fs-lyric-line__text">
                    <LyricText text={text} />
                  </p>
                ))}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
