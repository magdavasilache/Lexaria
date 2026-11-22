import { RegisterPayload } from "../schemas/registerSchema";
import { LoginFormData } from "../schemas/loginSchema";
import type { AccessToken, AuthResponse, LoginRequest, RegisterRequest } from "../userTypes";
import { apiClient } from "../../../shared/api/apiClient";

const credentials = { skipAuth: true, withCredentials: true };
const session = { ...credentials, silent: true };

export const registerRequest = async ({ username, password }: RegisterPayload): Promise<AuthResponse> => {
  const payload: RegisterRequest = { username, password };
  return apiClient.post<AuthResponse>("/auth/register", payload, { ...credentials, handlesFieldErrors: true });
};

export const loginRequest = async (data: LoginFormData): Promise<AuthResponse> => {
  const payload: LoginRequest = data;
  return apiClient.post<AuthResponse>("/auth/login", payload, { ...credentials, handlesFieldErrors: true });
};

export const refreshRequest = (): Promise<AccessToken> => apiClient.post<AccessToken>("/auth/refresh", undefined, session);

export const logoutRequest = (): Promise<void> => apiClient.post<void>("/auth/logout", undefined, session);
