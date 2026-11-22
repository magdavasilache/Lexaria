import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { banUserMutation, getUsersQuery, unbanUserMutation } from "../api/userAPI";
import type { BanRequest } from "../userTypes";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";

export const userKeys = {
    admin: ["admin-users"] as const,
};

export const useAdminUsers = (enabled = true) =>
    useQuery({ queryKey: userKeys.admin, queryFn: getUsersQuery, enabled });

export const useBanUser = () => {
    const queryClient = useQueryClient();
    const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

    return useMutation({
        mutationFn: ({ userId, body }: { userId: number; body: BanRequest }) => banUserMutation(userId, body),
        onSuccess: (user) => {
            void queryClient.invalidateQueries({ queryKey: userKeys.admin });
            showSnackBar({ key: "front/users:ban.banned", params: { username: user.username } }, "success");
        },
    });
};

export const useUnbanUser = () => {
    const queryClient = useQueryClient();
    const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

    return useMutation({
        mutationFn: (userId: number) => unbanUserMutation(userId),
        onSuccess: (user) => {
            void queryClient.invalidateQueries({ queryKey: userKeys.admin });
            showSnackBar({ key: "front/users:ban.unbanned", params: { username: user.username } }, "success");
        },
    });
};
