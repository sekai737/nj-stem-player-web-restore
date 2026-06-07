import { useEffect, useState } from "react";
import { isDesktopApp } from "../utils/isDesktop";

/** Stem library root on desktop (folder that contains `stems/`). */
export function useDesktopLibraryPath(): string | null {
  const [libraryPath, setLibraryPath] = useState<string | null>(null);

  useEffect(() => {
    if (!isDesktopApp() || !window.electronAPI) return;

    void window.electronAPI.getLibraryPath().then(setLibraryPath);
    return window.electronAPI.onLibraryPathChanged(setLibraryPath);
  }, []);

  return libraryPath;
}

export async function chooseDesktopLibraryFolder(): Promise<string | null> {
  if (!window.electronAPI) return null;
  return window.electronAPI.selectLibraryFolder();
}
