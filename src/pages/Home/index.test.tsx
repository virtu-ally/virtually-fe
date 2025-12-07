import * as FirebaseAuthContext from "../../context/FirebaseAuthContext";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "../../test/test-utils";

import Home from "./index";

// Mock the navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Home Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the home page with title and description", () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText(/A Shared Journey to Your Goals./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Virtually helps you set, track, and achieve your personal goals/i
      )
    ).toBeInTheDocument();
  });

  it('displays "Get Started" button when user is not logged in', () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Home />);

    const getStartedButton = screen.getByRole("button", {
      name: /Get Started/i,
    });
    expect(getStartedButton).toBeInTheDocument();
  });

  it('displays "Set up your Goals" button when user is logged in', () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: { uid: "123", email: "test@test.com" } as any,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Home />);

    const setupGoalsButton = screen.getByRole("button", {
      name: /Set up your Goals/i,
    });
    expect(setupGoalsButton).toBeInTheDocument();
  });

  it('navigates to login page when "Get Started" is clicked', () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Home />);

    const getStartedButton = screen.getByRole("button", {
      name: /Get Started/i,
    });
    getStartedButton.click();

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it('navigates to goal page when "Set up your Goals" is clicked', () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: { uid: "123", email: "test@test.com" } as any,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Home />);

    const setupGoalsButton = screen.getByRole("button", {
      name: /Set up your Goals/i,
    });
    setupGoalsButton.click();

    expect(mockNavigate).toHaveBeenCalledWith("/goal");
  });

  it("renders all feature cards", () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Home />);

    expect(screen.getByText("Set Personal Goals")).toBeInTheDocument();
    expect(screen.getByText("Track Your Progress")).toBeInTheDocument();
    expect(screen.getByText("Visualize Achievements")).toBeInTheDocument();
    expect(screen.getByText("Stay Accountable")).toBeInTheDocument();
  });
});
