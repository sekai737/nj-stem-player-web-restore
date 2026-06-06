interface CreatorLinksProps {
  youtube: string;
  litLink: string;
}

export default function CreatorLinks({ youtube, litLink }: CreatorLinksProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-nj-muted">
      <a
        href={youtube}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 transition hover:border-nj-pink/40 hover:text-nj-pink"
        aria-label="Creator on YouTube"
      >
        YouTube
      </a>
      <a
        href={litLink}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 transition hover:border-nj-pink/40 hover:text-nj-pink"
        aria-label="My Links"
      >
        My Links
      </a>
    </div>
  );
}
