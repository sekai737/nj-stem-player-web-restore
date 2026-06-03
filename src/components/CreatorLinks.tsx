interface CreatorLinksProps {
  twitter: string;
  linktree: string;
}

export default function CreatorLinks({ twitter, linktree }: CreatorLinksProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-nj-muted">
      <a
        href={twitter}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 transition hover:border-nj-pink/40 hover:text-nj-pink"
        aria-label="Creator on X"
      >
        𝕏
      </a>
      <a
        href={linktree}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 transition hover:border-nj-pink/40 hover:text-nj-pink"
      >
        Linktree
      </a>
    </div>
  );
}
