import { useEffect, useRef } from "react";
import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";
import type { SongLrcFiles } from "../../types";
import FigmaIconButton from "../stem-player/FigmaIconButton";
import LyricsConversionPanel from "./LyricsConversionPanel";

interface FullscreenHeaderProps {
  onBack: () => void;
  conversionsOpen: boolean;
  onToggleConversions: () => void;
  onCloseConversions: () => void;
  lrc?: SongLrcFiles;
  masterMixAvailable: boolean;
}

export default function FullscreenHeader({
  onBack,
  conversionsOpen,
  onToggleConversions,
  onCloseConversions,
  lrc,
  masterMixAvailable,
}: FullscreenHeaderProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const iconSize = FIGMA.header.icon;

  useEffect(() => {
    if (!conversionsOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      onCloseConversions();
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [conversionsOpen, onCloseConversions]);

  return (
    <header className="fs-header">
      <div className="fs-header__inner">
        <FigmaIconButton
          label="Back"
          src={figmaAssets.backButton}
          onClick={onBack}
          size={iconSize}
        />
        <h1 className="fs-header__title header-title">Stem Player Fullscreen Mode</h1>
        <div className="fs-header__menu" ref={menuRef}>
          <FigmaIconButton
            label="Lyrics conversions"
            src={figmaAssets.menuButton}
            onClick={onToggleConversions}
            size={iconSize}
            aria-expanded={conversionsOpen}
            aria-haspopup="dialog"
          />
          {conversionsOpen ? (
            <LyricsConversionPanel lrc={lrc} masterMixAvailable={masterMixAvailable} />
          ) : null}
        </div>
      </div>
    </header>
  );
}
