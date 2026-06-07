import { Navigate, Route, Routes } from "react-router-dom";
import DesktopLibraryNotice from "./components/desktop/DesktopLibraryNotice";
import HomePage from "./pages/HomePage";
import SongSelectPage from "./pages/SongSelectPage";
import StemPlayerPage from "./pages/StemPlayerPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/release/:releaseId" element={<SongSelectPage />} />
        <Route path="/release/:releaseId/play/:songId" element={<StemPlayerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DesktopLibraryNotice />
    </>
  );
}
