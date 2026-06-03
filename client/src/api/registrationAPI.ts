import axios from "axios"
import { API_URL } from "../utils/constants"
import { RegisterFormState } from "../types/auth-types/registerType"
import { LoginType } from "../types/auth-types/loginType"
import { TokenType, UserType } from "../types/auth-types/userTypes"
import { publicAxios } from "./publicAxios"

const REGISTRATION_URL = 'user/create-user'

export interface AuthResponse {
    token: TokenType;
    user: UserType;
}

export const registrationMutation = async (data: RegisterFormState): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}${REGISTRATION_URL}`, data)
    return response.data
}

export const loginMutation = async (data: LoginType) => {
    const axiosInstance = publicAxios("user");
    const response = await axiosInstance.post("/login-user", data);
    return response.data;
  };