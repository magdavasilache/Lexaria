import { BrowserRouter, Route, Routes } from "react-router-dom"
import Navbar from "./global-components/Navbar"
import Snackbar from "./global-components/snackbar/Snackbar"
import IconButton from "./global-components/buttons/IconButton"
import { Palette } from 'lucide-react';
import { useThemeStore } from "./state_management/useThemeStore"
import WelcomePage from "./pages/welcome/WelcomePage"
import HomePage from "./pages/homepage/HomePage";
import BookPage from "./pages/book-page/BookPage";
import GoodreadsImportPage from "./pages/goodreads-import-page/GoodreadImportPage";
import BookForm from "./forms/BookForm";
import { memo, useEffect } from "react";
import AdminPanel from "./pages/admin-panel/AdminPanel";
import Chatbot from "./global-components/chatbot/Chatbot";
import { useAuthStore } from "./api-handling/context/authentication/useAuthStore";
import { jwtDecode } from "jwt-decode"
import { ProtectedRoute } from "./pages/homepage/ProtectedRoute";

const ThemeButton = memo(function ThemeButton({ onClick }: { onClick: () => void }) {
    return (
        <IconButton
            onClick={onClick}
            icon={Palette}
            className="fixed bottom-4 right-4 z-50 bg-secondaryLight dark:bg-secondaryDark
        hover:bg-secondaryLightDarkTone
         dark:hover:bg-secondaryDarkDarkTone
         text-fontPrimaryLight dark:text-fontDarkPrimary p-3 rounded-full shadow-md hover:scale-105 transition"
        />
    )
})

function App() {
    const { toggleTheme } = useThemeStore()
    const token = useAuthStore(state => state.accessToken)
    const logout = useAuthStore(state => state.logout)
    useEffect(() => {

        if (!token) {
            logout()
            return
        }

        const payload = jwtDecode(token)

        if (!payload) {
            logout()
            return
        }

        const expiresIn = payload.exp ? payload.exp * 1000 - Date.now() : 0

        if (expiresIn <= 0) {
            logout()
            return
        }

        const timeout = setTimeout(() => {
            logout()
        }, expiresIn)

        return () => clearTimeout(timeout)
    }, [])
    return (
        <BrowserRouter>
            <Navbar />
            <Snackbar />
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/homepage" element={<HomePage />} />
                    <Route path="/book/:id" element={<BookPage />} />
                    <Route path="/add-book" element={<BookForm />} />
                    <Route path="/admin-panel" element={<AdminPanel />} />
                    <Route path="/goodreads-import" element={<GoodreadsImportPage />} />
                </Route>
            </Routes>
            <ThemeButton onClick={toggleTheme} />
            <Chatbot />

        </BrowserRouter>
    )
}

export default App
