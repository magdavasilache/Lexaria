import { useMutation } from "@tanstack/react-query"
import { RegisterFormState } from "../../types/auth-types/registerType"
import { registrationMutation } from "../../api/registrationAPI"
import { useSnackbarStore } from "../context/snackbar/useSnackbarStore"
import { useAuthStore } from "../context/authentication/useAuthStore"

export const useRegistration = () => {
  const setAccessToken = useAuthStore(state => state.setAccessToken)

  const showSnackBar = useSnackbarStore(state => state.showSnackBar)
  return useMutation({
    mutationFn: (data: RegisterFormState) => {
      const result = registrationMutation(data)
      return result
    },
    onSuccess: (data) => {
      setAccessToken(data.token.access_token)
      useAuthStore.setState({ user: data.user })
      showSnackBar('Registration was successful!', 'success')
    },
    onError: () => {
      const message = "Registration failed. Please try again."
      showSnackBar(message, 'error')
    }
  })
}
