import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { SpotifyEnrichmentPayload, TrackMetadataRequest } from "./metadataTypes.js";

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

const electronAPI: ElectronAPI = {
  isDesktop: true,
  getLibraryPath: () => ipcRenderer.invoke("library:getPath"),
  selectLibraryFolder: () => ipcRenderer.invoke("library:selectFolder"),
  confirmStemsPath: (folderPath) => ipcRenderer.invoke("library:confirmStemsPath", folderPath),
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
  getStemsPath: () => ipcRenderer.invoke("get-stems-path"),
  getStemsSearchPaths: () => ipcRenderer.invoke("get-stems-search-paths"),
  findInstalledStems: () => ipcRenderer.invoke("find-installed-stems"),
  checkStemsPath: (folderPath) => ipcRenderer.invoke("check-stems-path", folderPath),
  openFolderPicker: () => ipcRenderer.invoke("open-folder-picker"),
  openMagnetLink: () => ipcRenderer.invoke("open-magnet-link"),
  openArchivePage: () => ipcRenderer.invoke("open-archive-page"),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
