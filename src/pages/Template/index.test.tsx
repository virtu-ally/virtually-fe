import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";

import Template from "./index";
import userEvent from "@testing-library/user-event";

// Mock contexts
vi.mock("../../context/CustomerContext", () => ({
  useCustomer: () => ({
    profile: { customerId: "test-customer-id" },
    addGoal: vi.fn(),
  }),
}));

// Mock API functions
const mockGetCategories = vi.fn();
const mockCreateCategory = vi.fn();
const mockCreateGoal = vi.fn();
const mockSuggestHabits = vi.fn();
const mockPollForResults = vi.fn();
const mockGetCustomerQuiz = vi.fn();

vi.mock("../../api/categories", () => ({
  getCategories: () => mockGetCategories(),
  createCategory: (name: string) => mockCreateCategory(name),
}));

vi.mock("../../api/habits", () => ({
  createGoal: (data: any) => mockCreateGoal(data),
  suggestHabits: (data: any) => mockSuggestHabits(data),
  pollForResults: (id: string) => mockPollForResults(id),
}));

vi.mock("../../api/hooks/useCustomerQuiz", () => ({
  useGetCustomerQuiz: () => ({
    data: mockGetCustomerQuiz(),
    isLoading: false,
  }),
  useSaveCustomerQuiz: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));

vi.mock("../../context/QuizContext", () => ({
  useQuiz: () => ({
    state: {
      currentQuestion: 0,
      age: "",
      educationLevel: "",
      weight: "",
      height: "",
      goals: [],
    },
    dispatch: vi.fn(),
  }),
}));

// Mock navigation
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useLocation: () => ({ state: null }),
  };
});

describe("Template Component", () => {
  let queryClient: QueryClient;
  const mockSetActiveTab = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue([]);
    mockGetCustomerQuiz.mockReturnValue(null);
  });

  const renderWithClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it("renders category selection view initially", async () => {
    mockGetCategories.mockResolvedValue([]);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(() => {
      expect(screen.getByText(/Create a New Goal/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Choose a category to get started/i)
      ).toBeInTheDocument();
    });
  });

  it("displays loading state for categories", async () => {
    mockGetCategories.mockImplementation(() => new Promise(() => {}));

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(() => {
      expect(screen.getByText(/Loading categories.../i)).toBeInTheDocument();
    });
  });

  it("displays error state when categories fail to load", async () => {
    mockGetCategories.mockRejectedValue(new Error("Failed to fetch"));

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load categories/i)
      ).toBeInTheDocument();
    });
  });

  it("renders category cards", async () => {
    mockGetCategories.mockResolvedValue([
      { id: "1", name: "Health" },
      { id: "2", name: "Education" },
    ]);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
      expect(screen.getByText("Education")).toBeInTheDocument();
    });
  });

  it('shows "Create Custom Category" button', async () => {
    mockGetCategories.mockResolvedValue([]);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(() => {
      expect(screen.getByText(/Create Custom Category/i)).toBeInTheDocument();
    });
  });

  it("shows quiz option when quiz is not completed", async () => {
    mockGetCategories.mockResolvedValue([]);
    mockGetCustomerQuiz.mockReturnValue(null);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Take our quiz for personalized recommendations/i)
      ).toBeInTheDocument();
    });
  });

  it("shows quiz completed message when quiz is done", async () => {
    mockGetCategories.mockResolvedValue([]);
    mockGetCustomerQuiz.mockReturnValue({ id: "quiz-1", completed: true });

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(() => {
      expect(screen.getByText(/Quiz completed!/i)).toBeInTheDocument();
    });
  });

  it("selects category and shows goal form", async () => {
    const user = userEvent.setup();
    mockGetCategories.mockResolvedValue([{ id: "1", name: "Health" }]);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
    });

    const healthCard = screen.getByText("Health").closest(".category-card");
    if (healthCard) {
      await user.click(healthCard);
    }

    await waitFor(() => {
      expect(
        screen.getByText(/Describe your overall Health goal/i)
      ).toBeInTheDocument();
    });
  });

  it("renders goal description input after selecting category", async () => {
    const user = userEvent.setup();
    mockGetCategories.mockResolvedValue([{ id: "1", name: "Health" }]);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(async () => {
      const healthCard = screen.getByText("Health").closest(".category-card");
      if (healthCard) await user.click(healthCard);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/I want to.../i)).toBeInTheDocument();
    });
  });

  it("renders timeframe input after selecting category", async () => {
    const user = userEvent.setup();
    mockGetCategories.mockResolvedValue([{ id: "1", name: "Health" }]);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(async () => {
      const healthCard = screen.getByText("Health").closest(".category-card");
      if (healthCard) await user.click(healthCard);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/12 months.../i)).toBeInTheDocument();
    });
  });

  it("shows back to categories button after selecting category", async () => {
    const user = userEvent.setup();
    mockGetCategories.mockResolvedValue([{ id: "1", name: "Health" }]);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(async () => {
      const healthCard = screen.getByText("Health").closest(".category-card");
      if (healthCard) await user.click(healthCard);
    });

    await waitFor(() => {
      expect(screen.getByText(/Back to categories/i)).toBeInTheDocument();
    });
  });

  it("returns to category selection when back button is clicked", async () => {
    const user = userEvent.setup();
    mockGetCategories.mockResolvedValue([{ id: "1", name: "Health" }]);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(async () => {
      const healthCard = screen.getByText("Health").closest(".category-card");
      if (healthCard) await user.click(healthCard);
    });

    await waitFor(() => {
      expect(screen.getByText(/Back to categories/i)).toBeInTheDocument();
    });

    const backButton = screen.getByText(/Back to categories/i);
    await user.click(backButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Choose a category to get started/i)
      ).toBeInTheDocument();
    });
  });

  it("shows create category form when create button is clicked", async () => {
    const user = userEvent.setup();
    mockGetCategories.mockResolvedValue([]);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(async () => {
      const createButton = screen.getByText(/Create Custom Category/i);
      await user.click(createButton);
    });

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Category name.../i)
      ).toBeInTheDocument();
    });
  });

  it("renders Quiz component when quiz button is clicked", async () => {
    const user = userEvent.setup();
    mockGetCategories.mockResolvedValue([]);
    mockGetCustomerQuiz.mockReturnValue(null);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(() => {
      const quizButton = screen.getByText(
        /Take our quiz for personalized recommendations/i
      );
      expect(quizButton).toBeInTheDocument();
    });

    const quizCard = screen
      .getByText(/Take our quiz for personalized recommendations/i)
      .closest(".quiz-option-card");
    if (quizCard) {
      await user.click(quizCard);
    }

    await waitFor(() => {
      // Quiz shows "What is your age" on the first question
      expect(screen.getByText(/What is your age/i)).toBeInTheDocument();
    });
  });

  it("disables submit button initially", async () => {
    const user = userEvent.setup();
    mockGetCategories.mockResolvedValue([{ id: "1", name: "Health" }]);

    renderWithClient(<Template setActiveTab={mockSetActiveTab} />);

    await waitFor(async () => {
      const healthCard = screen.getByText("Health").closest(".category-card");
      if (healthCard) await user.click(healthCard);
    });

    await waitFor(() => {
      const submitButton = screen.getByRole("button", { name: /Submit/i });
      expect(submitButton).toBeDisabled();
    });
  });
});
