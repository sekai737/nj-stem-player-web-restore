/// <reference types="vite/client" />

import type { SpotifyEnrichmentPayload, TrackMetadataRequest } from "./metadata/types";

interface ElectronAPI {
  isDesktop: true;
  getLibraryPath: () => Promise<string | null>;
  selectLibraryFolder: () => Promise<string | null>;
  confirmStemsPath: (folderPath: string) => Promise<boolean>;
  onLibraryPathChanged: (callback: (libraryRoot: string) => void) => () => void;
  fetchTrackMetadata: (request: TrackMetadataRequest) => Promise<SpotifyEnrichmentPayload | null>;
  getStemsPath: () => Promise<string>;
  getStemsSearchPaths: () => Promise<string[]>;
  findInstalledStems: () => Promise<string | null>;
  checkStemsPath: (folderPath: string) => Promise<boolean>;
  openFolderPicker: () => Promise<string | null>;
  openMagnetLink: () => Promise<void>;
  openArchivePage: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
