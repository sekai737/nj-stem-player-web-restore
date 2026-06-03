import type { LyricLine, MemberId } from "../types";

const MEMBER_HMS_TAG_RE =
  /^\[([^\]]+)\]\[(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/u;
const MEMBER_MS_TAG_RE =
  /^\[([^\]]+)\]\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/u;
const HMS_TIME_TAG_RE = /^\[(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/u;
const MS_TIME_TAG_RE = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/u;

const MEMBER_IDS: MemberId[] = ["minji", "hanni", "danielle", "haerin", "hyein", "group"];

function parseTimestamp(
  hours: number,
  minutes: number,
  seconds: number,
  fraction?: string,
): number {
  const base = hours * 3600 + minutes * 60 + seconds;
  if (!fraction) return base;
  const divisor = fraction.length >= 3 ? 1000 : 100;
  const frac = Number(fraction);
  if (!Number.isFinite(frac)) return base;
  return base + frac / divisor;
}

function isValidTimestampPart(value: number, max: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= max;
}

export function memberFromTag(tag: string): MemberId {
  const normalized = tag.trim().toLowerCase();
  if (normalized.includes("pharrell")) return "pharrell";
  const match = MEMBER_IDS.find((id) => id === normalized);
  return match ?? "group";
}

function pushLine(
  lines: LyricLine[],
  time: number,
  text: string,
  member: MemberId,
) {
  const trimmed = text.trim();
  if (!trimmed) return;
  lines.push({ time, text: trimmed, member });
}

/** Parse NJ Stem Player LRC: `[Member][mm:ss.xx]Lyric`, `[hh:mm:ss.xx]`, or time-only variants. */
export function parseLrc(content: string): LyricLine[] {
  const lines: LyricLine[] = [];
  let lastMember: MemberId = "group";

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const memberHms = line.match(MEMBER_HMS_TAG_RE);
    if (memberHms) {
      const [, memberTag, h, min, sec, frac, text] = memberHms;
      const hours = Number(h);
      const minutes = Number(min);
      const seconds = Number(sec);
      if (
        isValidTimestampPart(hours, 99) &&
        isValidTimestampPart(minutes, 59) &&
        isValidTimestampPart(seconds, 59)
      ) {
        lastMember = memberFromTag(memberTag);
        pushLine(lines, parseTimestamp(hours, minutes, seconds, frac), text, lastMember);
      }
      continue;
    }

    const memberMs = line.match(MEMBER_MS_TAG_RE);
    if (memberMs) {
      const [, memberTag, min, sec, frac, text] = memberMs;
      const minutes = Number(min);
      const seconds = Number(sec);
      if (isValidTimestampPart(minutes, 99) && isValidTimestampPart(seconds, 59)) {
        lastMember = memberFromTag(memberTag);
        pushLine(lines, parseTimestamp(0, minutes, seconds, frac), text, lastMember);
      }
      continue;
    }

    const hmsMatch = line.match(HMS_TIME_TAG_RE);
    if (hmsMatch) {
      const [, h, min, sec, frac, text] = hmsMatch;
      const hours = Number(h);
      const minutes = Number(min);
      const seconds = Number(sec);
      if (
        isValidTimestampPart(hours, 99) &&
        isValidTimestampPart(minutes, 59) &&
        isValidTimestampPart(seconds, 59)
      ) {
        pushLine(lines, parseTimestamp(hours, minutes, seconds, frac), text, lastMember);
      }
      continue;
    }

    const msMatch = line.match(MS_TIME_TAG_RE);
    if (msMatch) {
      const [, min, sec, frac, text] = msMatch;
      const minutes = Number(min);
      const seconds = Number(sec);
      if (isValidTimestampPart(minutes, 99) && isValidTimestampPart(seconds, 59)) {
        pushLine(lines, parseTimestamp(0, minutes, seconds, frac), text, lastMember);
      }
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}
