/** Figma-exported assets (public/figma). */
export const figmaAssets = {
  home: "/figma/home.svg",
  stemPageBack: "/figma/stem-page-back.svg",
  settings: "/figma/settings.svg",
  fullscreen: "/figma/fullscreen.svg",
  backButton: "/figma/back-button.svg",
  menuButton: "/figma/menu-button.svg",
  send: "/figma/send.svg",
  fullscreenPlay: "/figma/fullscreen-play.svg",
  vocalIcon: "/figma/vocal-icon.svg",
  otherIcon: "/figma/other-icon.svg",
  bassIcon: "/figma/bass-icon.svg",
  drumsIcon: "/figma/drums-icon.svg",
  nowPlaying: "/figma/now-playing.svg",
  play: "/figma/play.svg",
  pause: "/figma/pause.svg",
  previousSong: "/figma/previous-song.svg",
  nextSong: "/figma/next-song.svg",
  progressBar: "/figma/progress-bar.svg",
  volume: "/figma/volume.svg",

  dropDown: "/figma/drop-down.svg",
  meterText: "/figma/meter-text.svg",
  stemTrack: "/figma/stem-track.png",
  stemTrackVocals: "/figma/stem-track-vocals.svg",
  stemTrackOther: "/figma/stem-track-other.svg",
  stemTrackDrums: "/figma/stem-track-drums.svg",
  stemTrackBass: "/figma/stem-track-bass.svg",
  soloIconDefault: "/figma/solo-icon-default.svg",
  soloIconClicked: "/figma/solo-icon-clicked.svg",
  muteIconDefault: "/figma/mute-icon-default.svg",
  muteIconClicked: "/figma/mute-icon-clicked.svg",
  background: "/figma/background.svg",
  /** Small star accents — layered over background.svg (1836×984 artboard) */
  smallStars: "/figma/small-stars.svg",
  homePageTitle: "/figma/title.svg",
  homePagePlay: "/figma/home-page-play.svg",
  /** Home bubble currently exported as PNG in public/figma. */
  homePageBubble: "/figma/bubble.png",
  homePageFloor: "/figma/floor.svg",
  homePageYoutubeButton: "/figma/youtube-button.png",
  homePageTokkiHeart: "/figma/tokki-heart.png",
  homePageBackUp: "/figma/back-up.svg",
  homePageCircles: "/figma/circles.svg",
  homePageBigStars: "/figma/big-stars.svg",
  homePageHeartMinji: "/figma/heart-minji.png",
  homePageHeartHanni: "/figma/heart-hanni.png",
  homePageHeartDanielle: "/figma/heart-danielle.png",
  /** Asset exported as heart-hearin.png in public/figma. */
  homePageHeartHaerin: "/figma/heart-hearin.png",
  homePageHeartHyein: "/figma/heart-hyein.png",
  /** Legacy aliases */
  iconCircle: "/figma/icon-circle.svg",
} as const;

/**
 * Small-star sprites (Figma "Small Stars" 227:288), exported individually as
 * asset-{n}.svg. Consumed by the jittered StarField; small-stars.svg is the
 * arrangement reference only.
 */
export const figmaStarAssets = [
  "/figma/asset-1.svg",
  "/figma/asset-2.svg",
  "/figma/asset-3.svg",
  "/figma/asset-4.svg",
  "/figma/asset-5.svg",
] as const;
