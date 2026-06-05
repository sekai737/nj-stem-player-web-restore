import { create } from "zustand";
import type { LyricsViewSettings } from "../types/lyricsPlus";
import { DEFAULT_LYRICS_VIEW_SETTINGS } from "../types/lyricsPlus";

import type { LyricLanguage, StemId } from "../types";

export interface StemChannelState {
  volume: number;
  muted: boolean;
  solo: boolean;
}

export const DEFAULT_STEM_VOLUME = 0.5;

export function clampStemVolume(volume: number): number {
  return Math.min(1, Math.max(0, volume));
}

const STEM_IDS: StemId[] = ["vocals", "instruments", "drums", "bass"];

const defaultChannels = (): Record<StemId, StemChannelState> => ({
  vocals: { volume: DEFAULT_STEM_VOLUME, muted: false, solo: false },
  instruments: { volume: DEFAULT_STEM_VOLUME, muted: false, solo: false },
  drums: { volume: DEFAULT_STEM_VOLUME, muted: false, solo: false },
  bass: { volume: DEFAULT_STEM_VOLUME, muted: false, solo: false },
});

function cloneChannels(
  channels: Record<StemId, StemChannelState>,
): Record<StemId, StemChannelState> {
  return {
    vocals: { ...channels.vocals },
    instruments: { ...channels.instruments },
    drums: { ...channels.drums },
    bass: { ...channels.bass },
  };
}

function anyStemSoloed(channels: Record<StemId, StemChannelState>): boolean {
  return STEM_IDS.some((id) => channels[id].solo);
}

function soloedStemCount(channels: Record<StemId, StemChannelState>): number {
  return STEM_IDS.filter((id) => channels[id].solo).length;
}

/** Clear solo + mute on every stem (default mix state). */
function clearSoloAndMute(
  channels: Record<StemId, StemChannelState>,
): Record<StemId, StemChannelState> {
  const next = cloneChannels(channels);
  for (const id of STEM_IDS) {
    next[id] = { ...next[id], solo: false, muted: false };
  }
  return next;
}

/** Exit solo mode: mute the soloed stem, unmute all others. */
function muteFormerSoloStem(
  channels: Record<StemId, StemChannelState>,
  id: StemId,
): Record<StemId, StemChannelState> {
  const next = cloneChannels(channels);
  for (const stemId of STEM_IDS) {
    if (stemId === id) {
      next[stemId] = { ...next[stemId], solo: false, muted: true };
    } else {
      next[stemId] = { ...next[stemId], solo: false, muted: false };
    }
  }
  return next;
}

/** Solo one stem; mute all others (solo takes precedence on the soloed stem). */
function applyExclusiveSolo(
  channels: Record<StemId, StemChannelState>,
  id: StemId,
): Record<StemId, StemChannelState> {
  const next = cloneChannels(channels);
  for (const stemId of STEM_IDS) {
    if (stemId === id) {
      next[stemId] = { ...next[stemId], solo: true, muted: false };
    } else {
      next[stemId] = { ...next[stemId], solo: false, muted: true };
    }
  }
  return next;
}

/** Shift+Solo: toggle solo on one stem; non-soloed stems stay muted while any solo is active. */
function applyAdditiveSolo(
  channels: Record<StemId, StemChannelState>,
  id: StemId,
): Record<StemId, StemChannelState> {
  const next = cloneChannels(channels);
  const togglingOff = next[id].solo;
  next[id] = { ...next[id], solo: !togglingOff, muted: false };

  if (!STEM_IDS.some((stemId) => next[stemId].solo)) {
    return clearSoloAndMute(next);
  }

  for (const stemId of STEM_IDS) {
    if (next[stemId].solo) {
      next[stemId] = { ...next[stemId], muted: false };
    } else {
      next[stemId] = { ...next[stemId], solo: false, muted: true };
    }
  }
  return next;
}

interface PlayerStore {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  stemsLoading: boolean;
  stemsLoadProgress: number;
  stemsLoadError: string | null;
  lyricLanguage: LyricLanguage;
  /** Stem-page language restored when exiting fullscreen */
  lyricLanguageBeforeFullscreen: LyricLanguage | null;
  channels: Record<StemId, StemChannelState>;
  /** Waveform peaks from decoded stems (same audio as playback, no second fetch). */
  stemPeaks: Partial<Record<StemId, number[]>>;
  menuOpen: boolean;
  fullscreenOpen: boolean;
  /** Fullscreen playback: true = separated stems, false = pre-mixed master when available. */
  fullscreenUseStems: boolean;
  fullscreenTvMode: boolean;
  fullscreenShowLyrics: boolean;
  fullscreenShowConversionPanel: boolean;

  lyricsViewSettings: LyricsViewSettings;
  masterVolume: number;
  masterMuted: boolean;
  masterVolumeBeforeMute: number;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setStemsLoading: (loading: boolean) => void;
  setStemsLoadProgress: (progress: number) => void;
  setStemsLoadError: (message: string | null) => void;
  setLyricLanguage: (lang: LyricLanguage) => void;
  setChannelVolume: (id: StemId, volume: number) => void;
  resetChannelVolume: (id: StemId) => void;
  toggleMute: (id: StemId) => void;
  toggleSolo: (id: StemId, additive?: boolean) => void;
  resetChannels: () => void;
  setStemPeaks: (id: StemId, peaks: number[]) => void;
  clearStemPeaks: () => void;
  setMenuOpen: (open: boolean) => void;
  setFullscreenOpen: (open: boolean) => void;
  setFullscreenUseStems: (useStems: boolean) => void;
  setLyricsViewSettings: (settings: Partial<LyricsViewSettings>) => void;

