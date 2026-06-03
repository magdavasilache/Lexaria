import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "../context/authentication/useAuthStore"
import { LoginType } from "../../types/auth-types/loginType"
import { loginMutation } from "../../api/registrationAPI"
import { useSnackbarStore } from "../context/snackbar/useSnackbarStore"

export const useLogin = () => {
    const setAccessToken = useAuthStore(state => state.setAccessToken)
    const showSnackBar = useSnackbarStore(state => state.showSnackBar)

    return useMutation({
        mutationFn:(data: LoginType) => {
            const response = loginMutation(data)
            return response
        },
        onSuccess: (data) => {
            setAccessToken(data.token.access_token)
            useAuthStore.setState({user: data.user})
            showSnackBar("Login was successful!", 'success')
        },
        onError: () => {
            showSnackBar("Login failed. Please check your credentials and try again.", 'error')
        }
    })
}