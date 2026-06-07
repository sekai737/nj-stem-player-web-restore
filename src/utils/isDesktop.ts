/** True when running inside the Electron desktop shell. */
export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && window.electronAPI?.isDesktop === true;
}
