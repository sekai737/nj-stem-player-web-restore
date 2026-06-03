import type { HTMLAttributes, ReactNode } from "react";
import { useClickToCopy } from "../hooks/useClickToCopy";

interface SelectableCopyRegionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Accessible label for the copy interaction region */
  copyLabel?: string;
  /** Classes for the inner copy/selection target (e.g. overflow clipping) */
  regionClassName?: string;
  /** Set false when children need their own click handlers (fullscreen lyric seek). */
  enablePointerCapture?: boolean;
}

/**
 * Lyrics / metadata only — selectable text plus click/tap-to-copy on release.
 * @see .selectable-copy in index.css
 */
export default function SelectableCopyRegion({
  children,
  className = "",
  regionClassName = "",
  copyLabel = "Copy text",
  enablePointerCapture = true,
  style,
  ...rest
}: SelectableCopyRegionProps) {
  const { ref, copied, onPointerDown, onPointerUp, onPointerCancel } =
    useClickToCopy<HTMLDivElement>({ enablePointerCapture });

  return (
    <div
      className={`selectable-copy-region-wrap ${className}`.trim()}
      style={style}
      data-copied={copied || undefined}
      {...rest}
    >
      <div
        ref={ref}
        role="group"
        aria-label={copyLabel}
        className={`selectable-copy selectable-copy-region ${regionClassName}`.trim()}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {children}
      </div>
      <span className="selectable-copy-toast" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
