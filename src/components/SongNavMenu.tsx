import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { StemTrack } from "../types";
import { downloadSongMidi, downloadSongStems } from "../utils/downloadStems";
import { usePlayerStore } from "../store/playerStore";
import "./song-nav-menu.css";

interface SongNavMenuProps {
  releaseId: string;
  songTitle: string;
  stems: StemTrack[];
  /** When set, stem ZIP download uses these paths instead of `stems` */
  stemsZipFiles?: string[];
  /** Public path to .mid / .midi; omit to disable the menu item */
  midiSrc?: string;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export default function SongNavMenu({
  releaseId,
  songTitle,
  stems,
  stemsZipFiles,
  midiSrc,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: SongNavMenuProps) {
  const menuOpen = usePlayerStore((s) => s.menuOpen);
  const setMenuOpen = usePlayerStore((s) => s.setMenuOpen);
  const [downloadingStems, setDownloadingStems] = useState(false);
  const [stemsZipProgress, setStemsZipProgress] = useState<string | null>(null);
  const [downloadingMidi, setDownloadingMidi] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (navRef.current?.contains(target)) return;
      const el = e.target as Element | null;
      if (el?.closest("[data-song-nav-trigger]")) return;
      setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, setMenuOpen]);

  if (!menuOpen) return null;

  const handleDownloadStems = async () => {
    setDownloadError(null);
    setStemsZipProgress(null);
    setDownloadingStems(true);
    try {
      await downloadSongStems(songTitle, stems, stemsZipFiles, setStemsZipProgress);
      setMenuOpen(false);
    } catch (err) {
      console.warn(err);
      setDownloadError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadingStems(false);
      setStemsZipProgress(null);
    }
  };

  const handleDownloadMidi = async () => {
    if (!midiSrc) return;
    setDownloadError(null);
    setDownloadingMidi(true);
    try {
      await downloadSongMidi(songTitle, midiSrc);
      setMenuOpen(false);
    } catch (err) {
      console.warn(err);
      setDownloadError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadingMidi(false);
    }
  };

  const downloadBusy = downloadingStems || downloadingMidi;

  const itemClass =
    "type-swiss721-medium block w-full rounded-cr px-4 py-3 text-left text-[16px] text-content-primary enabled:hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      ref={navRef}
      className="figma-surface absolute top-14 right-0 z-50 min-w-56 rounded-cr p-2"
    >
        <Link
          to={`/release/${releaseId}`}
          className="block rounded-cr px-4 py-3 text-sm font-bold text-text-primary hover:bg-bg-secondary"
          onClick={() => setMenuOpen(false)}
        >
          Back to Song Selection
        </Link>
        <button
          type="button"
          disabled={!hasPrevious}
          className={itemClass}
          onClick={() => {
            onPrevious();
            setMenuOpen(false);
          }}
        >
          Previous Song
        </button>
        <button
          type="button"
          disabled={!hasNext}
          className={itemClass}
          onClick={() => {
            onNext();
            setMenuOpen(false);
          }}
        >
          Next Song
        </button>
        <div className="my-1 border-t border-black/10" />
        <button
          type="button"
          disabled={downloading || stems.length === 0}
          className={itemClass}
          onClick={() => void handleDownload()}
        >
          {downloading ? "Building ZIP…" : "Download Stems (.zip)"}
        </button>
        {downloadError && (
          <p className="px-4 py-2 text-xs font-semibold text-stem-mute">{downloadError}</p>
        )}
      </nav>
  );
}
