import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import IconButton from "../components/IconButton";
import Layout from "../components/Layout";
import { getRelease } from "../data/catalog";

export default function SongSelectPage() {
  const { releaseId } = useParams();
  const navigate = useNavigate();
  const release = releaseId ? getRelease(releaseId) : undefined;
  const [index, setIndex] = useState(0);

  const song = useMemo(() => release?.songs[index], [release, index]);

  if (!release) return <Navigate to="/" replace />;

  const prev = () => setIndex((i) => (i - 1 + release.songs.length) % release.songs.length);
  const next = () => setIndex((i) => (i + 1) % release.songs.length);

  return (
    <Layout footer={false}>
      <div className="mb-4 flex items-center gap-3">
        <Link to="/" title="Home">
          <IconButton label="Home">⌂</IconButton>
        </Link>
        <div>
          <p className="text-xs font-semibold tracking-wide text-nj-muted uppercase">
            {release.type} · {release.year}
          </p>
          <h2 className="text-2xl font-bold">{release.title}</h2>
        </div>
      </div>

      <section className="mx-auto flex max-w-xl flex-col items-center gap-6 py-6">
        <img
          src={song?.artwork ?? release.coverArt}
          alt=""
          className="aspect-square w-full max-w-sm rounded-3xl object-cover shadow-xl ring-1 ring-black/10"
        />
        <div className="flex w-full items-center justify-between gap-4">
          <IconButton label="Previous Song" variant="pink" onClick={prev}>
            ‹
          </IconButton>
          <div className="min-w-0 text-center">
            <p className="truncate text-2xl font-bold">{song?.title}</p>
            <p className="text-sm text-nj-muted">
              {index + 1} / {release.songs.length}
            </p>
          </div>
          <IconButton label="Next Song" variant="pink" onClick={next}>
            ›
          </IconButton>
        </div>
        <button
          type="button"
          onClick={() => song && navigate(`/release/${release.id}/play/${song.id}`)}
          className="rounded-full bg-nj-pink px-8 py-3 text-sm font-bold text-white shadow-lg shadow-nj-pink/30 hover:bg-nj-pink-dark"
        >
          Open Stem Player
        </button>
      </section>
    </Layout>
  );
}
