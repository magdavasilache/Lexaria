import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    handlesFieldErrors?: boolean;
    retriedAfterRefresh?: boolean;
  }
}
