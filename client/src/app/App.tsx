import type { ComponentType } from "react"
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom"
import { Palette } from "lucide-react"
import { useTranslation } from "react-i18next"
import Navbar from "./layout/Navbar"
import Snackbar from "../shared/components/Snackbar"
import Button from "../shared/components/Button"
import Chatbot from "../features/chatbot/components/Chatbot"
import ReadingSessionOverlay from "../features/reading/session/ReadingSessionOverlay"
import RouteErrorBoundary from "./errors/RouteErrorBoundary"
import AppErrorFallback from "./errors/AppErrorFallback"
import { useThemeStore } from "../shared/stores/useThemeStore"
import { useSessionKeeper } from "../features/auth/hooks/useSessionKeeper"
import { ProtectedRoute } from "./routing/ProtectedRoute"
import WelcomePage from "../features/welcome/pages/WelcomePage"
import NotFoundPage from "./pages/NotFoundPage"

const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })

function ThemeButton() {
    const { t } = useTranslation()
    const toggleTheme = useThemeStore((state) => state.toggleTheme)
    return (
        <Button
            onClick={toggleTheme}
            icon={Palette}
            aria-label={t("theme.toggle")}
            variant="secondary"
            size="lg"
            className="fixed bottom-4 right-4 z-50 hover:scale-105"
        />
    )
}

function AppLayout() {
    useSessionKeeper()
    return (
        <>
            <Navbar />
            <Snackbar />
            <RouteErrorBoundary>
                <Outlet />
            </RouteErrorBoundary>
            <ThemeButton />
            <Chatbot />
            <ReadingSessionOverlay />
        </>
    )
}

const router = createBrowserRouter([
    {
        element: <AppLayout />,
        errorElement: <AppErrorFallback />,
        hydrateFallbackElement: null,
        children: [
            { path: "/", element: <WelcomePage /> },
            {
                element: <ProtectedRoute />,
                children: [
                    { path: "/homepage", lazy: page(() => import("../features/books/pages/HomePage")) },
                    { path: "/book/:id", lazy: page(() => import("../features/books/pages/BookPage")) },
                    { path: "/goodreads-import", lazy: page(() => import("../features/imports/pages/GoodreadImportPage")) },
                    { path: "/stats", lazy: page(() => import("../features/stats/pages/StatsPage")) },
                ],
            },
            {
                element: <ProtectedRoute requireAdmin />,
                children: [{ path: "/admin-panel", lazy: page(() => import("../features/admin/pages/AdminPanel")) }],
            },
            { path: "*", element: <NotFoundPage /> },
        ],
    },
])

export default function App() {
    return <RouterProvider router={router} />
}
