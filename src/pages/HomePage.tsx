import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { catalog, getReleaseCoverArt, getReleases, getSelectableSongs } from "../data/catalog";
import { figmaAssets } from "../figma/assets";
import { useViewportSize } from "../hooks/useViewportSize";
import { useWebFontsReady } from "../hooks/useWebFontsReady";
import { buildBackgroundDecorLayout } from "../figma/backgroundDecorLayout";
import PlayerBackgroundDecor from "../components/stem-player/PlayerBackgroundDecor";
import StarField from "../components/StarField";
import "../styles/background-decor.css";
import "./home-page.css";

export default function HomePage() {
  const releases = getReleases();
  const { width, height } = useViewportSize();
  const listRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const scale = useMemo(() => Math.min(width / 1920, height / 1080), [width, height]);
  const fontsReady = useWebFontsReady();
  const decorPlacements = useMemo(
    () => buildBackgroundDecorLayout(width, height),
    [width, height],
  );

  return (
    <div className="home-page-root">
      {fontsReady ? <PlayerBackgroundDecor placements={decorPlacements} /> : null}
      <StarField width={width} height={height} />
      <div
        className="home-page-frame"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <img
          src={figmaAssets.homePageCircles}
          alt=""
          className="pointer-events-none absolute left-[105px] top-[89px] h-[719px] w-[1724px]"
        />
        <img
          src={figmaAssets.homePageBigStars}
          alt=""
          className="pointer-events-none absolute left-[135px] top-[77px] h-[821px] w-[1657px]"
        />
        <div className="absolute left-[1028px] top-[246px] z-10 h-[107px] w-[305px]">
          <img src={figmaAssets.homePageBubble} alt="" className="absolute inset-0 h-full w-full" />
          <p className="type-swiss721-condensed-italic absolute inset-0 flex items-center justify-center text-[48px] leading-none tracking-[-1.2px] text-content-primary">
            Stem Player
          </p>
        </div>

        <img
          src={figmaAssets.homePageTitle}
          alt="NewJeans"
          className="pointer-events-none absolute left-[639px] top-[112px] z-10 h-[162px] w-[642px]"
        />

        <img
          src={figmaAssets.homePageFloor}
          alt=""
          className="pointer-events-none absolute left-[213px] top-[840px] z-0 h-[242px] w-[1494px]"
        />

        <div
          ref={listRef}
          className="home-page-card-list"
          onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 8)}
        >
          {releases.map((release) => {
            const songCount = getSelectableSongs(release).length;
            return (
              <article key={release.id} className="home-page-card">
                <div className="home-page-card-metadata">
                  <img
                    src={getReleaseCoverArt(release)}
                    alt=""
                    className="h-[88px] w-[88px] shrink-0 rounded-[6px] object-cover"
                  />
                  <div className="home-page-card-text">
                    <h2 className="home-page-card-title truncate">{release.title}</h2>
                    <p className="home-page-card-meta truncate">
                      {release.type} &bull; {release.year} &bull; {songCount} song
                      {songCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/release/${release.id}`}
                  className="home-page-card-play"
                  aria-label={`Open ${release.title}`}
                >
                  <img src={figmaAssets.homePagePlay} alt="" className="h-[44px] w-[44px] max-w-none" />
                </Link>
              </article>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Back to top"
          onClick={() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ transition: "opacity 180ms ease-out, transform 300ms ease-out" }}
          className={`absolute left-1/2 top-[904px] z-10 h-[56px] w-[56px] -translate-x-1/2 ${
            isScrolled
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          <img src={figmaAssets.homePageBackUp} alt="" className="h-full w-full" />
        </button>

        <div className="absolute left-[60px] top-[992px] z-10 h-[54px] w-[1800px]">
          <div className="absolute left-1/2 top-0 flex w-[147px] -translate-x-1/2 flex-col items-center gap-[8px]">
            <p className="type-swiss721-regular whitespace-nowrap text-[16px] tracking-[-0.8px] text-[#151715]">
              Made by @sekai737
            </p>
            <div className="flex items-center gap-[2px]">
              <img src={figmaAssets.homePageHeartMinji} alt="" className="h-[27px] w-[27px]" />
              <img src={figmaAssets.homePageHeartHanni} alt="" className="h-[27px] w-[27px]" />
              <img src={figmaAssets.homePageHeartDanielle} alt="" className="h-[27px] w-[27px]" />
              <img src={figmaAssets.homePageHeartHaerin} alt="" className="h-[27px] w-[27px]" />
              <img src={figmaAssets.homePageHeartHyein} alt="" className="h-[27px] w-[27px]" />
            </div>
          </div>
        </div>
      </div>

      <a
        href={catalog.creator.youtube}
        target="_blank"
        rel="noreferrer"
        aria-label="Creator on YouTube"
        className="absolute bottom-[40px] left-[40px] z-20 inline-flex h-[40px] w-[40px] items-center justify-center"
      >
        <img src={figmaAssets.homePageYoutubeButton} alt="" className="h-[40px] w-[40px]" />
      </a>

      <a
        href={catalog.creator.litLink}
        target="_blank"
        rel="noreferrer"
        className="type-swiss721-regular absolute bottom-[44px] right-[40px] z-20 whitespace-nowrap text-[16px] tracking-[-0.8px] text-[#151715]"
      >
        {catalog.creator.litLink}
      </a>
    </div>
  );
}
