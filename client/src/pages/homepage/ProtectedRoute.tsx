import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../../api-handling/context/authentication/useAuthStore"

export function ProtectedRoute() {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}