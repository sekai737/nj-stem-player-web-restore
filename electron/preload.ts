import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

interface ElectronAPI {
  isDesktop: true;
  getLibraryPath: () => Promise<string | null>;
  selectLibraryFolder: () => Promise<string | null>;
  onLibraryPathChanged: (callback: (libraryRoot: string) => void) => () => void;
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
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
