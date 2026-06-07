import { figmaAssets } from "../../figma/assets";

interface SongSelectCarouselProps {
  currentArt: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function NavButton({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const src =
    direction === "prev" ? figmaAssets.songSelectBack : figmaAssets.songSelectNext;

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`song-select-carousel__nav song-select-carousel__nav--${direction}`}
    >
      <img src={src} alt="" className="song-select-carousel__nav-icon" draggable={false} />
    </button>
  );
}

/** Figma 262:380 — Images Container (main cover + prev/next controls). */
export default function SongSelectCarousel({
  currentArt,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: SongSelectCarouselProps) {
  return (
    <div className="song-select-carousel-wrap">
      <div className="song-select-carousel">
        <NavButton
          direction="prev"
          label="Previous song"
          disabled={!canGoPrevious}
          onClick={onPrevious}
        />
        <div className="song-select-carousel__center">
          <img src={currentArt} alt="" className="song-select-carousel__center-art" draggable={false} />
        </div>
        <NavButton
          direction="next"
          label="Next song"
          disabled={!canGoNext}
          onClick={onNext}
        />
      </div>
    </div>
  );
}
