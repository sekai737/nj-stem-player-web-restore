/// <reference types="vite/client" />

import type { SpotifyEnrichmentPayload, TrackMetadataRequest } from "./metadata/types";

interface ElectronAPI {
  isDesktop: true;
  getLibraryPath: () => Promise<string | null>;
  selectLibraryFolder: () => Promise<string | null>;
  onLibraryPathChanged: (callback: (libraryRoot: string) => void) => () => void;
  fetchTrackMetadata: (request: TrackMetadataRequest) => Promise<SpotifyEnrichmentPayload | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
