import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";

import Quiz from "./index";
import userEvent from "@testing-library/user-event";

// Mock QuizContext
const mockDispatch = vi.fn();
const mockQuizContext = {
  state: {
    currentQuestion: 0,
    age: "",
    educationLevel: "",
    weight: "",
    height: "",
    goals: [] as string[],
  },
  dispatch: mockDispatch,
};

vi.mock("../../context/QuizContext", () => ({
  useQuiz: () => mockQuizContext,
}));

// Mock CustomerContext
vi.mock("../../context/CustomerContext", () => ({
  useCustomer: () => ({
    profile: { customerId: "test-customer-id" },
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

// Mock the save quiz mutation
const mockMutate = vi.fn();
vi.mock("../../api/hooks/useCustomerQuiz", () => ({
  useSaveCustomerQuiz: () => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
  }),
}));

describe("Quiz Component", () => {
  let queryClient: QueryClient;
  const mockSetShowQuiz = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    mockQuizContext.state = {
      currentQuestion: 0,
      age: "",
      educationLevel: "",
      weight: "",
      height: "",
      goals: [],
    };
  });

  const renderWithClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it("renders the first question (age)", () => {
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    expect(screen.getByText(/What is your age/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your age/i)).toBeInTheDocument();
  });

  it("displays progress dots", () => {
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    const progressDots = document.querySelectorAll(".progress-dot");
    expect(progressDots.length).toBe(5); // 5 questions total
  });

  it("shows skip button", () => {
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
  });

  it("shows next button on first question", () => {
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
  });

  it("dispatches SET_AGE action when age input changes", async () => {
    const user = userEvent.setup();
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    const ageInput = screen.getByPlaceholderText(/Enter your age/i);
    await user.type(ageInput, "25");

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_AGE",
      payload: expect.any(String),
    });
  });

  it("moves to next question when Next is clicked", async () => {
    const user = userEvent.setup();
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    const nextButton = screen.getByRole("button", { name: /Next/i });
    await user.click(nextButton);

    expect(mockDispatch).toHaveBeenCalledWith({ type: "NEXT_QUESTION" });
  });

  it("renders education level question on second question", () => {
    mockQuizContext.state.currentQuestion = 1;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    expect(
      screen.getByText(/What is your education level/i)
    ).toBeInTheDocument();
  });

  it("renders weight question on third question", () => {
    mockQuizContext.state.currentQuestion = 2;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    expect(screen.getByText(/What is your weight/i)).toBeInTheDocument();
  });

  it("renders height question on fourth question", () => {
    mockQuizContext.state.currentQuestion = 3;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    expect(screen.getByText(/What is your height/i)).toBeInTheDocument();
  });

  it("renders goals question on last question", () => {
    mockQuizContext.state.currentQuestion = 4;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    expect(screen.getByText(/What are your goals/i)).toBeInTheDocument();
  });

  it("shows Finish button on last question", () => {
    mockQuizContext.state.currentQuestion = 4;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    expect(screen.getByRole("button", { name: /Finish/i })).toBeInTheDocument();
  });

  it("renders multiselect options for goals", () => {
    mockQuizContext.state.currentQuestion = 4;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    expect(screen.getByLabelText(/Weight Loss/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Muscle Gain/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Better Sleep/i)).toBeInTheDocument();
  });

  it("allows adding custom goals", async () => {
    const user = userEvent.setup();
    mockQuizContext.state.currentQuestion = 4;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    const customInput = screen.getByPlaceholderText(/Add your own goal/i);
    await user.type(customInput, "Learn a new language");

    const addButton = screen.getByRole("button", { name: /^Add$/i });
    await user.click(addButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_GOALS",
      payload: ["Learn a new language"],
    });
  });

  it("shows Previous button on non-first questions", () => {
    mockQuizContext.state.currentQuestion = 1;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    expect(
      screen.getByRole("button", { name: /Previous/i })
    ).toBeInTheDocument();
  });

  it("moves to previous question when Previous is clicked", async () => {
    const user = userEvent.setup();
    mockQuizContext.state.currentQuestion = 1;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    const prevButton = screen.getByRole("button", { name: /Previous/i });
    await user.click(prevButton);

    expect(mockDispatch).toHaveBeenCalledWith({ type: "PREV_QUESTION" });
  });

  it("saves quiz data and closes quiz when finished", async () => {
    const user = userEvent.setup();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockQuizContext.state.currentQuestion = 4;
    mockQuizContext.state.age = "25";
    mockQuizContext.state.educationLevel = "Bachelor";
    mockQuizContext.state.weight = "70";
    mockQuizContext.state.height = "175";
    mockQuizContext.state.goals = ["Weight Loss"];

    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    const finishButton = screen.getByRole("button", { name: /Finish/i });
    await user.click(finishButton);

    // Wait for the exit animation timeout
    vi.advanceTimersByTime(500);

    // Should call mutate to save quiz data
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it("handles goal checkbox selection", async () => {
    const user = userEvent.setup();
    mockQuizContext.state.currentQuestion = 4;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    const weightLossCheckbox = screen.getByLabelText(/Weight Loss/i);
    await user.click(weightLossCheckbox);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_GOALS",
      payload: expect.arrayContaining(["Weight Loss"]),
    });
  });

  it("allows custom goal input on Enter key press", async () => {
    const user = userEvent.setup();
    mockQuizContext.state.currentQuestion = 4;
    renderWithClient(<Quiz setShowQuiz={mockSetShowQuiz} />);

    const customInput = screen.getByPlaceholderText(/Add your own goal/i);
    await user.type(customInput, "Custom Goal{Enter}");

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_GOALS",
      payload: ["Custom Goal"],
    });
  });
});
