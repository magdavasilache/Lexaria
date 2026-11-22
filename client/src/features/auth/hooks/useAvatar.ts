import { useMutation } from "@tanstack/react-query";
import { removeAvatarMutation, uploadAvatarMutation } from "../api/userAPI";
import { useAuthStore } from "../stores/useAuthStore";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";

export const useUploadAvatar = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

    return useMutation({
        mutationFn: uploadAvatarMutation,
        onSuccess: (user) => {
            setUser(user);
            showSnackBar({ key: "front/users:avatar.saved" }, "success");
        },
    });
};

export const useRemoveAvatar = () => {
    const setUser = useAuthStore((state) => state.setUser);
    const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

    return useMutation({
        mutationFn: removeAvatarMutation,
        onSuccess: (user) => {
            setUser(user);
            showSnackBar({ key: "front/users:avatar.removed" }, "success");
        },
    });
};
