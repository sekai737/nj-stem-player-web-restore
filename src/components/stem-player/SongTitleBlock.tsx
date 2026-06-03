import { figmaAssets } from "../../figma/assets";
import { coolTitleGlyphClassForIndex, splitTitleGlyphs } from "../../figma/coolTitleStyle";
import { FIGMA } from "../../figma/layout";
import { displayTrackTitle } from "../../utils/displayTrackTitle";
import { formatTime } from "../../utils/time";
import SelectableCopyRegion from "../SelectableCopyRegion";
import "../selectable-copy-stem.css";

interface SongTitleBlockProps {
  releaseId: string;
  songId: string;
  title: string;
  durationSec: number;
  keyLabel: string;
  bpm: number;
}

/**
 * Figma Title (26:216) — dev-mode absolute frames (MCP): 3:314, 3:280 fixed;
 * track title (3:282) is vertically centered in the 22…108px band for even NP↔title / title↔metadata gaps.
 */
/** Figma-centered COOL title (3:282) — reference layout; all other tracks left-align to NP + metadata. */
const SUPERNATURAL_TITLE_SONG_ID = "supernatural-title";

export default function SongTitleBlock({
  releaseId: _releaseId,
  songId,
  title,
  durationSec,
  keyLabel,
  bpm,
}: SongTitleBlockProps) {
  const glyphs = splitTitleGlyphs(displayTrackTitle(title));
  const stack = FIGMA.titleRow.titleStack;
  const useSupernaturalTitleLayout = songId === SUPERNATURAL_TITLE_SONG_ID;
  const isInstrumental = songId.endsWith("-instrumental");
  const trackTitleFrame = useSupernaturalTitleLayout
    ? stack.trackTitleSlot
    : {
        left: stack.nowPlaying.left,
        top: stack.trackTitleSlot.top,
        width: FIGMA.titleRow.titleWidth,
        height: stack.trackTitleSlot.height,
      };

  return (
    <div
      className="relative shrink-0"
      style={{
        width: FIGMA.titleRow.titleWidth,
        height: FIGMA.titleRow.titleHeight,
      }}
    >
      <img
        src={figmaAssets.nowPlaying}
        alt=""
        className="absolute block max-w-none"
        data-node-id="3:314"
        data-name="Now Playing"
        style={{
          left: stack.nowPlaying.left,
          top: stack.nowPlaying.top,
          width: stack.nowPlaying.width,
          height: stack.nowPlaying.height,
        }}
      />

      <div
        className={`absolute flex items-center overflow-visible ${
          useSupernaturalTitleLayout ? "justify-center" : "justify-start"
        }`}
        data-node-id="3:282"
        data-name="Title display name"
        style={trackTitleFrame}
      >
        <div className="title-cool-block shrink-0">
          <p className="title-cool-line">
            {glyphs.map((glyph, index) => (
              <span key={`${index}-${glyph}`} className={coolTitleGlyphClassForIndex(index)}>
                {glyph}
              </span>
            ))}
          </p>
        </div>
      </div>

      <SelectableCopyRegion
        copyLabel="Track metadata"
        className="stem-metadata-copy absolute min-w-0"
        data-node-id="3:280"
        style={{
          left: stack.metadata.left,
          top: stack.metadata.top,
          width: stack.metadata.width,
          height: stack.metadata.height,
        }}
        regionClassName="flex h-full min-h-0 w-full min-w-0 items-center"
      >
        <div className="title-metadata-block">
          <p className="title-track-metadata text-content-primary" data-copy-block>
            {formatTime(durationSec)}  ·  {keyLabel}  ·  {bpm} BPM
            {isInstrumental ? "  ·  (Instrumental)" : ""}
          </p>
        </div>
      </SelectableCopyRegion>
    </div>
  );
}
