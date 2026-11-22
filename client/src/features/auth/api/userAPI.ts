import { apiClient } from "../../../shared/api/apiClient";
import type { AdminUser, BanRequest, UserType } from "../userTypes";

export const uploadAvatarMutation = (image: File): Promise<UserType> => {
  const data = new FormData();
  data.append("image", image);
  return apiClient.put<UserType>("/users/me/avatar", data, { handlesFieldErrors: true });
};

export const removeAvatarMutation = (): Promise<UserType> => apiClient.delete<UserType>("/users/me/avatar");

export const getUsersQuery = (): Promise<AdminUser[]> => apiClient.list<AdminUser>("/users");

export const banUserMutation = (userId: number, body: BanRequest): Promise<AdminUser> =>
  apiClient.post<AdminUser>(`/users/${userId}/ban`, body, { handlesFieldErrors: true });

export const unbanUserMutation = (userId: number): Promise<AdminUser> => apiClient.delete<AdminUser>(`/users/${userId}/ban`);
