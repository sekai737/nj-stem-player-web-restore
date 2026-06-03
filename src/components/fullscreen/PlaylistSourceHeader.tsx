import type { Release } from "../../types";

interface PlaylistSourceHeaderProps {
  release: Release;
  onMenuClick: () => void;
}

export default function PlaylistSourceHeader({ release, onMenuClick }: PlaylistSourceHeaderProps) {
  return (
    <header className="fs-source-header">
      <button
        type="button"
        className="fs-icon-btn fs-source-header__menu"
        onClick={onMenuClick}
        aria-label="Open queue"
      >
        <span className="fs-hamburger" aria-hidden />
      </button>
      <div className="fs-source-header__text">
        <p className="fs-source-header__label">Playing from {release.type.toLowerCase()}</p>
        <p className="fs-source-header__name">{release.title}</p>
      </div>
    </header>
  );
}
