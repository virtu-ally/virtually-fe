import "./index.css";

import { QuizState, useQuiz } from "../../context/QuizContext";

import { useCustomer } from "../../context/CustomerContext";
import { useNavigate } from "react-router-dom";
import { useSaveCustomerQuiz } from "../../api/hooks/useCustomerQuiz";
import { useState } from "react";

const Quiz = ({ setShowQuiz }: { setShowQuiz: (show: boolean) => void }) => {
  const quizContext = useQuiz();
  const { profile } = useCustomer();
  const navigate = useNavigate();
  const [customGoal, setCustomGoal] = useState("");
  const [isExiting, setIsExiting] = useState(false);

  const saveQuizMutation = useSaveCustomerQuiz();

  // Add null checks for quizContext
  if (!quizContext) {
    return <div>Loading quiz...</div>;
  }

  const { state, dispatch } = quizContext;

  const questions = [
    {
      id: "age",
      question: "What is your age?",
      type: "number",
      placeholder: "Enter your age",
    },
    {
      id: "educationLevel",
      question: "What is your education level?",
      type: "select",
      options: ["High School", "Bachelor", "Master", "PhD", "Other"],
    },
    {
      id: "weight",
      question: "What is your weight (kg)?",
      type: "number",
      placeholder: "Enter your weight",
    },
    {
      id: "height",
      question: "What is your height (cm)?",
      type: "number",
      placeholder: "Enter your height",
    },
    {
      id: "goals",
      question: "What are your goals? (Select multiple)",
      type: "multiselect",
      options: [
        "Weight Loss",
        "Muscle Gain",
        "Better Sleep",
        "Stress Reduction",
        "Improved Focus",
      ],
    },
  ];

  const saveQuizData = () => {
    if (profile?.customerId) {
      const quizData = {
        age: state.age,
        educationLevel: state.educationLevel,
        weight: state.weight,
        height: state.height,
        goals: state.goals,
      };

      console.log("Sending quiz data:", quizData);

      saveQuizMutation.mutate({
        customerId: profile.customerId,
        quizData,
      });
    } else {
      console.error("No customer ID available, profile:", profile);
    }
  };

  const handleNext = () => {
    if (state.currentQuestion < questions.length - 1) {
      dispatch({ type: "NEXT_QUESTION" });
    } else {
      setIsExiting(true);
      setTimeout(() => {
        localStorage.setItem("quizResults", JSON.stringify(state));
        saveQuizData();
        setShowQuiz(false);
      }, 700);
    }
  };

  const handleSkip = () => {
    if (state.currentQuestion < questions.length - 1) {
      dispatch({ type: "NEXT_QUESTION" });
    } else {
      setIsExiting(true);
      setTimeout(() => {
        localStorage.setItem("quizResults", JSON.stringify(state));
        saveQuizData();
        navigate("/dashboard", { replace: true });
      }, 500);
    }
  };

  const handlePrev = () => {
    if (state.currentQuestion > 0) {
      dispatch({ type: "PREV_QUESTION" });
    }
  };

  const handleInputChange = (value: string | string[]) => {
    const currentQuestion = questions[state.currentQuestion];

    switch (currentQuestion.id) {
      case "age":
        dispatch({ type: "SET_AGE", payload: value as string });
        break;
      case "educationLevel":
        dispatch({ type: "SET_EDUCATION", payload: value as string });
        break;
      case "weight":
        dispatch({ type: "SET_WEIGHT", payload: value as string });
        break;
      case "height":
        dispatch({ type: "SET_HEIGHT", payload: value as string });
        break;
      case "goals":
        dispatch({ type: "SET_GOALS", payload: value as string[] });
        break;
    }
  };

  const handleAddCustomGoal = () => {
    if (customGoal.trim() && !state.goals.includes(customGoal.trim())) {
      dispatch({
        type: "SET_GOALS",
        payload: [...state.goals, customGoal.trim()],
      });
      setCustomGoal("");
    }
  };

  const renderQuestion = () => {
    const currentQuestion = questions[state.currentQuestion];

    switch (currentQuestion.type) {
      case "number":
        return (
          <input
            type="number"
            value={state[currentQuestion.id as keyof QuizState] as string}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="quiz-input"
          />
        );
      case "select":
        return (
          <div className="select-wrapper">
            <select
              value={state[currentQuestion.id as keyof QuizState] as string}
              onChange={(e) => handleInputChange(e.target.value)}
              className="quiz-select"
            >
              <option value="">Select an option</option>
              {currentQuestion.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      case "multiselect":
        return (
          <div className="quiz-multiselect">
            {currentQuestion.options?.map((option) => (
              <label key={option} className="quiz-checkbox">
                <input
                  type="checkbox"
                  checked={state.goals.includes(option)}
                  onChange={(e) => {
                    const newGoals = e.target.checked
                      ? [...state.goals, option]
                      : state.goals.filter((goal) => goal !== option);
                    dispatch({ type: "SET_GOALS", payload: newGoals });
                  }}
                />
                {option}
              </label>
            ))}
            <div className="custom-goal-container">
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Add your own goal..."
                className="quiz-input custom-goal-input"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddCustomGoal();
                  }
                }}
              />
              <button
                onClick={handleAddCustomGoal}
                className="quiz-button add-goal"
                disabled={!customGoal.trim()}
              >
                Add
              </button>
            </div>
            {state.goals.length > 0 && (
              <div className="selected-goals">
                <h3>Selected Goals:</h3>
                <div className="selected-goals-list">
                  {state.goals.map((goal) => (
                    <div key={goal} className="selected-goal">
                      {goal}
                      <button
                        onClick={() => {
                          dispatch({
                            type: "SET_GOALS",
                            payload: state.goals.filter((g) => g !== goal),
                          });
                        }}
                        className="remove-goal"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`quiz-container ${isExiting ? "slide-out" : ""}`}>
      <div className="quiz-progress">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`progress-dot ${
              index === state.currentQuestion ? "active" : ""
            }`}
          />
        ))}
      </div>

      <div className="quiz-content">
        <div className="quiz-header">
          <button onClick={handleSkip} className="quiz-skip">
            Skip
          </button>
          <h2>{questions[state.currentQuestion].question}</h2>
        </div>
        {renderQuestion()}
      </div>

      <div className="quiz-navigation">
        {state.currentQuestion > 0 && (
          <button onClick={handlePrev} className="quiz-button prev">
            Previous
          </button>
        )}
        <button onClick={handleNext} className="quiz-button next">
          {state.currentQuestion === questions.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
