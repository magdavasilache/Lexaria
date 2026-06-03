export type RegisterFormState = {
    username: string;
    password: string;
    confirmPassword: string;
  }

 export type RegisterFocusedState = {
    username: boolean;
    password: boolean;
    confirmPassword: boolean;
  }

export type RegisterErrorType = {
  username: string;
  password: string[];
  backend: string;
}
  