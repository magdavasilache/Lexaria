import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../../features/auth/stores/useAuthStore"
import { USER_ROLE } from "../../features/auth/userTypes"
import ForbiddenPage from "../pages/ForbiddenPage"

interface Props {
    requireAdmin?: boolean
}

export function ProtectedRoute({ requireAdmin = false }: Props) {
    const status = useAuthStore(state => state.status)
    const isAdmin = useAuthStore(state => state.user?.role === USER_ROLE.ADMIN)

    if (status === "checking") {
        return null
    }

    if (status !== "authenticated") {
        return <Navigate to="/" replace />
    }

    if (requireAdmin && !isAdmin) {
        return <ForbiddenPage />
    }

    return <Outlet />
}
