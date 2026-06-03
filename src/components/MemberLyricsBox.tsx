import "./member-lyrics-box.css";
import { LYRICS_FIGMA } from "../figma/lyricsLayout";

const M = LYRICS_FIGMA.memberBox;

interface MemberLyricsBoxProps {
  portrait: string;
  name: string;
  loading?: boolean;
  fontsReady?: boolean;
  /** When false, icon and name are hidden but the blue pill stays visible */
  visible?: boolean;
}

/** Member pill with portrait + name (Figma node 3:54) */
export default function MemberLyricsBox({
  portrait,
  name,
  loading = false,
  fontsReady = true,
  visible = true,
}: MemberLyricsBoxProps) {
  const contentHidden = !visible;
  const hiddenClass = contentHidden ? " member-lyrics-box__content--hidden" : "";

  return (
    <div className="member-lyrics-box" style={{ height: M.height }} data-node-id="3:54">
      {loading && visible ? (
        <div
          className="member-lyrics-box__spinner animate-spin rounded-full border-2 border-content-secondary/25 border-t-content-primary"
          aria-hidden
        />
      ) : (
        <img
          src={portrait}
          alt=""
          className={`member-lyrics-box__portrait${hiddenClass}`}
          aria-hidden={contentHidden}
        />
      )}
      <span
        key={fontsReady ? "fonts-ready" : "fonts-pending"}
        className={`member-lyrics-box__name lyric-member-name${hiddenClass}`}
        aria-hidden={contentHidden}
      >
        {name}
      </span>
    </div>
  );
}
