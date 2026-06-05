import type { MouseEvent } from "react";
import { figmaAssets } from "../../figma/assets";
import { FIGMA_FULLSCREEN as FS } from "../../figma/fullscreenLayout";

interface FullscreenBottomBarProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

/** Track navigation pill (Figma node 120:143). */
export default function FullscreenBottomBar({
  label,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: FullscreenBottomBarProps) {
  const handleSendClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.shiftKey) {
      if (hasPrevious) onPrevious();
      return;
    }
    if (hasNext) onNext();
  };

  return (
    <footer className="fs-footer" style={{ height: FS.footer.height }}>
      <div
        className="fs-footer__pill"
        style={{
          borderRadius: FS.footer.pillRadius,
          padding: `${FS.footer.pillPaddingY}px ${FS.footer.pillPaddingX}px`,
        }}
      >
        <p className="fs-footer__text">{label}</p>
        <button
          type="button"
          className="fs-footer__send"
          aria-label="Next song. Shift-click for previous song."
          disabled={!hasPrevious && !hasNext}
          onClick={handleSendClick}
        >
          <img
            src={figmaAssets.send}
            alt=""
            width={FS.footer.sendIconWidth}
            height={FS.footer.sendIconHeight}
            draggable={false}
            aria-hidden
          />
        </button>
      </div>
    </footer>
  );
}
