import type { CSSProperties } from "react";
import SliderKnob from "../SliderKnob";
import { figmaAssets } from "../../figma/assets";
import { FIGMA_FULLSCREEN as FS } from "../../figma/fullscreenLayout";
import {
  displayTrackTitle,
  PLAYER_ARTIST_NAME,
  trackTitleSuffixes,
} from "../../utils/displayTrackTitle";
import { formatTime } from "../../utils/time";
import FigmaIconButton from "../stem-player/FigmaIconButton";
import "./fullscreen-player-card.css";
const PC = FS.playerCard;

interface FullscreenPlayerCardProps {
  artwork: string;
  title: string;
  releaseTitle: string;
  releaseType: string;
  year: number;
  isPlaying: boolean;
  currentTime: number;
  durationSec: number;
  disabled?: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export default function FullscreenPlayerCard({
  artwork,
  title,
  releaseTitle,
  releaseType,
  year,
  isPlaying,
  currentTime,
  durationSec,
  disabled = false,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
  hasPrevious,
  hasNext,
}: FullscreenPlayerCardProps) {
  const safeDuration = durationSec > 0 ? durationSec : 0;
  const titleSuffixes = trackTitleSuffixes(title);
  const progressPct = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;
  const thumbHalf = PC.progressThumbSize / 2;
  /** Keep knob center inside track so it does not overlap time labels at 0% / 100%. */
  const thumbOffset = `calc(${thumbHalf}px + (100% - ${PC.progressThumbSize}px) * ${progressPct / 100})`;
  const elapsedWidth = thumbOffset;

  const handleSeek = (value: string) => {
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    onSeek(Math.max(0, Math.min(next, safeDuration || 0)));
  };

  const cardVars = {
    "--fs-card-usable-ref": `${FS.main.usableHeight}px`,
    "--fs-card-design-w": `${PC.designWidth}px`,
    "--fs-card-design-h": `${PC.designHeight}px`,
    "--fs-card-inner-width": `${PC.innerWidth}px`,
    "--fs-card-inner-height": `${PC.innerHeight}px`,
    "--fs-card-art-size": `${PC.artSize}px`,
    "--fs-card-meta-width": `${PC.metaWidth}px`,
    "--fs-card-title-line-height": `${PC.titleLineHeight}px`,
    "--fs-card-progress-row-width": `${PC.progressRowWidth}px`,
    "--fs-card-thumb-size": `${PC.progressThumbSize}px`,
    "--fs-player-meta-artist-gap": `${PC.artistOffsetTop}px`,
    "--fs-player-meta-album-gap": `${PC.albumOffsetTop}px`,
  } as CSSProperties;

  return (
    <article
      className="fs-player-card"
      style={cardVars}
      aria-label="Now playing"
      data-node-id="121:299"
    >
      <div className="fs-player-card__scale">
        <div className="fs-player-card__frame" aria-hidden data-node-id="120:298" />

        <div
          className="fs-player-card__inner"
          style={{
            width: PC.innerWidth,
            marginLeft: PC.contentInsetX,
            marginRight: PC.contentInsetX,
            paddingTop: PC.contentInsetTop,
            gap: PC.sectionGap,
          }}
          data-node-id="121:334"
        >
        <img
          src={artwork}
          alt=""
          className="fs-player-card__art"
          width={PC.artSize}
          height={PC.artSize}
          data-node-id="120:297"
          draggable={false}
        />

        <div className="fs-player-card__meta" data-node-id="121:332">
          <h2 className="fs-player-card__title" data-node-id="121:316">
            {displayTrackTitle(title)}
          </h2>
          <p className="fs-player-card__artist" data-node-id="121:317">
            {PLAYER_ARTIST_NAME}
          </p>
          <p className="fs-player-card__album" data-node-id="121:318">
            {releaseTitle} {releaseType} · {year}
            {titleSuffixes.map((suffix) => ` · ${suffix}`).join("")}
          </p>
        </div>

        <div
          className="fs-player-card__transport"
          style={{ gap: PC.transportGap }}
          data-node-id="121:314"
        >
          <FigmaIconButton
            label="Previous song"
            src={figmaAssets.previousSong}
            size={PC.navIconSize}
            disabled={disabled || !hasPrevious}
            onClick={onPrevious}
            data-node-id="121:303"
          />
          <button
            type="button"
            className="fs-player-card__play"
            disabled={disabled}
            style={{ width: PC.playSize, height: PC.playSize }}
            onClick={() => void onTogglePlay()}
            aria-label={disabled ? "Loading" : isPlaying ? "Pause" : "Play"}
            data-node-id="121:313"
          >
            {isPlaying ? (
              <>
                <span className="fs-player-card__play-ring" aria-hidden data-node-id="121:312" />
                <img
                  className="fs-player-card__play-icon fs-player-card__play-icon--pause"
                  src={figmaAssets.pause}
                  alt=""
                  width={PC.playIconWidth}
                  height={PC.playIconHeight}
                  draggable={false}
                  data-node-id="121:309"
                />
              </>
            ) : (
              <>
                <span className="fs-player-card__play-ring" aria-hidden />
                <img
                  className="fs-player-card__play-icon fs-player-card__play-icon--play"
                  src={figmaAssets.play}
                  alt=""
                  width={PC.playIconWidth}
                  height={PC.playIconHeight}
                  draggable={false}
                  data-node-id="121:309"
                />
              </>
            )}
          </button>
          <FigmaIconButton
            label="Next song"
            src={figmaAssets.nextSong}
            size={PC.navIconSize}
            disabled={disabled || !hasNext}
            onClick={onNext}
            data-node-id="121:306"
          />
        </div>

        <div
          className="fs-player-card__progress"
          style={{ gap: PC.progressRowGap }}
          data-node-id="121:331"
        >
          <span className="fs-player-card__time" data-node-id="121:319">
            {formatTime(currentTime)}
          </span>
          <div
            className="fs-player-card__scrubber"
            style={{ width: PC.progressWidth, height: PC.progressHeight }}
            data-node-id="121:325"
          >
            <div className="fs-player-card__track" aria-hidden data-node-id="121:320" />
            <div
              className="fs-player-card__elapsed"
              style={{ width: elapsedWidth }}
              aria-hidden
              data-node-id="121:321"
            />
            <div
              className="fs-player-card__thumb"
              style={{ left: thumbOffset }}
              aria-hidden
              data-node-id="121:322"
            >
              <SliderKnob size={PC.progressThumbSize} />
            </div>
            <input
              type="range"
              min={0}
              max={safeDuration || 1}
              step={0.01}
              value={Math.min(currentTime, safeDuration || 0)}
              disabled={disabled || safeDuration <= 0}
              aria-label="Song timeline"
              onChange={(e) => handleSeek(e.target.value)}
              onInput={(e) => handleSeek(e.currentTarget.value)}
            />
          </div>
          <span className="fs-player-card__time" data-node-id="121:323">
            {formatTime(safeDuration)}
          </span>
        </div>
      </div>
      </div>
    </article>
  );
}
