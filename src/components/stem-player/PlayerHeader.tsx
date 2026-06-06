import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";
import type { StemTrack } from "../../types";
import { usePlayerStore } from "../../store/playerStore";
import SongNavMenu from "../SongNavMenu";
import FigmaIconButton from "./FigmaIconButton";

interface PlayerHeaderProps {
  releaseId: string;
  songTitle: string;
  stems: StemTrack[];
  stemsZipFiles?: string[];
  midiSrc?: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function PlayerHeader({
  releaseId,
  songTitle,
  stems,
  stemsZipFiles,
  midiSrc,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: PlayerHeaderProps) {
  return (
    <header
      className="absolute left-0 right-0 top-0 z-20 flex w-full shrink-0 items-center justify-between"
      style={{ height: FIGMA.header.height }}
    >
      <div
        className="flex shrink-0 items-center"
        style={{ gap: FIGMA.header.iconGap }}
      >
        <FigmaIconButton
          label="Back to song selection"
          src={figmaAssets.stemPageBack}
          to={`/release/${releaseId}`}
        />
        <FigmaIconButton label="Home" src={figmaAssets.home} to="/" />
      </div>

      <h1 className="header-title absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-content-primary">
        Stem Player
      </h1>

      <div
        className="relative flex shrink-0 items-center"
        style={{ gap: FIGMA.header.iconGap }}
      >
        <FigmaIconButton
          label="Full screen"
          src={figmaAssets.fullscreen}
          onClick={() => {
            const open = usePlayerStore.getState().fullscreenOpen;
            usePlayerStore.getState().setFullscreenOpen(!open);
          }}
        />
        <span data-song-nav-trigger className="inline-flex shrink-0">
          <FigmaIconButton
            label="Song menu"
            src={figmaAssets.settings}
            onClick={() => usePlayerStore.setState((s) => ({ menuOpen: !s.menuOpen }))}
          />
        </span>
        <SongNavMenu
          songTitle={songTitle}
          stems={stems}
          stemsZipFiles={stemsZipFiles}
          midiSrc={midiSrc}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </div>
    </header>
  );
}
