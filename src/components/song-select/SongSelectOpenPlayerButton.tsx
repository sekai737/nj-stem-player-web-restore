import { figmaAssets } from "../../figma/assets";
import { FIGMA_SONG_SELECT } from "../../figma/songSelectLayout";
import "./song-select-open-player-button.css";

interface SongSelectOpenPlayerButtonProps {
  songTitle: string;
  onClick: () => void;
}

/** Figma 262:354 — pill + label (262:382); label from song-select-open-player-text.svg */
export default function SongSelectOpenPlayerButton({
  songTitle,
  onClick,
}: SongSelectOpenPlayerButtonProps) {
  const { width, height, text } = FIGMA_SONG_SELECT.openPlayer;

  return (
    <button
      type="button"
      className="song-select-open-player"
      style={{ width, height, borderRadius: height / 2 }}
      aria-label={`Open stem player for ${songTitle}`}
      onClick={onClick}
    >
      <img
        src={figmaAssets.songSelectOpenPlayerText}
        alt=""
        className="song-select-open-player__text"
        style={{
          left: text.left,
          top: text.top,
          width: text.width,
          height: text.height,
        }}
        draggable={false}
      />
    </button>
  );
}
