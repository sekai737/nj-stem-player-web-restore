import { useMemo, useRef, useState } from "react";
import { catalog, getReleases } from "../data/catalog";
import { figmaAssets } from "../figma/assets";
import { buildBackgroundDecorLayout } from "../figma/backgroundDecorLayout";
import { STAR_FIELD_REFERENCE } from "../figma/starFieldLayout";
import { useHomePageScale } from "../hooks/useHomePageScale";
import { useWebFontsReady } from "../hooks/useWebFontsReady";
import PlayerBackgroundDecor from "../components/stem-player/PlayerBackgroundDecor";
import StarField from "../components/StarField";
import HomePageCardCarousel, {
  type HomePageCardCarouselHandle,
} from "../components/home/HomePageCardCarousel";
import "../styles/background-decor.css";
import "./home-page.css";

/** Fixed reference layout — avoids star/decor rebuild jitter on zoom/resize. */
const BACKGROUND_REFERENCE = { width: 1920, height: 1080 } as const;

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const releases = getReleases();
  const listRef = useRef<HomePageCardCarouselHandle>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  useHomePageScale(rootRef);
  const fontsReady = useWebFontsReady();
  const decorPlacements = useMemo(
    () => buildBackgroundDecorLayout(BACKGROUND_REFERENCE.width, BACKGROUND_REFERENCE.height),
    [],
  );

  return (
    <>
      <div ref={rootRef} className="home-page-root">
        {fontsReady ? <PlayerBackgroundDecor placements={decorPlacements} /> : null}
        <StarField
          width={STAR_FIELD_REFERENCE.width}
          height={STAR_FIELD_REFERENCE.height}
        />
        <div className="home-page-frame">
          <img
            src={figmaAssets.homePageCircles}
            alt=""
            className="home-page-decor-circles pointer-events-none"
          />
          <img
            src={figmaAssets.homePageBigStars}
            alt=""
            className="home-page-decor-big-stars pointer-events-none"
          />

          <div className="home-page-main">
            <div className="home-page-hero">
              <div className="home-page-title-group">
                <div className="home-page-title-group__bubble">
                  <img src={figmaAssets.homePageBubble} alt="" />
                  <p className="type-swiss721-condensed-italic home-page-title-group__bubble-text">
                    Stem Player
                  </p>
                </div>
                <div className="home-page-title-group__logo">
                  <img src={figmaAssets.homePageTitle} alt="NewJeans" />
                </div>
              </div>

              <HomePageCardCarousel
                ref={listRef}
                scrollRootRef={rootRef}
                releases={releases}
                onScrolledChange={setIsScrolled}
              />
            </div>
          </div>
        </div>

        <div className="home-page-bottom home-page-bottom--floor">
          <img
            src={figmaAssets.homePageFloor}
            alt=""
            className="home-page-bottom-floor pointer-events-none"
          />
        </div>
      </div>

      <div className="home-page-bottom home-page-bottom--ui">
        <div className="home-page-footer">
          <button
            type="button"
            aria-label="Back to top"
            onClick={() => listRef.current?.scrollToTop()}
            className={`home-page-back-up ${
              isScrolled ? "home-page-back-up--visible" : "home-page-back-up--hidden"
            }`}
          >
            <img src={figmaAssets.homePageBackUp} alt="" />
          </button>

          <div className="home-page-footer-row">
            <div className="home-page-footer-credits">
              <p className="type-swiss721-regular home-page-footer-credits__text">
                Made by @sekai737
              </p>
              <div className="home-page-hearts">
                <img
                  src={figmaAssets.homePageHeartMinji}
                  alt=""
                  className="home-page-heart home-page-heart--minji"
                />
                <img
                  src={figmaAssets.homePageHeartHanni}
                  alt=""
                  className="home-page-heart home-page-heart--hanni"
                />
                <img
                  src={figmaAssets.homePageHeartDanielle}
                  alt=""
                  className="home-page-heart home-page-heart--danielle"
                />
                <img
                  src={figmaAssets.homePageHeartHaerin}
                  alt=""
                  className="home-page-heart home-page-heart--haerin"
                />
                <img
                  src={figmaAssets.homePageHeartHyein}
                  alt=""
                  className="home-page-heart home-page-heart--hyein"
                />
              </div>
            </div>
            <a
              href={catalog.creator.litLink}
              target="_blank"
              rel="noreferrer"
              aria-label="Creator lit.link"
              className="home-page-footer-pfp"
            >
              <img src="/figma/creator-pfp.png" alt="" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
