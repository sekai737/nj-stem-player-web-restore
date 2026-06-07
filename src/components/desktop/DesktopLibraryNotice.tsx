import { chooseDesktopLibraryFolder, useDesktopLibraryPath } from "../../hooks/useDesktopLibrary";
import { isDesktopApp } from "../../utils/isDesktop";

/** Prompts to choose a stem library when none is configured (desktop only). */
export default function DesktopLibraryNotice() {
  const libraryPath = useDesktopLibraryPath();

  if (!isDesktopApp() || libraryPath) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[100] flex max-w-lg -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-stroke-primary bg-main-container-primary px-4 py-3 shadow-pop-4"
      role="status"
    >
      <p className="type-swiss721-regular m-0 text-sm text-text-primary">
        Choose a folder that contains your <strong>stems</strong> directory.
      </p>
      <button
        type="button"
        className="type-swiss721-medium shrink-0 rounded-full border-2 border-stroke-primary bg-bg-primary px-4 py-2 text-sm text-text-primary"
        onClick={() => void chooseDesktopLibraryFolder()}
      >
        Choose folder
      </button>
    </div>
  );
}
