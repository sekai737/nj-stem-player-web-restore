import { useMemo, useRef, useState, type CSSProperties } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import SongSelectCarousel from "../components/song-select/SongSelectCarousel";
import SongSelectOpenPlayerButton from "../components/song-select/SongSelectOpenPlayerButton";
import SongSelectRemixPanel from "../components/song-select/SongSelectRemixPanel";
import StarField from "../components/StarField";
import FixedPageNav from "../components/layout/FixedPageNav";
import FixedNavIconButton from "../components/layout/FixedNavIconButton";
import PlayerBackgroundDecor from "../components/stem-player/PlayerBackgroundDecor";
import { getRelease, getReleaseCoverArt, getSelectableSongs, getSongArtwork } from "../data/catalog";
import { figmaAssets } from "../figma/assets";
import { buildBackgroundDecorLayout } from "../figma/backgroundDecorLayout";
import { STAR_FIELD_REFERENCE } from "../figma/starFieldLayout";
import { SONG_SELECT_REFERENCE } from "../figma/songSelectLayout";
import { useSongSelectRemixScroll } from "../hooks/useSongSelectRemixScroll";
import { useHomePageScale } from "../hooks/useHomePageScale";
import { useWebFontsReady } from "../hooks/useWebFontsReady";
import "../styles/background-decor.css";
import "./song-select-page.css";

export default function SongSelectPage() {
  const { releaseId } = useParams();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const release = releaseId ? getRelease(releaseId) : undefined;
  const selectableSongs = useMemo(() => (release ? getSelectableSongs(release) : []), [release]);
  const [index, setIndex] = useState(0);
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixScrollExtent, setRemixScrollExtent] = useState(0);
  const [remixScrollOffset, setRemixScrollOffset] = useState(0);

  useHomePageScale(rootRef);
  useSongSelectRemixScroll({
    rootRef,
    remixOpen,
    remixScrollExtent,
    remixScrollOffset,
    setRemixScrollOffset,
  });
  const fontsReady = useWebFontsReady();

  const decorPlacements = useMemo(
    () =>
      buildBackgroundDecorLayout(SONG_SELECT_REFERENCE.width, SONG_SELECT_REFERENCE.height),
    [],
  );

  const rootStyle = {
    "--remix-scroll-offset": `${remixScrollOffset}px`,
  } as CSSProperties;

  if (!release) return <Navigate to="/" replace />;

  const count = selectableSongs.length;
  const safeIndex =
    count > 0 ? Math.min(Math.max(index, 0), count - 1) : 0;
  const song = selectableSongs[safeIndex];
  const canGoPrevious = safeIndex > 0;
  const canGoNext = safeIndex < count - 1;

  const openStemPlayer = (songId: string) => {
    navigate(`/release/${release.id}/play/${songId}`);
  };

  const coverFor = (s: typeof song | undefined) =>
    s ? getSongArtwork(s, release) : getReleaseCoverArt(release);

  return (
    <div
      ref={rootRef}
      className={`song-select-root${remixOpen && remixScrollExtent > 0 ? " song-select-root--remix-scroll" : ""}`}
      style={rootStyle}
    >
      <FixedPageNav>
        <FixedNavIconButton label="Home" src={figmaAssets.home} to="/" />
      </FixedPageNav>

      {fontsReady ? <PlayerBackgroundDecor placements={decorPlacements} /> : null}
      <StarField
        width={STAR_FIELD_REFERENCE.width}
        height={STAR_FIELD_REFERENCE.height}
      />

      <div className="song-select-frame">
        <div className="song-select-frame__shift">
        <main className="song-select-main" aria-label={`Select a song from ${release.title}`}>
          <section className="song-select-info" aria-label="Song information">
            <img
              src={figmaAssets.songSelectInfoBg}
              alt=""
              className="song-select-info__bg"
              draggable={false}
            />
            <header className="song-select-album">
              <h1 className="song-select-album__title">{release.title}</h1>
              <p className="song-select-album__meta">
                {release.type} · {release.year}
              </p>
            </header>

            {count > 0 && song ? (
              <>
                <SongSelectCarousel
                  currentArt={coverFor(song)}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext}
                  onPrevious={() => setIndex((current) => Math.max(0, current - 1))}
                  onNext={() => setIndex((current) => Math.min(count - 1, current + 1))}
                />

                <div className="song-select-track-info">
                  <p className="type-swiss721-regular song-select-track-info__title">{song.title}</p>
                  <p className="type-swiss721-regular song-select-track-info__index">
                    {safeIndex + 1} / {count}
                  </p>
                </div>

                <SongSelectOpenPlayerButton
                  songTitle={song.title}
                  onClick={() => openStemPlayer(song.id)}
                />
              </>
            ) : (
              <p className="type-swiss721-regular song-select-album__meta">No songs available.</p>
            )}
          </section>

          {song ? (
            <SongSelectRemixPanel
              releaseId={release.id}
              songId={song.id}
              releaseCoverArt={getReleaseCoverArt(release)}
              onSelectRemix={openStemPlayer}
              onOpenChange={setRemixOpen}
              onScrollExtentChange={setRemixScrollExtent}
              onAutoScroll={setRemixScrollOffset}
              remixScrollOffset={remixScrollOffset}
            />
          ) : null}
        </main>
        </div>
      </div>
    </div>
  );
}
