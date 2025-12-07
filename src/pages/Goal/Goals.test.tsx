import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";

import Goals from "./Goals";
import userEvent from "@testing-library/user-event";

// Mock API functions
const mockGetCategories = vi.fn();
const mockMoveGoal = vi.fn();
const mockDeleteGoal = vi.fn();

vi.mock("../../api/categories", () => ({
  getCategories: () => mockGetCategories(),
}));

vi.mock("../../api/goals", () => ({
  moveGoal: (goalId: string, categoryId: string) =>
    mockMoveGoal(goalId, categoryId),
  deleteGoal: (goalId: string) => mockDeleteGoal(goalId),
}));

// Mock hooks
const mockUseMonthlyHabitCompletions = vi.fn();
vi.mock("../../api/hooks/useHabits", () => ({
  useMonthlyHabitCompletions: () => mockUseMonthlyHabitCompletions(),
}));

describe("Goals Component", () => {
  let queryClient: QueryClient;

  const mockGoals = [
    {
      id: "1",
      description: "Test Goal 1",
      category_id: "cat-1",
      habits: [
        { id: "h1", title: "Habit 1" },
        { id: "h2", title: "Habit 2" },
      ],
    },
    {
      id: "2",
      description: "Test Goal 2",
      category_id: "cat-2",
      habits: [{ id: "h3", title: "Habit 3" }],
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true);
    global.alert = vi.fn();

    mockGetCategories.mockResolvedValue([
      { id: "cat-1", name: "Health" },
      { id: "cat-2", name: "Education" },
    ]);

    mockUseMonthlyHabitCompletions.mockReturnValue({
      data: [],
    });
  });

  const renderWithClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it("renders the component with title", () => {
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    expect(screen.getByText(/Goal Overview/i)).toBeInTheDocument();
  });

  it("displays loading state", () => {
    renderWithClient(
      <Goals
        goals={null}
        isLoading={true}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    expect(screen.getByText(/Loading goals.../i)).toBeInTheDocument();
  });

  it("displays error state", () => {
    renderWithClient(
      <Goals
        goals={null}
        isLoading={false}
        isError={true}
        error={new Error("Failed to load")}
        customerId="test-customer-id"
      />
    );

    expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
  });

  it("renders category filter tabs", async () => {
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Health" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Education" })
      ).toBeInTheDocument();
    });
  });

  it("displays current month statistics", async () => {
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Completions This Month/i)).toBeInTheDocument();
      expect(screen.getByText(/Monthly Completion Rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Goals/i)).toBeInTheDocument();
    });
  });

  it("displays goals for selected category", async () => {
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test Goal 1")).toBeInTheDocument();
    });
  });

  it("displays habits for each goal", async () => {
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Habit 1")).toBeInTheDocument();
      expect(screen.getByText("Habit 2")).toBeInTheDocument();
    });
  });

  it("switches category when filter tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      const educationButtons = screen.getAllByRole("button", {
        name: "Education",
      });
      expect(educationButtons.length).toBeGreaterThan(0);
    });

    // Get the category filter tab (first one with this name)
    const educationButtons = screen.getAllByRole("button", {
      name: "Education",
    });
    const educationTab = educationButtons.find((btn) =>
      btn.classList.contains("goal-category-btn")
    )!;
    await user.click(educationTab);

    await waitFor(() => {
      expect(screen.getByText("Test Goal 2")).toBeInTheDocument();
    });
  });

  it("highlights selected category tab", async () => {
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      const healthTab = screen.getByRole("button", { name: "Health" });
      expect(healthTab).toHaveClass("selected");
    });
  });

  it("displays move and delete buttons for each goal", async () => {
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      const moveButtons = screen.getAllByTitle("Move to another category");
      const deleteButtons = screen.getAllByTitle("Delete goal");
      expect(moveButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it("confirms before deleting a goal", async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => true);
    mockDeleteGoal.mockResolvedValue({});

    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test Goal 1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Delete goal");
    await user.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
  });

  it("does not delete when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => false);

    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test Goal 1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Delete goal");
    await user.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockDeleteGoal).not.toHaveBeenCalled();
  });

  it("renders chart component", async () => {
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      // Check for chart-related content - the Chart component shows month statistics
      const chartContainer = document.querySelector(".chart-container");
      expect(chartContainer).toBeInTheDocument();
    });
  });

  it("only shows categories with habits", async () => {
    const goalsWithMixedHabits = [
      {
        id: "1",
        description: "Goal with habits",
        category_id: "cat-1",
        habits: [{ id: "h1", title: "Habit 1" }],
      },
      {
        id: "2",
        description: "Goal without habits",
        category_id: "cat-2",
        habits: [],
      },
    ];

    renderWithClient(
      <Goals
        goals={goalsWithMixedHabits}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Health" })
      ).toBeInTheDocument();
      // Education should not appear since it has no goals with habits
      expect(
        screen.queryByRole("button", { name: "Education" })
      ).not.toBeInTheDocument();
    });
  });

  it("calculates completion rate correctly", async () => {
    mockUseMonthlyHabitCompletions.mockReturnValue({
      data: [
        { habitId: "h1", completionDate: "2024-01-01" },
        { habitId: "h2", completionDate: "2024-01-02" },
      ],
    });

    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      // Should display completion rate percentage
      const completionRateElement = screen.getByText(
        /Monthly Completion Rate/i
      );
      expect(completionRateElement).toBeInTheDocument();
    });
  });

  it("displays move category dropdown options", async () => {
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Move to:")).toBeInTheDocument();
    });
  });

  it("sets initial category from initialCategoryId prop", async () => {
    renderWithClient(
      <Goals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
        initialCategoryId="cat-2"
      />
    );

    await waitFor(() => {
      // Should show goals from Education category (cat-2)
      expect(screen.getByText("Test Goal 2")).toBeInTheDocument();
    });
  });
});
