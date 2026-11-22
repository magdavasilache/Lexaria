import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { apiClient } from "./apiClient";
import { ApiError } from "./apiTypes";
import { apiUrl, envelope, failure, server } from "../test/server";
import { useAuthStore } from "../../features/auth/stores/useAuthStore";
import { useSnackbarStore } from "../stores/useSnackbarStore";
import type { UserType } from "../../features/auth/userTypes";

const user: UserType = { id: 1, username: "reader", role: 2, display_name: null, avatar_url: null, bio: null, created_at: "2026-01-01T00:00:00Z" };

const signIn = (token = "old-token") => useAuthStore.getState().setSession({ access_token: token, token_type: "bearer", expires_in: 900 }, user);

describe("apiClient", () => {
  it("unwraps the envelope and reads the page total from meta", async () => {
    server.use(http.get(apiUrl("/books"), () => HttpResponse.json(envelope([{ id: 1 }, { id: 2 }], { meta: { total: 7 } }))));
    signIn();

    await expect(apiClient.page<{ id: number }>("/books")).resolves.toEqual({ items: [{ id: 1 }, { id: 2 }], total: 7 });
  });

  it("sends the access token and the current language", async () => {
    let headers: Headers | null = null;
    server.use(
      http.get(apiUrl("/stats"), ({ request }) => {
        headers = request.headers;
        return HttpResponse.json(envelope({ ok: true }));
      })
    );
    signIn("token-123");

    await apiClient.get("/stats");
    expect(headers!.get("authorization")).toBe("Bearer token-123");
    expect(headers!.get("accept-language")).toBeTruthy();
  });

  it("throws a typed ApiError and shows one snackbar with the server message", async () => {
    server.use(http.get(apiUrl("/books/9"), () => HttpResponse.json(failure("BOOK_NOT_FOUND", "books.not_found"), { status: 404 })));
    signIn();

    const error = await apiClient.get("/books/9").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect((error as ApiError).code).toBe("BOOK_NOT_FOUND");
    expect((error as ApiError).requestId).toBe("req-1");
    expect(useSnackbarStore.getState()).toMatchObject({ open: true, type: "error", message: { key: "back/books:not_found" } });
  });

  it("leaves field errors to the form when the request handles them", async () => {
    server.use(http.post(apiUrl("/books"), () => HttpResponse.json(failure("VALIDATION_ERROR", "validation.required", "title"), { status: 422 })));
    signIn();

    const error = (await apiClient.post("/books", {}, { handlesFieldErrors: true }).catch((caught: unknown) => caught)) as ApiError;
    expect(error.fieldErrors.map((item) => item.field)).toEqual(["title"]);
    expect(useSnackbarStore.getState().open).toBe(false);
  });

  it("shows server warnings as an info snackbar", async () => {
    server.use(
      http.get(apiUrl("/stats"), () =>
        HttpResponse.json(envelope({ ok: true }, { warnings: [{ code: "PARTIAL", key: "stats.partial", params: {}, message: "partial" }] }))
      )
    );
    signIn();

    await apiClient.get("/stats");
    expect(useSnackbarStore.getState()).toMatchObject({ open: true, type: "info", message: { key: "back/stats:partial" } });
  });

  it("refreshes an expired token once and retries the request", async () => {
    let refreshes = 0;
    server.use(
      http.post(apiUrl("/auth/refresh"), () => {
        refreshes += 1;
        return HttpResponse.json(envelope({ access_token: "new-token", token_type: "bearer", expires_in: 900 }));
      }),
      http.get(apiUrl("/stats"), ({ request }) =>
        request.headers.get("authorization") === "Bearer new-token"
          ? HttpResponse.json(envelope({ ok: true }))
          : HttpResponse.json(failure("TOKEN_EXPIRED", "auth.token_expired"), { status: 401 })
      )
    );
    signIn();

    const results = await Promise.all([apiClient.get("/stats"), apiClient.get("/stats")]);
    expect(results).toEqual([{ ok: true }, { ok: true }]);
    expect(refreshes).toBe(1);
    expect(useAuthStore.getState().accessToken).toBe("new-token");
    expect(useSnackbarStore.getState().open).toBe(false);
  });

  it("ends the session when the refresh is rejected", async () => {
    server.use(
      http.post(apiUrl("/auth/refresh"), () => HttpResponse.json(failure("INVALID_TOKEN", "auth.invalid_token"), { status: 401 })),
      http.get(apiUrl("/stats"), () => HttpResponse.json(failure("TOKEN_EXPIRED", "auth.token_expired"), { status: 401 }))
    );
    signIn();

    await expect(apiClient.get("/stats")).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState()).toMatchObject({ status: "anonymous", user: null, accessToken: null });
  });

  it("does not end the session for a failed login", async () => {
    server.use(http.post(apiUrl("/auth/login"), () => HttpResponse.json(failure("INVALID_CREDENTIALS", "auth.invalid_credentials"), { status: 401 })));
    signIn();

    await expect(apiClient.post("/auth/login", {}, { skipAuth: true })).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().status).toBe("authenticated");
  });
});
