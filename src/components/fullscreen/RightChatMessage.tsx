import { forwardRef, type KeyboardEvent } from "react";
import { FIGMA_FULLSCREEN as FS } from "../../figma/fullscreenLayout";
import { formatLyricTimestamp } from "../../utils/fullscreenLyrics";
import LyricText from "../LyricText";
import "./fullscreen-lyric-feed.css";

export interface RightChatMessageProps {
  name: string;
  lines: string[];
  time: number;
  /** Single emoji shown beside the sender name (e.g. 🎤). */
  emoji?: string;
  /** Member emoji PNGs (sekai opener uses all five). */
  emojiIcons?: readonly string[];
  portrait?: string;
  avatarClassName?: string;
  useEmojiAvatar?: boolean;
  active?: boolean;
  onSeek?: (time: number) => void;
}

function seekFromBubbleKey(e: KeyboardEvent, time: number, onSeek?: (time: number) => void) {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  onSeek?.(time);
}

const RightChatMessage = forwardRef<HTMLElement, RightChatMessageProps>(function RightChatMessage(
  {
    name,
    lines,
    time,
    emoji,
    emojiIcons,
    portrait,
    avatarClassName,
    useEmojiAvatar = false,
    active = false,
    onSeek,
  },
  ref,
) {
  const avatarSize = FS.lyricFeed.avatarSize;

  return (
    <article
      ref={ref}
      className="fs-lyric-message fs-lyric-message--right fs-lyric-message--enter"
    >
      <p className="fs-lyric-message__sender">
        <span>{name}</span>
        {emojiIcons?.length ? (
          <span className="fs-lyric-message__emoji-row" aria-hidden>
            {emojiIcons.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                className="fs-lyric-message__emoji"
                width={FS.lyricFeed.emojiSize}
                height={FS.lyricFeed.emojiSize}
                draggable={false}
              />
            ))}
          </span>
        ) : emoji ? (
          <span className="fs-lyric-message__emoji-text" aria-hidden>
            {emoji}
          </span>
        ) : null}
      </p>
      <div className="fs-lyric-message__row">
        {useEmojiAvatar && emoji ? (
          <div
            className="fs-lyric-message__avatar fs-lyric-message__avatar--emoji"
            style={{ height: avatarSize }}
            aria-hidden
          >
            {emoji}
          </div>
        ) : portrait ? (
          <div
            className={`fs-lyric-message__avatar${avatarClassName ? ` ${avatarClassName}` : ""}`}
            style={{ height: avatarSize }}
          >
            <img
              src={portrait}
              alt=""
              width={avatarSize}
              height={avatarSize}
              draggable={false}
            />
          </div>
        ) : null}
        <div
          className={`fs-lyric-bubble${active ? " fs-lyric-bubble--active" : ""}`}
          role={onSeek ? "button" : undefined}
          tabIndex={onSeek ? 0 : undefined}
          data-seek-time={onSeek ? time : undefined}
          onKeyDown={(e) => seekFromBubbleKey(e, time, onSeek)}
        >
          {lines.map((text, i) => (
            <p key={`${time}-${i}`} className="fs-lyric-bubble__line" data-copy-block>
              <LyricText text={text} />
            </p>
          ))}
        </div>
        <time className="fs-lyric-message__time" dateTime={`${time}s`}>
          {formatLyricTimestamp(time)}
        </time>
      </div>
    </article>
  );
});

export default RightChatMessage;
