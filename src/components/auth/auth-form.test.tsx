import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { replaceMock, refreshMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));

// Keep the real ApiError / errorMessage / isBackendDown; stub only api.post.
vi.mock("@/lib/api-client", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api-client")>();
  return { ...actual, api: { ...actual.api, post: vi.fn() } };
});

import { AuthForm } from "./auth-form";
import { api, ApiError } from "@/lib/api-client";
import { MAINTENANCE_MESSAGE } from "@/lib/constants";

const post = vi.mocked(api.post);

beforeEach(() => {
  post.mockReset();
  replaceMock.mockReset();
  refreshMock.mockReset();
});

describe("AuthForm — login mode", () => {
  it("shows only username + password (no email / passcode)", () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByLabelText(/帳號/)).toBeInTheDocument();
    expect(screen.getByLabelText("密碼")).toBeInTheDocument();
    // The email field (distinct from the "帳號（或 Email）" hint) is absent.
    expect(screen.queryByPlaceholderText("you@example.com")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("註冊碼")).not.toBeInTheDocument();
  });

  it("posts credentials and navigates on success", async () => {
    post.mockResolvedValue({ user: { id: 1 } });
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText(/帳號/), "alice");
    await user.type(screen.getByLabelText("密碼"), "secretpw");
    await user.click(screen.getByRole("button", { name: "登入" }));

    expect(post).toHaveBeenCalledWith("/api/auth/login", {
      username: "alice",
      password: "secretpw",
    });
    expect(replaceMock).toHaveBeenCalledWith("/tasks");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the backend error message on failure", async () => {
    post.mockRejectedValue(new ApiError(401, "帳號或密碼錯誤"));
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText(/帳號/), "a");
    await user.type(screen.getByLabelText("密碼"), "b");
    await user.click(screen.getByRole("button", { name: "登入" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("帳號或密碼錯誤");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("shows the maintenance message when the backend is down", async () => {
    post.mockRejectedValue(new ApiError(502, null));
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText(/帳號/), "a");
    await user.type(screen.getByLabelText("密碼"), "b");
    await user.click(screen.getByRole("button", { name: "登入" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(MAINTENANCE_MESSAGE);
  });

  it("renders the maintenance notice banner when provided", () => {
    render(<AuthForm mode="login" notice="系統維護中" />);
    expect(screen.getByRole("status")).toHaveTextContent("系統維護中");
  });
});

describe("AuthForm — register mode", () => {
  it("includes email + passcode fields and forwards them", async () => {
    post.mockResolvedValue({ user: { id: 2 } });
    const user = userEvent.setup();
    render(<AuthForm mode="register" />);

    expect(screen.getByLabelText("註冊碼")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/帳號/), "bob");
    await user.type(screen.getByLabelText(/Email/), "bob@example.com");
    await user.type(screen.getByLabelText("註冊碼"), "letmein");
    await user.type(screen.getByLabelText("密碼"), "password1");
    await user.click(screen.getByRole("button", { name: "註冊" }));

    expect(post).toHaveBeenCalledWith("/api/auth/register", {
      username: "bob",
      password: "password1",
      email: "bob@example.com",
      passcode: "letmein",
    });
  });
});
