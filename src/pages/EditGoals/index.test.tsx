import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";

import EditGoals from "./index";
import userEvent from "@testing-library/user-event";

// Mock API functions
const mockGetCategories = vi.fn();
const mockDeleteGoal = vi.fn();

vi.mock("../../api/categories", () => ({
  getCategories: () => mockGetCategories(),
}));

vi.mock("../../api/goals", () => ({
  deleteGoal: (id: string) => mockDeleteGoal(id),
}));

// Mock hooks
const mockUseCreateNewHabitsForGoal = vi.fn();
vi.mock("../../api/hooks/useHabits", () => ({
  useCreateNewHabitsForGoal: () => mockUseCreateNewHabitsForGoal(),
}));

// Mock HabitEditor component (OK to mock as it's a complex form component)
vi.mock("../../components/HabitEditor", () => ({
  default: ({ habits, onHabitsChange }: any) => (
    <div data-testid="habit-editor">
      {habits.map((habit: string, index: number) => (
        <div key={index}>{habit}</div>
      ))}
      <button onClick={() => onHabitsChange([...habits, "New Habit"])}>
        Add Habit
      </button>
    </div>
  ),
}));

describe("EditGoals Component", () => {
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

    mockUseCreateNewHabitsForGoal.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
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
      <EditGoals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    expect(screen.getByText(/Edit Goals/i)).toBeInTheDocument();
  });

  it("displays loading state", () => {
    renderWithClient(
      <EditGoals
        goals={[]}
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
      <EditGoals
        goals={[]}
        isLoading={false}
        isError={true}
        error={new Error("Failed to load")}
        customerId="test-customer-id"
      />
    );

    expect(screen.getByText(/Error: Failed to load/i)).toBeInTheDocument();
  });

  it("displays goals grouped by category", async () => {
    renderWithClient(
      <EditGoals
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

  it("displays goal descriptions", async () => {
    renderWithClient(
      <EditGoals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test Goal 1")).toBeInTheDocument();
      expect(screen.getByText("Test Goal 2")).toBeInTheDocument();
    });
  });

  it("displays habit tags for each goal", async () => {
    renderWithClient(
      <EditGoals
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

  it("displays empty state when no goals with habits", async () => {
    const goalsWithoutHabits = [
      {
        id: "1",
        description: "Test Goal",
        category_id: "cat-1",
        habits: [],
      },
    ];

    renderWithClient(
      <EditGoals
        goals={goalsWithoutHabits}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No goals with habits found/i)
      ).toBeInTheDocument();
    });
  });

  it("selects a goal when clicked", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <EditGoals
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

    const goalCard = screen
      .getByText("Test Goal 1")
      .closest('div[class*="rounded-lg"]');
    if (goalCard) {
      await user.click(goalCard);
    }

    await waitFor(() => {
      expect(screen.getByText(/Edit Your Goal/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Create new improved habits for:/i)
      ).toBeInTheDocument();
    });
  });

  it("shows current habits when goal is selected", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <EditGoals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(async () => {
      const goalCard = screen
        .getByText("Test Goal 1")
        .closest('div[class*="rounded-lg"]');
      if (goalCard) await user.click(goalCard);
    });

    await waitFor(() => {
      expect(screen.getByText(/Current Habits/i)).toBeInTheDocument();
    });
  });

  it("shows progress notes textarea when goal is selected", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <EditGoals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(async () => {
      const goalCard = screen
        .getByText("Test Goal 1")
        .closest('div[class*="rounded-lg"]');
      if (goalCard) await user.click(goalCard);
    });

    await waitFor(() => {
      expect(screen.getByText(/Progress Notes/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          /How have your current habits been working/i
        )
      ).toBeInTheDocument();
    });
  });

  it("shows HabitEditor when goal is selected", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <EditGoals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(async () => {
      const goalCard = screen
        .getByText("Test Goal 1")
        .closest('div[class*="rounded-lg"]');
      if (goalCard) await user.click(goalCard);
    });

    await waitFor(() => {
      expect(screen.getByTestId("habit-editor")).toBeInTheDocument();
    });
  });

  it("goes back to goal list when back button is clicked", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <EditGoals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(async () => {
      const goalCard = screen
        .getByText("Test Goal 1")
        .closest('div[class*="rounded-lg"]');
      if (goalCard) await user.click(goalCard);
    });

    await waitFor(() => {
      expect(screen.getByText(/← Back to goals/i)).toBeInTheDocument();
    });

    const backButton = screen.getByText(/← Back to goals/i);
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/Edit Goals/i)).toBeInTheDocument();
      expect(screen.queryByText(/Edit Your Goal/i)).not.toBeInTheDocument();
    });
  });

  it("shows delete button for each goal", async () => {
    renderWithClient(
      <EditGoals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle("Delete goal");
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it("confirms before deleting a goal", async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => true);
    mockDeleteGoal.mockResolvedValue({});

    renderWithClient(
      <EditGoals
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

  it("validates progress notes before submission", async () => {
    const user = userEvent.setup();
    global.alert = vi.fn();

    renderWithClient(
      <EditGoals
        goals={mockGoals}
        isLoading={false}
        isError={false}
        error={null as any}
        customerId="test-customer-id"
      />
    );

    await waitFor(async () => {
      const goalCard = screen
        .getByText("Test Goal 1")
        .closest('div[class*="rounded-lg"]');
      if (goalCard) await user.click(goalCard);
    });

    await waitFor(() => {
      const submitButton = screen.getByRole("button", {
        name: /Create New Habits/i,
      });
      expect(submitButton).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", {
      name: /Create New Habits/i,
    });
    await user.click(submitButton);

    expect(global.alert).toHaveBeenCalledWith(
      expect.stringContaining("progress notes")
    );
  });
});
