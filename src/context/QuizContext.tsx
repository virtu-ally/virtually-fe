import { ReactNode, createContext, useContext, useReducer } from "react";

export interface QuizState {
  age: string;
  educationLevel: string;
  weight: string;
  height: string;
  goals: string[];
  currentQuestion: number;
}

type QuizAction =
  | { type: "SET_AGE"; payload: string }
  | { type: "SET_EDUCATION"; payload: string }
  | { type: "SET_WEIGHT"; payload: string }
  | { type: "SET_HEIGHT"; payload: string }
  | { type: "SET_GOALS"; payload: string[] }
  | { type: "NEXT_QUESTION" }
  | { type: "PREV_QUESTION" }
  | { type: "RESET_QUIZ" };

const initialState: QuizState = {
  age: "",
  educationLevel: "",
  weight: "",
  height: "",
  goals: [],
  currentQuestion: 0,
};

const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (action.type) {
    case "SET_AGE":
      return { ...state, age: action.payload };
    case "SET_EDUCATION":
      return { ...state, educationLevel: action.payload };
    case "SET_WEIGHT":
      return { ...state, weight: action.payload };
    case "SET_HEIGHT":
      return { ...state, height: action.payload };
    case "SET_GOALS":
      return { ...state, goals: action.payload };
    case "NEXT_QUESTION":
      return { ...state, currentQuestion: state.currentQuestion + 1 };
    case "PREV_QUESTION":
      return { ...state, currentQuestion: state.currentQuestion - 1 };
    case "RESET_QUIZ":
      return initialState;
    default:
      return state;
  }
};

interface QuizContextType {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    console.error("useQuiz must be used within a QuizProvider");
  }
  return context;
};
