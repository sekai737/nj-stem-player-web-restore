import type { MemberId } from "../types";

export const MEMBERS: Record<
  MemberId,
  { name: string; emoji: string; portrait: string; emojiIcon: string }
> = {
  minji: {
    name: "Minji",
    emoji: "🧸",
    portrait: "/members/portrait-minji.png",
    emojiIcon: "/members/emoji-minji.png",
  },
  hanni: {
    name: "Hanni",
    emoji: "🦦",
    portrait: "/members/portrait-hanni.png",
    emojiIcon: "/members/emoji-hanni.png",
  },
  danielle: {
    name: "Danielle",
    emoji: "🐶",
    portrait: "/members/portrait-danielle.png",
    emojiIcon: "/members/emoji-danielle.png",
  },
  haerin: {
    name: "Haerin",
    emoji: "🐱",
    portrait: "/members/portrait-haerin.png",
    emojiIcon: "/members/emoji-haerin.png",
  },
  hyein: {
    name: "Hyein",
    emoji: "🐹",
    portrait: "/members/portrait-hyein.png",
    emojiIcon: "/members/emoji-hyein.png",
  },
  group: {
    name: "Group",
    emoji: "🐰",
    portrait: "/members/emoji-group.png",
    emojiIcon: "/members/emoji-group.png",
  },
  pharrell: {
    name: "Pharrell Williams",
    emoji: "🎤",
    portrait: "/members/pharrell-portrait.png",
    emojiIcon: "/members/pharrell-microphone.png",
  },
};

/** Fullscreen chat opener (song title row). */
export const FULLSCREEN_CHAT_OPENER = {
  name: "sekai★⁷³⁷",
  portrait: "/members/portrait-sekai.png",
  /** Member emoji PNGs in display order 🧸🦦🐶🐱🐹 */
  emojiIconOrder: [
    MEMBERS.minji.emojiIcon,
    MEMBERS.hanni.emojiIcon,
    MEMBERS.danielle.emojiIcon,
    MEMBERS.haerin.emojiIcon,
    MEMBERS.hyein.emojiIcon,
  ],
} as const;