  setMasterVolume: (volume: number) => void;
  resetMasterVolume: () => void;
  toggleMasterMute: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  stemsLoading: false,
  stemsLoadProgress: 0,
  stemsLoadError: null,
  lyricLanguage: "org",
  lyricLanguageBeforeFullscreen: null,
  channels: defaultChannels(),
  stemPeaks: {},
  menuOpen: false,
  fullscreenOpen: false,
  fullscreenUseStems: true,
  fullscreenTvMode: false,
  fullscreenShowLyrics: true,
  fullscreenShowConversionPanel: false,

  lyricsViewSettings: { ...DEFAULT_LYRICS_VIEW_SETTINGS },
  masterVolume: DEFAULT_STEM_VOLUME,
  masterMuted: false,
  masterVolumeBeforeMute: DEFAULT_STEM_VOLUME,
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setStemsLoading: (stemsLoading) => set({ stemsLoading }),
  setStemsLoadProgress: (stemsLoadProgress) => set({ stemsLoadProgress }),
  setStemsLoadError: (stemsLoadError) => set({ stemsLoadError }),
  setLyricLanguage: (lyricLanguage) => set({ lyricLanguage }),
  setChannelVolume: (id, volume) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [id]: { ...state.channels[id], volume: clampStemVolume(volume) },
      },
    })),
  resetChannelVolume: (id) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [id]: { ...state.channels[id], volume: DEFAULT_STEM_VOLUME },
      },
    })),
  toggleMute: (id) =>
    set((state) => {
      const { channels } = state;

      if (anyStemSoloed(channels)) {
        if (channels[id].solo) {
          return { channels: muteFormerSoloStem(channels, id) };
        }
        return { channels: clearSoloAndMute(channels) };
      }

      return {
        channels: {
          ...channels,
          [id]: { ...channels[id], muted: !channels[id].muted },
        },
      };
    }),
  toggleSolo: (id, additive = false) =>
    set((state) => {
      const { channels } = state;
      const ch = channels[id];

      if (additive) {
        return { channels: applyAdditiveSolo(channels, id) };
      }

      if (ch.solo && soloedStemCount(channels) === 1) {
        return { channels: clearSoloAndMute(channels) };
      }

      return { channels: applyExclusiveSolo(channels, id) };
    }),
  resetChannels: () => set({ channels: defaultChannels(), stemPeaks: {} }),
  setStemPeaks: (id, peaks) =>
    set((state) => ({
      stemPeaks: { ...state.stemPeaks, [id]: peaks },
    })),
  clearStemPeaks: () => set({ stemPeaks: {} }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setFullscreenOpen: (fullscreenOpen) =>
    set((state) => {
      if (fullscreenOpen) {
        const stemLang =
          state.lyricLanguage === "all"
            ? (state.lyricLanguageBeforeFullscreen ?? "org")
            : state.lyricLanguage;
        return {
          fullscreenOpen: true,
          menuOpen: false,
          lyricLanguageBeforeFullscreen: stemLang,
          lyricLanguage: "all",
        };
      }
      return {
        fullscreenOpen: false,
        lyricLanguage: state.lyricLanguageBeforeFullscreen ?? "org",
        lyricLanguageBeforeFullscreen: null,
        fullscreenShowConversionPanel: false,
      };
    }),
  setFullscreenUseStems: (fullscreenUseStems) => set({ fullscreenUseStems }),
  setLyricsViewSettings: (patch) =>
    set((state) => ({
      lyricsViewSettings: { ...state.lyricsViewSettings, ...patch },
    })),

  setMasterVolume: (volume) => {
    const v = clampStemVolume(volume);
    set((state) => ({
      masterVolume: v,
      masterMuted: v === 0 ? state.masterMuted : false,
      masterVolumeBeforeMute: v > 0 ? v : state.masterVolumeBeforeMute,
    }));
  },
  resetMasterVolume: () =>
    set({
      masterVolume: DEFAULT_STEM_VOLUME,
      masterMuted: false,
      masterVolumeBeforeMute: DEFAULT_STEM_VOLUME,
    }),
  toggleMasterMute: () =>
    set((state) => {
      if (state.masterMuted) {
        return {
          masterMuted: false,
          masterVolume: state.masterVolumeBeforeMute || DEFAULT_STEM_VOLUME,
        };
      }
      return {
        masterMuted: true,
        masterVolumeBeforeMute: state.masterVolume,
        masterVolume: 0,
      };
    }),
}));

export function stemAudibility(
  channels: Record<StemId, StemChannelState>,
  id: StemId,
): number {
  const anySolo = Object.values(channels).some((c) => c.solo);
  const ch = channels[id];
  if (ch.muted) return 0;
  if (anySolo && !ch.solo) return 0;
  return ch.volume;
}
