import * as FirebaseAuthContext from "../../context/FirebaseAuthContext";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "../../test/test-utils";

import Profile from "./index";

describe("Profile Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays loading state when auth is loading", () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Profile />);

    expect(screen.getByText(/Loading your profile.../i)).toBeInTheDocument();
  });

  it("displays error when user is not found", () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Profile />);

    expect(screen.getByText(/User not found/i)).toBeInTheDocument();
  });

  it("displays user profile with display name", () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: {
        uid: "123",
        email: "test@test.com",
        displayName: "Test User",
        photoURL: null,
      } as any,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Profile />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@test.com")).toBeInTheDocument();
  });

  it("displays email when displayName is not available", () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: {
        uid: "123",
        email: "test@test.com",
        displayName: null,
        photoURL: null,
      } as any,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Profile />);

    // Email should appear twice (once as name, once as email)
    const emailElements = screen.getAllByText("test@test.com");
    expect(emailElements).toHaveLength(2);
  });

  it("displays user photo when photoURL is available", () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: {
        uid: "123",
        email: "test@test.com",
        displayName: "Test User",
        photoURL: "https://example.com/photo.jpg",
      } as any,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Profile />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("alt", "Test User");
  });

  it("displays user icon when photoURL is not available", () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: {
        uid: "123",
        email: "test@test.com",
        displayName: "Test User",
        photoURL: null,
      } as any,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Profile />);

    // Icon should be rendered (as SVG)
    const avatar = screen
      .getByText("Test User")
      .parentElement?.querySelector("svg");
    expect(avatar).toBeInTheDocument();
  });

  it('displays "View My Goals" link', () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: {
        uid: "123",
        email: "test@test.com",
        displayName: "Test User",
        photoURL: null,
      } as any,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Profile />);

    const link = screen.getByRole("link", { name: /View My Goals/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/goal");
  });
});
