import { useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import LyricPanel from "../components/LyricPanel";
import MeterPanel from "../components/meters/MeterPanel";
import PlayerBackground from "../components/stem-player/PlayerBackground";
import PlayerHeader from "../components/stem-player/PlayerHeader";
import SongTitleBlock from "../components/stem-player/SongTitleBlock";
import StemContainer from "../components/stem/StemContainer";
import StemsLoadingOverlay from "../components/StemsLoadingOverlay";
import FullscreenPlayer from "../components/fullscreen/FullscreenPlayer";
import TransportControls from "../components/transport/TransportControls";
import { getAdjacentSong, getRelease, getSong } from "../data/catalog";
import { songHasMasterMix } from "../utils/songMaster";
import { usePlayerFullscreen } from "../hooks/usePlayerFullscreen";
import { FIGMA } from "../figma/layout";

import { useMeterAnalysis } from "../hooks/useMeterAnalysis";
import { usePlayerScale } from "../hooks/usePlayerScale";
import { useStemEngine } from "../hooks/useStemEngine";
import { useKeyboardPlayPause } from "../hooks/useKeyboardPlayPause";
import { useWebFontsReady } from "../hooks/useWebFontsReady";
import { usePlayerStore } from "../store/playerStore";

export default function StemPlayerPage() {
  const { releaseId, songId } = useParams();
  const navigate = useNavigate();
  const release = releaseId ? getRelease(releaseId) : undefined;
  const song = releaseId && songId ? getSong(releaseId, songId) : undefined;
  const scale = usePlayerScale();
  const fontsReady = useWebFontsReady();
  const scaledContentRef = useRef<HTMLDivElement>(null);

  const duration = usePlayerStore((s) => s.duration);
  const stemsLoading = usePlayerStore((s) => s.stemsLoading);
  const { fullscreenOpen, setFullscreenOpen } = usePlayerFullscreen(Boolean(song));
  const { seek, togglePlay } = useStemEngine(song);
  useKeyboardPlayPause(() => void togglePlay(), !stemsLoading && Boolean(song));
  useMeterAnalysis();


  useEffect(() => {
    usePlayerStore.getState().resetChannels();
    usePlayerStore.getState().setPlaying(false);
    usePlayerStore.getState().setCurrentTime(0);
    usePlayerStore.getState().setStemsLoadError(null);
    usePlayerStore.getState().setMenuOpen(false);
    const nextSong = releaseId && songId ? getSong(releaseId, songId) : undefined;
    if (nextSong && !songHasMasterMix(nextSong)) {
      usePlayerStore.getState().setFullscreenUseStems(true);
    }
  }, [releaseId, songId]);

  useEffect(() => {
    return () => {
      usePlayerStore.getState().setPlaying(false);
      usePlayerStore.getState().setFullscreenOpen(false);
    };
  }, []);

  /** Chrome can cache fallback glyphs inside transform:scale() until a reflow. */
  useEffect(() => {
    if (!fontsReady) return;
    const node = scaledContentRef.current;
    if (!node) return;
    const transform = node.style.transform;
    node.style.transform = "none";
    void node.offsetHeight;
    node.style.transform = transform;
  }, [fontsReady]);

  if (!release || !song || !releaseId || !songId) return <Navigate to="/" replace />;

  const goToAdjacent = (direction: "next" | "previous") => {
    const loc = getAdjacentSong(releaseId, songId, direction);
    if (loc) navigate(`/release/${loc.releaseId}/play/${loc.songId}`);
  };

  const hasPrevious = getAdjacentSong(releaseId, songId, "previous") !== undefined;
  const hasNext = getAdjacentSong(releaseId, songId, "next") !== undefined;

  const scaledWidth = FIGMA.content.width * scale;
  const scaledHeight = FIGMA.content.height * scale;

  return (
    <Layout bare>
      <FullscreenPlayer
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        release={release}
        song={song}
        durationSec={duration || song.durationSec}
        disabled={stemsLoading}
        onTogglePlay={() => void togglePlay()}
        onSeek={seek}
        onPrevious={() => goToAdjacent("previous")}
        onNext={() => goToAdjacent("next")}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
      <div
        className="relative h-full w-full max-w-[1920px]"
        aria-hidden={fullscreenOpen}
        style={fullscreenOpen ? { visibility: "hidden" } : undefined}
      >
        <PlayerBackground />

        <div
          className="flex h-full w-full items-start justify-center overflow-hidden"
          style={{
            paddingTop: FIGMA.inset.y,
            paddingBottom: FIGMA.inset.y,
            paddingLeft: FIGMA.inset.x,
            paddingRight: FIGMA.inset.x,
          }}
        >
          <div className="relative shrink-0" style={{ width: scaledWidth, height: scaledHeight }}>
            <div
              key={fontsReady ? "fonts-ready" : "fonts-pending"}
              ref={scaledContentRef}
              className="relative"
              style={{
                width: FIGMA.content.width,
                height: FIGMA.content.height,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
          <PlayerHeader
            releaseId={release.id}
            songTitle={song.title}
            stems={song.stems}
            stemsZipFiles={song.stemsZipFiles}
            midiSrc={song.midi}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={() => goToAdjacent("previous")}
            onNext={() => goToAdjacent("next")}
          />

          {/* Frame 10 — title + lyrics (Figma 26:207); gap Title→Lyrics = 48 (26:214 x=610 − Title w=562) */}
          <div
            className="absolute z-10 flex items-start"
            style={{
              left: FIGMA.titleRow.left,
              top: FIGMA.contentRowTop,
              gap: FIGMA.titleRow.gap,
            }}
          >
            <SongTitleBlock
              releaseId={release.id}
              songId={song.id}
              title={song.title}
              durationSec={duration || song.durationSec}
              keyLabel={song.key}
              bpm={song.bpm}
            />
            <LyricPanel lrc={song.lrc} fontsReady={fontsReady} />
          </div>

          {/* Frame 11 — meters, stems, progress (26:212); top matches lyrics row */}
          <div
            className="pointer-events-none absolute left-0 w-full"
            style={{ top: FIGMA.contentRowTop, height: FIGMA.main.height }}
          >
            <MeterPanel className="pointer-events-auto" />

            <div
              className="pointer-events-auto absolute relative flex flex-col gap-sp-32"
              style={{
                left: FIGMA.stems.left,
                top: FIGMA.stems.top,
                width: FIGMA.stems.width,
                height: FIGMA.stems.height,
              }}
            >
              <StemsLoadingOverlay songTitle={song.title} />
              <div className={stemsLoading ? "pointer-events-none select-none opacity-50" : ""}>
                <StemContainer stems={song.stems} onSeek={seek} disabled={stemsLoading} />
              </div>
            </div>

            <TransportControls
              duration={duration || song.durationSec}
              onSeek={seek}
              onTogglePlay={() => void togglePlay()}
              onPrevious={() => goToAdjacent("previous")}
              onNext={() => goToAdjacent("next")}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              disabled={stemsLoading}
              className="pointer-events-auto absolute"
              style={{
                left: FIGMA.transportRow.left,
                top: FIGMA.transportRow.top,
              }}
            />
          </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
