import { usePlayerStore } from "../store/playerStore";
import "./stems-loading-overlay.css";

interface StemsLoadingOverlayProps {
  songTitle?: string;
}

export default function StemsLoadingOverlay({ songTitle }: StemsLoadingOverlayProps) {
  const loading = usePlayerStore((s) => s.stemsLoading);
  const progress = usePlayerStore((s) => s.stemsLoadProgress);
  const error = usePlayerStore((s) => s.stemsLoadError);

  if (!loading && !error) return null;

  if (!loading && error) {
    return (
      <div
        className="absolute inset-0 z-30 flex items-center justify-center rounded-cr bg-surface-primary/90 backdrop-blur-md"
        role="alert"
      >
        <div className="stems-loading__panel figma-surface w-full max-w-sm rounded-cr px-6 py-7 text-center">
          <p className="type-swiss721-medium text-sm uppercase tracking-wide text-content-primary">
            Stems unavailable
          </p>
          <p className="mt-2 text-xs leading-relaxed text-content-secondary">{error}</p>
        </div>
      </div>
    );
  }

  const pct = Math.round(progress * 100);

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center rounded-cr bg-surface-primary/90 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Loading stems for ${songTitle ?? "song"}`}
    >
      <div className="stems-loading__panel figma-surface w-full max-w-xs rounded-cr px-6 py-7 text-center">
        <div
          className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-content-secondary/25 border-t-content-primary"
          aria-hidden
        />
        <p className="type-swiss721-medium text-sm uppercase tracking-wide text-content-primary">
          Loading stems…
        </p>
        {songTitle && <p className="mt-1 truncate text-xs text-content-secondary">{songTitle}</p>}
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-stem-waveform">
          <div
            className="h-full rounded-full bg-content-primary transition-[width] duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs tabular-nums text-content-secondary">{pct}%</p>
      </div>
    </div>
  );
}
