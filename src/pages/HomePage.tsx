import Layout from "../components/Layout";
import ReleaseCard from "../components/ReleaseCard";
import { getReleases } from "../data/catalog";

export default function HomePage() {
  const releases = getReleases();

  return (
    <Layout>
      <p className="mb-4 max-w-2xl text-nj-muted">
        Browse NewJeans releases from newest to oldest, then open a release to pick a song and
        explore its stems.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {releases.map((release) => (
          <ReleaseCard key={release.id} release={release} />
        ))}
      </div>
    </Layout>
  );
}
