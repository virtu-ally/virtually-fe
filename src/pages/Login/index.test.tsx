import * as FirebaseAuthContext from "../../context/FirebaseAuthContext";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";

import Login from "./index";
import userEvent from "@testing-library/user-event";

// Mock the navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API functions
vi.mock("../../api/customer", () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

describe("Login Component", () => {
  const mockLogin = vi.fn();
  const mockSignup = vi.fn();
  const mockLoginWithGoogle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
      signup: mockSignup,
      logout: vi.fn(),
      loginWithGoogle: mockLoginWithGoogle,
      sessionExpired: false,
    });
  });

  it("renders signup form by default", () => {
    render(<Login />);

    expect(
      screen.getByPlaceholderText(/Enter your first name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your last name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your email/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your password/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Confirm your password/i)
    ).toBeInTheDocument();
  });

  it("switches back to signup form when signup tab is clicked", async () => {
    const user = userEvent.setup();
    render(<Login />);

    // First switch to login
    const loginTabs = screen.getAllByRole("button", { name: /^Login$/i });
    const loginTab = loginTabs.find(
      (btn) =>
        !btn.hasAttribute("type") || btn.getAttribute("type") !== "submit"
    )!;
    await user.click(loginTab);

    // Then switch back to signup (find the tab, not the submit button)
    const signupTabs = screen.getAllByRole("button", { name: /Sign Up/i });
    const signupTab = signupTabs.find(
      (btn) =>
        !btn.hasAttribute("type") || btn.getAttribute("type") !== "submit"
    )!;
    await user.click(signupTab);

    expect(
      screen.getByPlaceholderText(/Enter your first name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Confirm your password/i)
    ).toBeInTheDocument();
  });

  it("displays Google sign-in button", () => {
    render(<Login />);

    expect(
      screen.getByRole("button", { name: /Sign in with Google/i })
    ).toBeInTheDocument();
  });

  it("shows validation error when email is empty on login", async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Switch to login tab
    const loginTabs = screen.getAllByRole("button", { name: /^Login$/i });
    const loginTab = loginTabs.find(
      (btn) =>
        !btn.hasAttribute("type") || btn.getAttribute("type") !== "submit"
    )!;
    await user.click(loginTab);

    // Get the submit button (type="submit")
    const submitButtons = screen.getAllByRole("button", { name: /^Login$/i });
    const submitButton = submitButtons.find(
      (btn) => btn.getAttribute("type") === "submit"
    )!;
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter your email address/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error when password is empty on login", async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Switch to login tab
    const loginTabs = screen.getAllByRole("button", { name: /^Login$/i });
    const loginTab = loginTabs.find(
      (btn) =>
        !btn.hasAttribute("type") || btn.getAttribute("type") !== "submit"
    )!;
    await user.click(loginTab);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    await user.type(emailInput, "test@test.com");

    // Get the submit button (type="submit")
    const submitButtons = screen.getAllByRole("button", { name: /^Login$/i });
    const submitButton = submitButtons.find(
      (btn) => btn.getAttribute("type") === "submit"
    )!;
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter your password/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error when passwords do not match on signup", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(
      screen.getByPlaceholderText(/Enter your first name/i),
      "John"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your last name/i),
      "Doe"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your email/i),
      "test@test.com"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your password/i),
      "password123"
    );
    await user.type(
      screen.getByPlaceholderText(/Confirm your password/i),
      "password456"
    );

    // Get the submit button (type="submit")
    const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
    const submitButton = submitButtons.find(
      (btn) => btn.getAttribute("type") === "submit"
    )!;
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when password is too short on signup", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(
      screen.getByPlaceholderText(/Enter your first name/i),
      "John"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your last name/i),
      "Doe"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your email/i),
      "test@test.com"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your password/i),
      "12345"
    );
    await user.type(
      screen.getByPlaceholderText(/Confirm your password/i),
      "12345"
    );

    // Get the submit button (type="submit")
    const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
    const submitButton = submitButtons.find(
      (btn) => btn.getAttribute("type") === "submit"
    )!;
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Password must be at least 6 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("calls loginWithGoogle when Google button is clicked", async () => {
    const user = userEvent.setup();
    mockLoginWithGoogle.mockResolvedValue({
      email: "test@test.com",
      displayName: "Test User",
    });

    render(<Login />);

    const googleButton = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleButton);

    expect(mockLoginWithGoogle).toHaveBeenCalled();
  });

  it("disables buttons when loading", () => {
    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: true,
      login: mockLogin,
      signup: mockSignup,
      logout: vi.fn(),
      loginWithGoogle: mockLoginWithGoogle,
      sessionExpired: false,
    });

    render(<Login />);

    const signupButton = screen.getByRole("button", { name: /Signing up.../i });
    const googleButton = screen.getByRole("button", {
      name: /Please wait.../i,
    });

    expect(signupButton).toBeDisabled();
    expect(googleButton).toBeDisabled();
  });

  it("shows close button on toast messages", async () => {
    const user = userEvent.setup();
    render(<Login />);

    // Trigger a validation error by clicking the submit button
    const submitButtons = screen.getAllByRole("button", { name: /Sign Up/i });
    const submitButton = submitButtons.find(
      (btn) => btn.getAttribute("type") === "submit"
    )!;
    await user.click(submitButton);

    // The form validates email first, so we'll see the email error
    await waitFor(() => {
      expect(
        screen.getByText(/Please enter your email address/i)
      ).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", { name: /Close/i });
    expect(closeButton).toBeInTheDocument();

    await user.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/Please enter your email address/i)
      ).not.toBeInTheDocument();
    });
  });
});
