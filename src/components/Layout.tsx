import { useEffect, type ReactNode } from "react";
import { catalog } from "../data/catalog";
import CreatorLinks from "./CreatorLinks";

interface LayoutProps {
  children: ReactNode;
  footer?: boolean;
  /** Full-viewport stem player — no site chrome */
  bare?: boolean;
}

export default function Layout({ children, footer = true, bare = false }: LayoutProps) {
  useEffect(() => {
    if (!bare) return;
    document.body.classList.add("figma-player");
    return () => document.body.classList.remove("figma-player");
  }, [bare]);

  if (bare) {
    return (
      <div className="figma-player fixed inset-0 flex justify-center overflow-hidden">{children}</div>
    );
  }

  return (
    <div
      className={`mx-auto flex w-full max-w-[1800px] flex-col px-4 py-2 sm:px-6 lg:px-8 ${
        footer ? "min-h-screen" : "fixed inset-0 overflow-hidden"
      }`}
    >
      <header className="mb-2 flex items-center justify-between gap-4 rounded-full border border-white/70 bg-white/45 px-4 py-1.5 shadow-sm backdrop-blur">
        <div>
          <p className="text-[10px] font-bold tracking-[0.24em] text-nj-pink uppercase">
            Fan stem explorer
          </p>
          <h1 className="text-base font-black tracking-tight text-nj-ink sm:text-lg">
            NewJeans Stem Player
          </h1>
        </div>
      </header>
      <main className="min-h-0 flex-1">{children}</main>
      {footer && (
        <footer className="mt-10 flex items-end justify-between gap-4 border-t border-black/5 pt-4">
          <CreatorLinks
            youtube={catalog.creator.youtube}
            links={catalog.creator.links}
          />
        </footer>
      )}
    </div>
  );
}
