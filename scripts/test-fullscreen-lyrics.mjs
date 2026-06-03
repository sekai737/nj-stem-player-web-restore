import { getLyricBubbleLines } from "../src/utils/fullscreenLyrics.ts";

const below = { translationDisplay: "below" };

const punct = {
  id: "1",
  time: 29.98,
  startTimeMs: 29980,
  member: "danielle",
  original: "In a moment, you and I",
  romanized: "In a moment you and I",
  translation: "In a moment you and I",
};
console.log("punct all:", getLyricBubbleLines(punct, "all", below));

const korean = {
  id: "2",
  time: 37.42,
  startTimeMs: 37420,
  member: "haerin",
  original: "너와 나 다시 한 번 만나게",
  romanized: "neowa na dashi hanbeon mannage",
  translation: "So you and I can meet again",
};
console.log("korean all:", getLyricBubbleLines(korean, "all", below));

const englishDup = {
  id: "3",
  time: 43.66,
  startTimeMs: 43660,
  member: "hanni",
  original: "My feeling's getting deeper",
  romanized: "My feeling's getting deeper",
  translation: "My feeling's getting deeper",
};
console.log("english dup:", getLyricBubbleLines(englishDup, "all", below));
