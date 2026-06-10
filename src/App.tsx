import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import StemsNotFound from "./components/StemsNotFound";
import HomePage from "./pages/HomePage";
import SongSelectPage from "./pages/SongSelectPage";
import StemPlayerPage from "./pages/StemPlayerPage";
import { isDesktopApp } from "./utils/isDesktop";

export default function App() {
  const desktop = isDesktopApp();
  const [stemsReady, setStemsReady] = useState<boolean | null>(desktop ? null : true);

  useEffect(() => {
    const api = window.electronAPI;
    if (!desktop || !api) return;

    void (async () => {
      const stemsPath = await api.findInstalledStems();
      if (stemsPath) {
        await api.confirmStemsPath(stemsPath);
        setStemsReady(true);
        return;
      }

      setStemsReady(false);
    })();
  }, [desktop]);

  if (stemsReady === null) {
    return null;
  }

  if (!stemsReady) {
    return (
      <StemsNotFound
        onStemsFound={() => {
          setStemsReady(true);
        }}
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/release/:releaseId" element={<SongSelectPage />} />
      <Route path="/release/:releaseId/play/:songId" element={<StemPlayerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
