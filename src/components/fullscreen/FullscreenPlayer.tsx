import { useEffect } from "react";
import { createPortal } from "react-dom";
import { getSongArtwork, getSongIndex } from "../../data/catalog";
import { useFullscreenKeyboard } from "../../hooks/useFullscreenKeyboard";
import { useMergedLyrics } from "../../hooks/useMergedLyrics";
import { usePlayerStore } from "../../store/playerStore";
import type { Release, Song } from "../../types";
import { songHasMasterMix } from "../../utils/songMaster";
import ChatLyricFeed from "./ChatLyricFeed";
import FullscreenBottomBar from "./FullscreenBottomBar";
import FullscreenHeader from "./FullscreenHeader";
import FullscreenPlayerCard from "./FullscreenPlayerCard";
import FullscreenStemStack from "./FullscreenStemStack";
import FullscreenVolumeSlider from "./FullscreenVolumeSlider";
import "./fullscreen-player.css";

interface FullscreenPlayerProps {
  open: boolean;
  onClose: () => void;
  release: Release;
  song: Song;
  durationSec: number;
  disabled?: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export default function FullscreenPlayer({
  open,
  onClose,
  release,
  song,
  durationSec,
  disabled = false,
  onTogglePlay,
  onSeek,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: FullscreenPlayerProps) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const showConversion = usePlayerStore((s) => s.fullscreenShowConversionPanel);
  const fullscreenUseStems = usePlayerStore((s) => s.fullscreenUseStems);
  const lyricLanguage = usePlayerStore((s) => s.lyricLanguage);
  const masterMixAvailable = songHasMasterMix(song);

  const { lines: mergedLines, loading: lyricsLoading, error: lyricsError } = useMergedLyrics(
    song.lrc,
    open,
  );

  const safeDuration = durationSec > 0 ? durationSec : song.durationSec;

  useFullscreenKeyboard(open, {
    onClose,
    onTogglePlay,
    onSeek,
    onPrevious,
    onNext,
    durationSec: safeDuration,
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const trackIndex = getSongIndex(release, song.id);
  const releaseLabel = `${release.title} ${release.type}`;
  const trackLabel =
    trackIndex >= 0
      ? `${releaseLabel} · ${song.title} · Track ${String(trackIndex + 1).padStart(2, "0")}`
      : `${releaseLabel} · ${song.title}`;

  const toggleConversions = () => {
    usePlayerStore.setState((s) => ({
      fullscreenShowConversionPanel: !s.fullscreenShowConversionPanel,
      menuOpen: false,
    }));
  };

  return createPortal(
    <div
      className="fs-player"
      role="dialog"
      aria-modal="true"
      aria-label={`Full screen: ${song.title}`}
    >
      <FullscreenHeader
        onBack={onClose}
        conversionsOpen={showConversion}
        onToggleConversions={toggleConversions}
        onCloseConversions={() => usePlayerStore.setState({ fullscreenShowConversionPanel: false })}
        lrc={song.lrc}
        masterMixAvailable={masterMixAvailable}
      />

      <main className="fs-player__main">
        <div className="fs-player__lyrics-col">
          <ChatLyricFeed
            key={song.id}
            songTitle={song.title}
            lines={mergedLines}
            loading={lyricsLoading}
            error={lyricsError}
            language={lyricLanguage}
            onSeek={onSeek}
          />
        </div>

        <div className="fs-player__controls-col">
          <div className="fs-player__cluster">
            <div className="fs-player__cluster-rail">
              <div
                className={
                  fullscreenUseStems
                    ? "fs-player__cluster-playback"
                    : "fs-player__cluster-playback fs-player__cluster-playback--master"
                }
              >
              <FullscreenPlayerCard
                artwork={getSongArtwork(song, release)}
                title={song.title}
                releaseTitle={release.title}
                releaseType={release.type}
                year={release.year}
                isPlaying={isPlaying}
                currentTime={currentTime}
                durationSec={safeDuration}
                disabled={disabled}
                onTogglePlay={onTogglePlay}
                onPrevious={onPrevious}
                onNext={onNext}
                onSeek={onSeek}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
              />
              {fullscreenUseStems ? <FullscreenStemStack /> : null}
              </div>
              <FullscreenVolumeSlider />
            </div>
          </div>
        </div>
      </main>

      <FullscreenBottomBar
        label={trackLabel}
        onPrevious={onPrevious}
        onNext={onNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
    </div>,
    document.body,
  );
}
