import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";

import Goal from "./index";

vi.mock("../../context/CustomerContext", () => ({
  useCustomer: () => ({
    profile: { customerId: "test-customer-id" },
  }),
}));

// Mock API
const mockGetCustomerGoals = vi.fn();
vi.mock("../../api/goals", () => ({
  getCustomerGoals: () => mockGetCustomerGoals(),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/goal", state: null }),
  };
});

describe("Goal Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockGetCustomerGoals.mockResolvedValue([]);
  });

  const renderWithClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it("renders tab navigation", async () => {
    mockGetCustomerGoals.mockResolvedValue([]);

    renderWithClient(<Goal defaultTab="setup" />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /New Goal/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Goals$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Progress/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Edit Goals/i })
      ).toBeInTheDocument();
    });
  });

  it("displays setup tab by default when no goals exist", async () => {
    mockGetCustomerGoals.mockResolvedValue([]);

    renderWithClient(<Goal />);

    await waitFor(() => {
      expect(screen.getByText(/Create a New Goal/i)).toBeInTheDocument();
    });
  });

  it("highlights active tab", async () => {
    mockGetCustomerGoals.mockResolvedValue([]);

    renderWithClient(<Goal defaultTab="setup" />);

    await waitFor(() => {
      const newGoalTab = screen.getByRole("button", { name: /New Goal/i });
      expect(newGoalTab).toHaveClass("active");
    });
  });

  it("changes content when tab is clicked", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    mockGetCustomerGoals.mockResolvedValue([
      {
        id: "1",
        description: "Test Goal",
        habits: [],
      },
    ]);

    renderWithClient(<Goal defaultTab="setup" />);

    await waitFor(() => {
      expect(screen.getByText(/Create a New Goal/i)).toBeInTheDocument();
    });

    const goalsTab = screen.getByRole("button", { name: /^Goals$/i });
    await user.click(goalsTab);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/goal/goals");
    });
  });

  it("renders all four tabs", async () => {
    mockGetCustomerGoals.mockResolvedValue([]);

    renderWithClient(<Goal />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /New Goal/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /^Goals$/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Progress/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Edit Goals/i })
      ).toBeInTheDocument();
    });
  });

  it("passes goals data to child components", async () => {
    const mockGoals = [
      {
        id: "1",
        description: "Test Goal 1",
        habits: [{ id: "h1", title: "Habit 1" }],
      },
      {
        id: "2",
        description: "Test Goal 2",
        habits: [{ id: "h2", title: "Habit 2" }],
      },
    ];
    mockGetCustomerGoals.mockResolvedValue(mockGoals);

    renderWithClient(<Goal defaultTab="goals" />);

    await waitFor(() => {
      expect(mockGetCustomerGoals).toHaveBeenCalled();
    });
  });

  it("navigates to correct route for setup tab", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    mockGetCustomerGoals.mockResolvedValue([
      { id: "1", description: "Goal", habits: [] },
    ]);

    renderWithClient(<Goal defaultTab="goals" />);

    await waitFor(() => {
      const setupTab = screen.getByRole("button", { name: /New Goal/i });
      expect(setupTab).toBeInTheDocument();
    });

    const setupTab = screen.getByRole("button", { name: /New Goal/i });
    await user.click(setupTab);

    expect(mockNavigate).toHaveBeenCalledWith("/goal/new");
  });

  it("navigates to correct route for progress tab", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    mockGetCustomerGoals.mockResolvedValue([
      { id: "1", description: "Goal", habits: [] },
    ]);

    renderWithClient(<Goal defaultTab="goals" />);

    await waitFor(() => {
      const progressTab = screen.getByRole("button", { name: /Progress/i });
      expect(progressTab).toBeInTheDocument();
    });

    const progressTab = screen.getByRole("button", { name: /Progress/i });
    await user.click(progressTab);

    expect(mockNavigate).toHaveBeenCalledWith("/goal/progress");
  });

  it("navigates to correct route for edit tab", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    mockGetCustomerGoals.mockResolvedValue([
      { id: "1", description: "Goal", habits: [] },
    ]);

    renderWithClient(<Goal defaultTab="goals" />);

    await waitFor(() => {
      const editTab = screen.getByRole("button", { name: /Edit Goals/i });
      expect(editTab).toBeInTheDocument();
    });

    const editTab = screen.getByRole("button", { name: /Edit Goals/i });
    await user.click(editTab);

    expect(mockNavigate).toHaveBeenCalledWith("/goal/edit");
  });
});
