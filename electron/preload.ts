import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { SpotifyEnrichmentPayload, TrackMetadataRequest } from "./metadataTypes.js";

interface ElectronAPI {
  isDesktop: true;
  getLibraryPath: () => Promise<string | null>;
  selectLibraryFolder: () => Promise<string | null>;
  onLibraryPathChanged: (callback: (libraryRoot: string) => void) => () => void;
  fetchTrackMetadata: (request: TrackMetadataRequest) => Promise<SpotifyEnrichmentPayload | null>;
}

const electronAPI: ElectronAPI = {
  isDesktop: true,
  getLibraryPath: () => ipcRenderer.invoke("library:getPath"),
  selectLibraryFolder: () => ipcRenderer.invoke("library:selectFolder"),
  onLibraryPathChanged: (callback) => {
    const listener = (_event: IpcRendererEvent, libraryRoot: string) => {
      callback(libraryRoot);
    };
    ipcRenderer.on("library:pathChanged", listener);
    return () => {
      ipcRenderer.removeListener("library:pathChanged", listener);
    };
  },
  fetchTrackMetadata: (request) => ipcRenderer.invoke("metadata:fetch", request),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
