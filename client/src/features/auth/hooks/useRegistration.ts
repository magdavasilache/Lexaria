import { useMutation } from "@tanstack/react-query"
import { RegisterPayload } from "../schemas/registerSchema"
import { registerRequest } from "../api/authAPI"
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore"
import { useAuthStore } from "../stores/useAuthStore"

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
