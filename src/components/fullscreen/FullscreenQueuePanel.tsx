import { getSongArtwork } from "../../data/catalog";
import { displayTrackTitle } from "../../utils/displayTrackTitle";
import type { Release, Song } from "../../types";

interface FullscreenQueuePanelProps {
  open: boolean;
  release: Release;
  currentSongId: string;
  onSelect: (song: Song) => void;
  onClose: () => void;
}

export default function FullscreenQueuePanel({
  open,
  release,
  currentSongId,
  onSelect,
  onClose,
}: FullscreenQueuePanelProps) {
  if (!open) return null;

  return (
    <>
      <button type="button" className="fs-panel-backdrop" aria-label="Close queue" onClick={onClose} />
      <nav className="fs-queue-panel" aria-label="Release track list">
        <h3 className="fs-queue-panel__title">{release.title}</h3>
        <ul className="fs-queue-panel__list">
          {release.songs.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                className={`fs-queue-panel__item ${track.id === currentSongId ? "fs-queue-panel__item--active" : ""}`}
                onClick={() => onSelect(track)}
              >
                <img src={getSongArtwork(track, release)} alt="" className="fs-queue-panel__art" />
                <span className="fs-queue-panel__name">{displayTrackTitle(track.title)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
