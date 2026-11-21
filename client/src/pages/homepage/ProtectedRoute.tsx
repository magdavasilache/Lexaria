import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../../api-handling/context/authentication/useAuthStore"
import { USER_ROLE } from "../../types/auth-types/userTypes"

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
        return <Navigate to="/homepage" replace />
    }

    return <Outlet />
}
