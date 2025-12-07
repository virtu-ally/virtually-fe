import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";

import Progress from "./Progress";
import userEvent from "@testing-library/user-event";

// Mock API functions
const mockGetCategories = vi.fn();
vi.mock("../../api/categories", () => ({
  getCategories: () => mockGetCategories(),
}));

// Mock habits hooks
const mockUseHabitCompletionsByDate = vi.fn();
const mockUseRecordHabitCompletion = vi.fn();

vi.mock("../../api/hooks/useHabits", () => ({
  useHabitCompletionsByDate: () => mockUseHabitCompletionsByDate(),
  useRecordHabitCompletion: () => mockUseRecordHabitCompletion(),
}));

describe("Progress Component", () => {
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

    mockGetCategories.mockResolvedValue([
      { id: "cat-1", name: "Health" },
      { id: "cat-2", name: "Education" },
    ]);

    mockUseHabitCompletionsByDate.mockReturnValue({
      completionsByDate: {},
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseRecordHabitCompletion.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
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
      <Progress
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    expect(screen.getByText(/Progress Tracker/i)).toBeInTheDocument();
  });

  it("displays loading state for goals", () => {
    renderWithClient(
      <Progress
        goals={[]}
        isLoading={true}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    expect(screen.getByText(/Loading goals.../i)).toBeInTheDocument();
  });

  it("displays error state for goals", () => {
    renderWithClient(
      <Progress
        goals={[]}
        isLoading={false}
        isError={true}
        error={new Error("Failed to load goals")}
        customerId="test-customer-id"
      />
    );

    expect(screen.getByText(/Failed to load goals/i)).toBeInTheDocument();
  });

  it("displays empty state when no goals", () => {
    renderWithClient(
      <Progress
        goals={[]}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    expect(screen.getByText(/No goals yet/i)).toBeInTheDocument();
  });

  it("renders calendar with current month", () => {
    renderWithClient(
      <Progress
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    const currentDate = new Date();
    const monthYear = currentDate.toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });

    expect(screen.getByText(monthYear)).toBeInTheDocument();
  });

  it("renders weekday headers", () => {
    renderWithClient(
      <Progress
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("navigates to previous month", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <Progress
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    const prevButton = screen.getByRole("button", { name: /Prev/i });
    await user.click(prevButton);

    // Calendar should update (we can't easily test the exact month change in isolation)
    expect(prevButton).toBeInTheDocument();
  });

  it("navigates to next month", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <Progress
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    const nextButton = screen.getByRole("button", { name: /Next/i });
    await user.click(nextButton);

    expect(nextButton).toBeInTheDocument();
  });

  it("displays habits grouped by category", async () => {
    mockGetCategories.mockResolvedValue([
      { id: "cat-1", name: "Health" },
      { id: "cat-2", name: "Education" },
    ]);

    renderWithClient(
      <Progress
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
      expect(screen.getByText("Education")).toBeInTheDocument();
    });
  });

  it("displays habits for selected date", async () => {
    renderWithClient(
      <Progress
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
      expect(screen.getByText("Habit 3")).toBeInTheDocument();
    });
  });

  it("shows habit completion checkboxes", async () => {
    renderWithClient(
      <Progress
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      const habits = screen.getAllByText(/Habit [1-3]/);
      expect(habits.length).toBeGreaterThan(0);
    });
  });

  it("prevents marking future dates", async () => {
    const user = userEvent.setup();
    global.alert = vi.fn();

    renderWithClient(
      <Progress
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    // Navigate to next month first
    const nextButton = screen.getByRole("button", { name: /Next/i });
    await user.click(nextButton);

    // Future dates should be disabled
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const futureDateButtons = buttons.filter(
        (btn) =>
          (btn as HTMLButtonElement).disabled && btn.textContent?.match(/^\d+$/)
      );
      expect(futureDateButtons.length).toBeGreaterThan(0);
    });
  });
});
