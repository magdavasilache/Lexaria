import axios from "axios";
import { API_URL } from "../utils/constants";
import { RegisterPayload } from "../schemas/registerSchema";
import { LoginFormData } from "../schemas/loginSchema";
import type { AccessToken, AuthResponse, LoginRequest, RegisterRequest } from "../types/auth-types/userTypes";
import { publicAxios } from "./publicAxios";
import { ApiResponse, toApiError, unwrap } from "./apiTypes";

const authClient = publicAxios("auth");
const sessionClient = axios.create({ baseURL: `${API_URL}auth`, timeout: 5000, withCredentials: true });

export const registerRequest = async ({ username, password }: RegisterPayload): Promise<AuthResponse> => {
  const payload: RegisterRequest = { username, password };
  return unwrap(await authClient.post<ApiResponse<AuthResponse>>("/register", payload, { handlesFieldErrors: true, withCredentials: true }));
};

export const loginRequest = async (data: LoginFormData): Promise<AuthResponse> => {
  const payload: LoginRequest = data;
  return unwrap(await authClient.post<ApiResponse<AuthResponse>>("/login", payload, { handlesFieldErrors: true, withCredentials: true }));
};

export const refreshRequest = async (): Promise<AccessToken> => {
  try {
    return unwrap(await sessionClient.post<ApiResponse<AccessToken>>("/refresh"));
  } catch (error) {
    throw toApiError(error);
  }
};

export const logoutRequest = async (): Promise<void> => {
  await sessionClient.post<ApiResponse<null>>("/logout");
};
