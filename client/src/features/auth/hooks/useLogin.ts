import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "../stores/useAuthStore"
import { LoginFormData } from "../schemas/loginSchema"
import { loginRequest } from "../api/authAPI"
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore"

export const useLogin = () => {
    const setSession = useAuthStore(state => state.setSession)
    const showSnackBar = useSnackbarStore(state => state.showSnackBar)

    return useMutation({
        mutationFn: (data: LoginFormData) => loginRequest(data),
        onSuccess: (data) => {
            setSession(data.token, data.user)
            showSnackBar({ key: "front/users:login.success" }, 'success')
        },
    })
}
