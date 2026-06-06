import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";
import { formatTrackMetadata } from "../../utils/formatTrackMetadata";
import SelectableCopyRegion from "../SelectableCopyRegion";
import CoolTitleDisplay from "./CoolTitleDisplay";
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
 * Figma Title (26:216) — flex-col items-start; Title mr-[-16px] toward lyrics.
 */
export default function SongTitleBlock({
  releaseId: _releaseId,
  songId,
  title,
  durationSec,
  keyLabel,
  bpm,
}: SongTitleBlockProps) {
  const stack = FIGMA.titleRow.titleStack;
  const isInstrumental = songId.endsWith("-instrumental");

  return (
    <div
      className="flex shrink-0 flex-col items-start justify-center"
      data-node-id="26:216"
      data-name="Title"
      style={{
        width: FIGMA.titleRow.titleWidth,
        height: FIGMA.titleRow.titleHeight,
        marginRight: -FIGMA.titleRow.titleLyricsOverlap,
      }}
    >
      <img
        src={figmaAssets.nowPlaying}
        alt=""
        className="block max-w-none shrink-0"
        data-node-id="3:314"
        data-name="Now Playing"
        style={{
          width: stack.nowPlaying.width,
          height: stack.nowPlaying.height,
        }}
      />

      <div
        className="flex shrink-0 items-center justify-start overflow-visible"
        data-node-id="3:282"
        data-name="Title display name"
      >
        <CoolTitleDisplay title={title} />
      </div>

      <SelectableCopyRegion
        copyLabel="Track metadata"
        className="stem-metadata-copy min-w-full shrink-0"
        data-node-id="3:280"
        style={{ width: "min-content", maxWidth: "100%" }}
        regionClassName="flex min-h-0 w-full min-w-0 items-center"
      >
        <div className="title-metadata-block">
          <p className="title-track-metadata text-content-primary" data-copy-block>
            {formatTrackMetadata(durationSec, keyLabel, bpm, { instrumental: isInstrumental })}
          </p>
        </div>
      </SelectableCopyRegion>
    </div>
  );
}
