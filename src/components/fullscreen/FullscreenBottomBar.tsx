import { figmaAssets } from "../../figma/assets";
import { FIGMA_FULLSCREEN as FS } from "../../figma/fullscreenLayout";

interface FullscreenBottomBarProps {
  label: string;
}

/** Decorative track navigation pill (Figma node 120:143). */
export default function FullscreenBottomBar({ label }: FullscreenBottomBarProps) {
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
        <img
          src={figmaAssets.send}
          alt=""
          className="fs-footer__send"
          width={FS.footer.sendIconWidth}
          height={FS.footer.sendIconHeight}
          draggable={false}
          aria-hidden
        />
      </div>
    </footer>
  );
}
