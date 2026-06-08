import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import FixedPageNav from "../components/layout/FixedPageNav";
import LyricPanel from "../components/LyricPanel";
import MeterPanel from "../components/meters/MeterPanel";
import SongNavMenu from "../components/SongNavMenu";
import PlayerViewportBackground from "../components/stem-player/PlayerViewportBackground";
import PlayerHeader from "../components/stem-player/PlayerHeader";
import FixedNavIconButton from "../components/layout/FixedNavIconButton";
import SongTitleBlock from "../components/stem-player/SongTitleBlock";
import StemContainer from "../components/stem/StemContainer";
import StemsLoadingOverlay from "../components/StemsLoadingOverlay";
import FullscreenPlayer from "../components/fullscreen/FullscreenPlayer";
import TransportControls from "../components/transport/TransportControls";
import { getAdjacentSong, getRelease, getSong } from "../data/catalog";
import { figmaAssets } from "../figma/assets";
import { songHasMasterMix } from "../utils/songMaster";
import { usePlayerFullscreen } from "../hooks/usePlayerFullscreen";
import { FIGMA } from "../figma/layout";

import { useMeterAnalysis } from "../hooks/useMeterAnalysis";
import { useAudioAnalysis } from "../hooks/useAudioAnalysis";
import { usePlayerScale } from "../hooks/usePlayerScale";
import { useStemEngine } from "../hooks/useStemEngine";
import { useKeyboardPlayPause } from "../hooks/useKeyboardPlayPause";
import { useTrackMetadata } from "../hooks/useTrackMetadata";
import { useTitleLyricsGapLayout } from "../hooks/useTitleLyricsGapLayout";
import { getDisplayMetadataFields } from "../metadata/displayFields";
import { useWebFontsReady } from "../hooks/useWebFontsReady";
import { usePlayerStore } from "../store/playerStore";

export default function StemPlayerPage() {
  const { releaseId, songId } = useParams();
  const navigate = useNavigate();
  const release = releaseId ? getRelease(releaseId) : undefined;
  const song = useMemo(
    () => (releaseId && songId ? getSong(releaseId, songId) : undefined),
    [releaseId, songId],
  );
  const scale = usePlayerScale();
  const fontsReady = useWebFontsReady();
  const scaledContentRef = useRef<HTMLDivElement>(null);
  const titleBlockRef = useRef<HTMLDivElement>(null);
  const titleCoolLineRef = useRef<HTMLParagraphElement>(null);

  const duration = usePlayerStore((s) => s.duration);
  const stemsLoading = usePlayerStore((s) => s.stemsLoading);
  const { fullscreenOpen, setFullscreenOpen } = usePlayerFullscreen(Boolean(song));
  const trackMetadata = useTrackMetadata(releaseId, songId, duration || song?.durationSec);
  const titleLyricsLayout = useTitleLyricsGapLayout(
    song?.title ?? "",
    fontsReady,
    titleCoolLineRef,
    titleBlockRef,
  );

  useLayoutEffect(() => {
    usePlayerStore.getState().resetTransportForSong();
    usePlayerStore.getState().resetChannels();
    usePlayerStore.getState().setStemsLoadError(null);
    usePlayerStore.getState().setMenuOpen(false);
    const nextSong = releaseId && songId ? getSong(releaseId, songId) : undefined;
    if (nextSong && !songHasMasterMix(nextSong)) {
      usePlayerStore.getState().setFullscreenUseStems(true);
    }
  }, [releaseId, songId]);

  const { seek, togglePlay } = useStemEngine(song, releaseId);
  useKeyboardPlayPause(() => void togglePlay(), !stemsLoading && Boolean(song));
  useMeterAnalysis();
  useAudioAnalysis(releaseId, songId);

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

  const displayMetadata = getDisplayMetadataFields(
    trackMetadata,
    song,
    duration || song.durationSec,
  );

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
      <PlayerViewportBackground fontsReady={fontsReady} />
      <FixedPageNav hidden={fullscreenOpen}>
        <FixedNavIconButton
          label="Back to song selection"
          src={figmaAssets.stemPageBack}
          to={`/release/${releaseId}`}
        />
        <FixedNavIconButton label="Home" src={figmaAssets.home} to="/" />
      </FixedPageNav>
      <FixedPageNav side="right" hidden={fullscreenOpen}>
        <FixedNavIconButton
          label="Full screen"
          src={figmaAssets.fullscreen}
          onClick={() => setFullscreenOpen(!fullscreenOpen)}
        />
        <span data-song-nav-trigger className="relative inline-flex shrink-0">
          <FixedNavIconButton
            label="Song menu"
            src={figmaAssets.settings}
            onClick={() => usePlayerStore.setState((s) => ({ menuOpen: !s.menuOpen }))}
          />
          <SongNavMenu
            songTitle={song.title}
            stems={song.stems}
            stemsZipFiles={song.stemsZipFiles}
            midiSrc={song.midi}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={() => goToAdjacent("previous")}
            onNext={() => goToAdjacent("next")}
          />
        </span>
      </FixedPageNav>
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
        className="relative z-[1] h-full w-full max-w-[1920px]"
        aria-hidden={fullscreenOpen}
        style={fullscreenOpen ? { visibility: "hidden" } : undefined}
      >
        <div
          className="relative z-[1] flex h-full w-full items-start justify-center overflow-hidden"
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
          <PlayerHeader />

          {/* Frame 11 — meters, track info, stems, progress (26:212); shared row top */}
          <div
            className="pointer-events-none absolute left-0 w-full"
            style={{ top: FIGMA.contentRowTop, height: FIGMA.main.height }}
          >
            <MeterPanel className="pointer-events-auto" />

            {/* Track Info Container (Figma 26:207) — top-aligned with Meters Box */}
            <div
              className="pointer-events-auto absolute z-10 flex items-start"
              style={{
                left: FIGMA.titleRow.left,
                top: 0,
                width: FIGMA.titleRow.trackInfoWidth,
              }}
            >
              <SongTitleBlock
                title={song.title}
                durationSec={displayMetadata.durationSec}
                keyLabel={displayMetadata.keyLabel ?? undefined}
                bpm={displayMetadata.bpm ?? undefined}
                titleBlockRef={titleBlockRef}
                titleCoolLineRef={titleCoolLineRef}
              />
              <LyricPanel
                key={`${releaseId}-${songId}`}
                lrc={song.lrc}
                fontsReady={fontsReady}
                onSeek={seek}
                lyricsWidth={titleLyricsLayout.lyricsWidth}
                lyricsMarginLeft={titleLyricsLayout.lyricsMarginLeft}
              />
            </div>

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
                <StemContainer
                  key={`${releaseId}-${songId}`}
                  stems={song.stems}
                  onSeek={seek}
                  disabled={stemsLoading}
                  durationSec={duration || song.durationSec}
                />
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
