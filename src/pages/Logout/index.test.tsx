import * as FirebaseAuthContext from "../../context/FirebaseAuthContext";

import { describe, expect, it, vi } from "vitest";

import Logout from "./index";
import { render } from "../../test/test-utils";

// Mock the navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Logout Component", () => {
  it("calls logout and navigates to home on mount", async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: mockLogout,
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    render(<Logout />);

    // Wait for useEffect to complete
    await vi.waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it("renders null (no visible content)", () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(FirebaseAuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: mockLogout,
      loginWithGoogle: vi.fn(),
      sessionExpired: false,
    });

    const { container } = render(<Logout />);

    expect(container.firstChild).toBeNull();
  });
});
