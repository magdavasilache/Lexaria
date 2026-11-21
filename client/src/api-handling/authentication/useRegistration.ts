import { useMutation } from "@tanstack/react-query"
import { RegisterPayload } from "../../schemas/registerSchema"
import { registerRequest } from "../../api/authAPI"
import { useSnackbarStore } from "../context/snackbar/useSnackbarStore"
import { useAuthStore } from "../context/authentication/useAuthStore"

export const useRegistration = () => {
  const setSession = useAuthStore(state => state.setSession)
  const showSnackBar = useSnackbarStore(state => state.showSnackBar)

  return useMutation({
    mutationFn: (data: RegisterPayload) => registerRequest(data),
    onSuccess: (data) => {
      setSession(data.token, data.user)
      showSnackBar({ key: "front/users:register.success" }, 'success')
    },
  })
}
