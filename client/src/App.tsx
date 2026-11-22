import { BrowserRouter, Route, Routes } from "react-router-dom"
import Navbar from "./global-components/Navbar"
import Snackbar from "./global-components/snackbar/Snackbar"
import Button from "./global-components/buttons/Button"
import { Palette } from 'lucide-react';
import { useThemeStore } from "./state_management/useThemeStore"
import WelcomePage from "./pages/welcome/WelcomePage"
import HomePage from "./pages/homepage/HomePage";
import BookPage from "./pages/book-page/BookPage";
import GoodreadsImportPage from "./pages/goodreads-import-page/GoodreadImportPage";
import { memo } from "react";
import AdminPanel from "./pages/admin-panel/AdminPanel";
import StatsPage from "./pages/stats-page/StatsPage";
import Chatbot from "./global-components/chatbot/Chatbot";
import { useSessionKeeper } from "./api-handling/authentication/useSessionKeeper";
import { ProtectedRoute } from "./pages/homepage/ProtectedRoute";
import ReadingSessionOverlay from "./global-components/reading-session/ReadingSessionOverlay";
import { useTranslation } from "react-i18next";

const ThemeButton = memo(function ThemeButton({ onClick }: { onClick: () => void }) {
    const { t } = useTranslation()
    return (
        <Button
            onClick={onClick}
            icon={Palette}
            aria-label={t("theme.toggle")}
            variant="secondary"
            size="lg"
            className="fixed bottom-4 right-4 z-50 hover:scale-105"
        />
    )
})

function App() {
    const { toggleTheme } = useThemeStore()
    useSessionKeeper()
    return (
        <BrowserRouter>
            <Navbar />
            <Snackbar />
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/homepage" element={<HomePage />} />
                    <Route path="/book/:id" element={<BookPage />} />
                    <Route path="/goodreads-import" element={<GoodreadsImportPage />} />
                    <Route path="/stats" element={<StatsPage />} />
                </Route>
                <Route element={<ProtectedRoute requireAdmin />}>
                    <Route path="/admin-panel" element={<AdminPanel />} />
                </Route>
            </Routes>
            <ThemeButton onClick={toggleTheme} />
            <Chatbot />
            <ReadingSessionOverlay />
        </BrowserRouter>
    )
}

export default App
