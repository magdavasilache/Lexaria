import axios from "axios";
import { API_URL } from "../utils/constants";
import { RegisterPayload } from "../schemas/registerSchema";
import { LoginFormData } from "../schemas/loginSchema";
import { AccessToken, UserType } from "../types/auth-types/userTypes";
import { publicAxios } from "./publicAxios";
import { ApiResponse, toApiError, unwrap } from "./apiTypes";

export interface AuthResponse {
  token: AccessToken;
  user: UserType;
}

const authClient = publicAxios("auth");
const sessionClient = axios.create({ baseURL: `${API_URL}auth`, timeout: 5000, withCredentials: true });

export const registerRequest = async ({ username, password }: RegisterPayload): Promise<AuthResponse> =>
  unwrap(
    await authClient.post<ApiResponse<AuthResponse>>(
      "/register",
      { username, password },
      { handlesFieldErrors: true, withCredentials: true }
    )
  );

export const loginRequest = async (data: LoginFormData): Promise<AuthResponse> =>
  unwrap(
    await authClient.post<ApiResponse<AuthResponse>>("/login", data, { handlesFieldErrors: true, withCredentials: true })
  );

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
