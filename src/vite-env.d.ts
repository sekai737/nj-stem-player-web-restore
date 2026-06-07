/// <reference types="vite/client" />

interface ElectronAPI {
  isDesktop: true;
  getLibraryPath: () => Promise<string | null>;
  selectLibraryFolder: () => Promise<string | null>;
  onLibraryPathChanged: (callback: (libraryRoot: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
