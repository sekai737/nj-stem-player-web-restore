import { useEffect, useMemo, useRef, useState } from "react";
import { groupRemixesByCategory, getRemixesForSong } from "../../data/catalog";
import { figmaAssets } from "../../figma/assets";
import { measureRemixScrollExtent } from "../../hooks/useSongSelectRemixScroll";
import RemixCategoryList from "../remix/RemixCategoryList";

interface SongSelectRemixPanelProps {
  releaseId: string;
  songId: string;
  releaseCoverArt: string;
  onSelectRemix: (songId: string) => void;
  onOpenChange?: (open: boolean) => void;
  onScrollExtentChange?: (height: number) => void;
  onAutoScroll?: (offset: number) => void;
  remixScrollOffset?: number;
}

export default function SongSelectRemixPanel({
  releaseId,
  songId,
  releaseCoverArt,
  onSelectRemix,
  onOpenChange,
  onScrollExtentChange,
  onAutoScroll,
  remixScrollOffset = 0,
}: SongSelectRemixPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const autoScrolledRef = useRef(false);
  const remixes = useMemo(() => getRemixesForSong(releaseId, songId), [releaseId, songId]);
  const grouped = useMemo(() => groupRemixesByCategory(remixes), [remixes]);

  useEffect(() => {
    setOpen(false);
    autoScrolledRef.current = false;
    onOpenChange?.(false);
    onScrollExtentChange?.(0);
  }, [songId, onOpenChange, onScrollExtentChange]);

  useEffect(() => {
    if (!open) {
      autoScrolledRef.current = false;
      onScrollExtentChange?.(0);
      return;
    }

    const node = panelRef.current;
    if (!node) return;

    const report = () => {
      const root = node.closest(".song-select-root") as HTMLElement | null;
      const extent = measureRemixScrollExtent(node, root, remixScrollOffset);
      onScrollExtentChange?.(extent);
      if (!autoScrolledRef.current && extent > 0) {
        autoScrolledRef.current = true;
        onAutoScroll?.(extent);
      }
    };

    report();
    const rafId = requestAnimationFrame(report);
    const observer = new ResizeObserver(report);
    observer.observe(node);
    window.addEventListener("resize", report);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", report);
    };
  }, [open, remixes, remixScrollOffset, onScrollExtentChange, onAutoScroll]);

  const toggleOpen = () => {
    setOpen((value) => {
      const next = !value;
      onOpenChange?.(next);
      return next;
    });
  };

  return (
    <div className="song-select-remix">
      <button
        type="button"
        aria-expanded={open}
        onClick={toggleOpen}
        className="song-select-remix__toggle"
      >
        <span className="type-swiss721-regular song-select-remix__label">Remixes</span>
        <img
          src={figmaAssets.dropDown}
          alt=""
          className={`song-select-remix__icon${open ? " song-select-remix__icon--open" : ""}`}
          width={24}
          height={24}
          draggable={false}
        />
      </button>

      {open ? (
        <div ref={panelRef} className="song-select-remix__panel">
          <RemixCategoryList
            title="Official Remixes"
            remixes={grouped.official}
            fallbackCoverArt={releaseCoverArt}
            emptyMessage="No official remixes for this track yet."
            onSelect={onSelectRemix}
          />
          <RemixCategoryList
            title="Sekai Remixes"
            remixes={grouped.sekai}
            fallbackCoverArt={releaseCoverArt}
            emptyMessage="No sekai remixes for this track yet."
            onSelect={onSelectRemix}
          />
        </div>
      ) : null}
    </div>
  );
}
