import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    silent?: boolean;
    handlesFieldErrors?: boolean;
    handlesWarnings?: boolean;
    retriedAfterRefresh?: boolean;
  }
}
