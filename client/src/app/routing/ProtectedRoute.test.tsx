import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "../../features/auth/stores/useAuthStore";
import { USER_ROLE, type UserType } from "../../features/auth/userTypes";
import i18n from "../../i18n";

const signInAs = (role: UserType["role"]) =>
  useAuthStore.getState().setSession(
    { access_token: "token", token_type: "bearer", expires_in: 900 },
    { id: 1, username: "reader", role, display_name: null, avatar_url: null, bio: null, created_at: "2026-01-01T00:00:00Z" }
  );

const renderAdminPanel = () =>
  render(
    <MemoryRouter initialEntries={["/admin-panel"]}>
      <Routes>
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin-panel" element={<p>admin content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  it("shows the forbidden page to a signed-in reader who opens the admin panel", () => {
    signInAs(USER_ROLE.FREE);
    renderAdminPanel();

    expect(screen.getByRole("heading", { name: i18n.t("front/common:errors.forbidden.title") })).toBeTruthy();
    expect(screen.queryByText("admin content")).toBeNull();
  });

  it("lets an admin through", () => {
    signInAs(USER_ROLE.ADMIN);
    renderAdminPanel();

    expect(screen.getByText("admin content")).toBeTruthy();
  });
});
