import type { CSSProperties } from "react";
import "./synced-lyrics.css";

interface LyricIdlingIndicatorProps {
  /** 0–1 progress through the pause gap. */
  progress: number;
  /** ms per dot transition (lyrics-plus `--indicator-delay`). */
  delayMs: number;
}

/** lyrics-plus `IdlingIndicator` for long instrumental gaps. */
export default function LyricIdlingIndicator({ progress, delayMs }: LyricIdlingIndicatorProps) {
  return (
    <div
      className="synced-lyrics__idling"
      style={{ "--indicator-delay": `${delayMs}ms` } as CSSProperties}
      aria-hidden
    >
      <span className={`synced-lyrics__idling-dot${progress >= 0.05 ? " synced-lyrics__idling-dot--active" : ""}`} />
      <span className={`synced-lyrics__idling-dot${progress >= 0.33 ? " synced-lyrics__idling-dot--active" : ""}`} />
      <span className={`synced-lyrics__idling-dot${progress >= 0.66 ? " synced-lyrics__idling-dot--active" : ""}`} />
    </div>
  );
}
