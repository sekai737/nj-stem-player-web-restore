import { useMemo, useState } from "react";
import { groupRemixesByCategory, getRemixesForSong } from "../../data/catalog";
import RemixCategoryList from "./RemixCategoryList";

interface RemixSectionProps {
  releaseId: string;
  songId: string;
  releaseCoverArt: string;
  onSelectRemix: (songId: string) => void;
}

export default function RemixSection({
  releaseId,
  songId,
  releaseCoverArt,
  onSelectRemix,
}: RemixSectionProps) {
  const [open, setOpen] = useState(false);
  const remixes = useMemo(() => getRemixesForSong(releaseId, songId), [releaseId, songId]);
  const grouped = useMemo(() => groupRemixesByCategory(remixes), [remixes]);

  return (
    <section className="w-full">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-full border border-black/10 bg-white/70 px-5 py-3 text-sm font-bold text-nj-ink shadow-sm transition hover:border-nj-pink/40 hover:text-nj-pink"
      >
        <span>Remixes</span>
        <span aria-hidden className="text-lg leading-none text-nj-muted">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-6 rounded-3xl bg-white/45 p-4 ring-1 ring-black/5">
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
      )}
    </section>
  );
}
