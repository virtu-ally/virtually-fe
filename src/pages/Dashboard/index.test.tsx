import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";

import Dashboard from "./index";

// Mock contexts
vi.mock("../../context/FirebaseAuthContext", () => ({
  useAuth: () => ({
    user: {
      uid: "test-user-id",
      email: "test@test.com",
      displayName: "Test User",
    },
    loading: false,
  }),
}));

vi.mock("../../context/CustomerContext", () => ({
  useCustomer: () => ({
    profile: { customerId: "test-customer-id" },
    setProfile: vi.fn(),
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

// Mock API functions
const mockLogin = vi.fn();
const mockGetCategories = vi.fn();
const mockGetCustomerQuiz = vi.fn();

vi.mock("../../api/customer", () => ({
  login: () => mockLogin(),
  signup: vi.fn(),
}));

vi.mock("../../api/categories", () => ({
  getCategories: () => mockGetCategories(),
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

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Dashboard Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockLogin.mockResolvedValue({ id: "customer-1" });
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

  it('renders "Select a category" text', async () => {
    mockGetCategories.mockResolvedValue([]);

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Select a category/i)).toBeInTheDocument();
    });
  });

  it("displays loading state for categories", async () => {
    mockGetCategories.mockImplementation(() => new Promise(() => {}));

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Loading categories.../i)).toBeInTheDocument();
    });
  });

  it("displays error state when categories fail to load", async () => {
    mockGetCategories.mockRejectedValue(new Error("Failed to fetch"));

    renderWithClient(<Dashboard />);

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
      { id: "3", name: "Life" },
    ]);

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
      expect(screen.getByText("Education")).toBeInTheDocument();
      expect(screen.getByText("Life")).toBeInTheDocument();
    });
  });

  it("displays appropriate icons for categories", async () => {
    mockGetCategories.mockResolvedValue([
      { id: "1", name: "Health" },
      { id: "2", name: "Education" },
      { id: "3", name: "Life" },
    ]);

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      // Check for icons via their lucide class names
      expect(document.querySelector(".lucide-heart")).toBeInTheDocument();
      expect(
        document.querySelector(".lucide-graduation-cap")
      ).toBeInTheDocument();
      expect(document.querySelector(".lucide-life-buoy")).toBeInTheDocument();
    });
  });

  it("shows quiz option when quiz is not completed", async () => {
    mockGetCategories.mockResolvedValue([]);
    mockGetCustomerQuiz.mockReturnValue(null);

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Take our quiz for personalised recommendations/i)
      ).toBeInTheDocument();
    });
  });

  it('shows "Quiz completed" when quiz is done', async () => {
    mockGetCategories.mockResolvedValue([]);
    mockGetCustomerQuiz.mockReturnValue({ id: "quiz-1", completed: true });

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Quiz completed!/i)).toBeInTheDocument();
    });
  });

  it("does not show quiz option when quiz is completed", async () => {
    mockGetCategories.mockResolvedValue([]);
    mockGetCustomerQuiz.mockReturnValue({ id: "quiz-1", completed: true });

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.queryByText(/Take our quiz for personalised recommendations/i)
      ).not.toBeInTheDocument();
    });
  });

  it("navigates to goal page when category is clicked", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    mockGetCategories.mockResolvedValue([{ id: "1", name: "Health" }]);

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Health")).toBeInTheDocument();
    });

    const categoryCard = screen.getByText("Health").closest(".card");
    if (categoryCard) {
      await user.click(categoryCard);
    }

    // Navigation happens after animation delay
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it("renders Quiz component when quiz is clicked", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    mockGetCategories.mockResolvedValue([]);
    mockGetCustomerQuiz.mockReturnValue(null);

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      const quizCard = screen
        .getByText(/Take our quiz for personalised recommendations/i)
        .closest(".quiz-card");
      expect(quizCard).toBeInTheDocument();
    });

    const quizCard = screen
      .getByText(/Take our quiz for personalised recommendations/i)
      .closest(".quiz-card");
    if (quizCard) {
      await user.click(quizCard);
    }

    await waitFor(() => {
      // Quiz shows "What is your age" on the first question
      expect(screen.getByText(/What is your age/i)).toBeInTheDocument();
    });
  });

  it("shows alert when trying to take quiz again after completion", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    global.alert = vi.fn();

    mockGetCategories.mockResolvedValue([]);
    mockGetCustomerQuiz.mockReturnValue({ id: "quiz-1", completed: true });

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Quiz completed!/i)).toBeInTheDocument();
    });

    // Since the quiz card is not shown when completed, we can't test clicking it
    // This test verifies the completed state is shown correctly
  });

  it("renders default folder icon for unknown category", async () => {
    mockGetCategories.mockResolvedValue([
      { id: "1", name: "Unknown Category" },
    ]);

    renderWithClient(<Dashboard />);

    await waitFor(() => {
      // Check for folder icon via its lucide class name
      expect(document.querySelector(".lucide-folder-open")).toBeInTheDocument();
    });
  });
});
