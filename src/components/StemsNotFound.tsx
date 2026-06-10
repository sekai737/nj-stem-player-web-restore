import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { STEMS_ARCHIVE_URL } from "../constants/stems";
import "./stems-not-found.css";

interface StemsNotFoundProps {
  onStemsFound: (path: string) => void;
}

export default function StemsNotFound({ onStemsFound }: StemsNotFoundProps) {
  const api = window.electronAPI;
  const [path, setPath] = useState("");
  const [waitingForInstall, setWaitingForInstall] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!api) return;
    void api.getStemsPath().then(setPath);
  }, [api]);

  const handleDownload = useCallback(() => {
    if (!api) return;
    void api.openMagnetLink();
    setWaitingForInstall(true);
    setShowBrowse(true);
    setError(null);
  }, [api]);

  const handleBrowse = useCallback(async () => {
    if (!api) return;
    const picked = await api.openFolderPicker();
    if (picked) {
      setPath(picked);
      setError(null);
    }
  }, [api]);

  const handleContinue = useCallback(async () => {
    if (!api || !path) return;
    setBusy(true);
    setError(null);
    try {
      const hasStems = await api.checkStemsPath(path);
      if (!hasStems) {
        setError("No stem files found in that folder.");
        return;
      }
      const confirmed = await api.confirmStemsPath(path);
      if (!confirmed) {
        setError("No stem files found in that folder.");
        return;
      }
      onStemsFound(path);
    } finally {
      setBusy(false);
    }
  }, [api, onStemsFound, path]);

  const handleArchiveClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      void api?.openArchivePage();
    },
    [api],
  );

  return (
    <div className="stems-not-found">
      <div className="stems-not-found__card figma-surface">
        <h1 className="stems-not-found__title">Stem files not found</h1>
        <p className="stems-not-found__lead type-swiss721-regular">
          The NewJeans Stem Player needs the stem audio pack (~1.6 GB). Run setup again and choose
          to download the library, or point the player at a folder that already contains stem files.
        </p>

        <div className="stems-not-found__path-block">
          <p className="stems-not-found__path-label type-swiss721-medium">Install location</p>
          <code className="stems-not-found__path">{path || "…"}</code>
        </div>

        {error ? <p className="stems-not-found__error">{error}</p> : null}

        <div className="stems-not-found__actions">
          <button
            type="button"
            className="stems-not-found__btn stems-not-found__btn--primary type-swiss721-medium"
            onClick={handleDownload}
            disabled={waitingForInstall}
          >
            {waitingForInstall ? "Waiting for install…" : "Download Stem Pack"}
          </button>

          {showBrowse ? (
            <button
              type="button"
              className="stems-not-found__btn type-swiss721-medium"
              onClick={() => void handleBrowse()}
            >
              Browse Folder…
            </button>
          ) : null}

          <button
            type="button"
            className="stems-not-found__btn stems-not-found__btn--continue type-swiss721-medium"
            onClick={() => void handleContinue()}
            disabled={busy || !path}
          >
            Continue
          </button>
        </div>

        <p className="stems-not-found__hint type-swiss721-regular">
          Opens in your torrent client. Once the download is complete, install the files to:
          <code className="stems-not-found__hint-path">{path || "…"}</code>
        </p>

        <p className="stems-not-found__archive type-swiss721-regular">
          or{" "}
          <a href={STEMS_ARCHIVE_URL} onClick={handleArchiveClick}>
            download from Archive.org
          </a>
        </p>
      </div>
    </div>
  );
}
