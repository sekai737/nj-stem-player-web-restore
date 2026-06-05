import { Link } from "react-router-dom";
import { getReleaseCoverArt, getSelectableSongs } from "../data/catalog";
import type { Release } from "../types";

interface ReleaseCardProps {
  release: Release;
}

export default function ReleaseCard({ release }: ReleaseCardProps) {
  const songCount = getSelectableSongs(release).length;

  return (
    <article className="group flex gap-4 rounded-3xl bg-nj-card p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-nj-pink/30">
      <img
        src={getReleaseCoverArt(release)}
        alt=""
        className="h-28 w-28 shrink-0 rounded-2xl object-cover shadow-inner ring-1 ring-black/5"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-nj-muted uppercase">
            {release.type} · {release.year}
          </p>
          <h2 className="truncate text-xl font-bold text-nj-ink">{release.title}</h2>
          <p className="mt-1 text-sm text-nj-muted">
            {songCount} song{songCount === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          to={`/release/${release.id}`}
          className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-nj-pink px-4 py-2 text-sm font-semibold text-white shadow-md shadow-nj-pink/25 transition group-hover:bg-nj-pink-dark"
        >
          <span aria-hidden>▶</span>
          Play
        </Link>
      </div>
    </article>
  );
}
