import type { RemixItem } from "../../types";
import RemixListItem from "./RemixListItem";

interface RemixCategoryListProps {
  title: string;
  remixes: RemixItem[];
  fallbackCoverArt: string;
  emptyMessage: string;
  onSelect: (songId: string) => void;
}

export default function RemixCategoryList({
  title,
  remixes,
  fallbackCoverArt,
  emptyMessage,
  onSelect,
}: RemixCategoryListProps) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold tracking-wide text-nj-muted uppercase">{title}</h4>
      {remixes.length === 0 ? (
        <p className="rounded-2xl bg-white/50 px-4 py-5 text-center text-sm text-nj-muted ring-1 ring-black/5">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {remixes.map((remix) => (
            <li key={remix.id}>
              <RemixListItem remix={remix} fallbackCoverArt={fallbackCoverArt} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
