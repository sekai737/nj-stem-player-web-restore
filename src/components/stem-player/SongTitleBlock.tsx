import { type Ref } from "react";
import { figmaAssets } from "../../figma/assets";
import { FIGMA } from "../../figma/layout";
import { trackTitleSuffixes } from "../../utils/displayTrackTitle";
import { formatTrackMetadata } from "../../utils/formatTrackMetadata";
import SelectableCopyRegion from "../SelectableCopyRegion";
import CoolTitleDisplay from "./CoolTitleDisplay";
import "../selectable-copy-stem.css";

interface SongTitleBlockProps {
  title: string;
  durationSec: number;
  keyLabel?: string;
  bpm?: number;
  titleBlockRef?: Ref<HTMLDivElement>;
  titleCoolLineRef?: Ref<HTMLParagraphElement>;
}

/**
 * Figma Title (26:216) — flex-col items-start; Title mr-[-16px] toward lyrics.
 */
export default function SongTitleBlock({
  title,
  durationSec,
  keyLabel,
  bpm,
  titleBlockRef,
  titleCoolLineRef,
}: SongTitleBlockProps) {
  const stack = FIGMA.titleRow.titleStack;
  const titleSuffixes = trackTitleSuffixes(title);

  return (
    <div
      ref={titleBlockRef}
      className="flex shrink-0 flex-col items-start justify-start"
      data-node-id="26:216"
      data-name="Title"
      style={{
        width: "max-content",
        maxWidth: FIGMA.titleRow.titleWidth,
        height: FIGMA.titleRow.titleHeight,
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
        <CoolTitleDisplay title={title} titleCoolLineRef={titleCoolLineRef} />
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
            {formatTrackMetadata(durationSec, keyLabel, bpm, {
              titleSuffixes,
            })}
          </p>
        </div>
      </SelectableCopyRegion>
    </div>
  );
}
