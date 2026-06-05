import type { RemixItem } from "../../types";
import { formatTime } from "../../utils/time";

interface RemixListItemProps {
  remix: RemixItem;
  fallbackCoverArt: string;
  onSelect: (songId: string) => void;
}

function formatSource(source: string): string {
  return source === "sekai" ? "sekai" : source;
}

export default function RemixListItem({ remix, fallbackCoverArt, onSelect }: RemixListItemProps) {
  const coverArt = remix.coverArt ?? fallbackCoverArt;
  const isSekai = remix.source === "sekai";

  return (
    <button
      type="button"
      onClick={() => onSelect(remix.songId)}
      className="flex w-full items-center gap-3 rounded-2xl bg-white/70 p-3 text-left ring-1 ring-black/5 transition hover:bg-white hover:ring-nj-pink/30"
    >
      <img
        src={coverArt}
        alt=""
        className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-black/10"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-nj-ink">{remix.title}</p>
        <p className={`truncate text-sm text-nj-muted ${isSekai ? "font-semibold lowercase tracking-wide" : ""}`}>
          {formatSource(remix.source)}
        </p>
      </div>
      {remix.durationSec != null && (
        <span className="shrink-0 text-sm tabular-nums text-nj-muted">{formatTime(remix.durationSec)}</span>
      )}
    </button>
  );
}
