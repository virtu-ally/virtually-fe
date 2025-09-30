import "./index.css";

import { ChevronRight, GraduationCap, Heart, LifeBuoy } from "lucide-react";
import { login, signup } from "../../api/customer";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import Quiz from "../Quiz";
import { useAuth } from "../../context/FirebaseAuthContext";
import { useCustomer } from "../../context/CustomerContext";
import { useGetCustomerQuiz } from "../../api/hooks/useCustomerQuiz";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";

const NewDashboard = () => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const quiz = useQuiz();
  const state = quiz?.state;
  const dispatch = quiz?.dispatch;
  const signupMutation = useMutation({ mutationFn: signup });
  const [showQuiz, setShowQuiz] = useState(false);
  const { user } = useAuth();
  const { setProfile, profile } = useCustomer();

  const customerQuery = useQuery({
    queryKey: ["customer", user?.uid],
    queryFn: () => login(),
    enabled: !!user?.uid,
  });

  const quizQuery = useGetCustomerQuiz();

  useEffect(() => {
    if (user && !customerQuery.isLoading) {
      if (customerQuery.data) {
        // Customer exists, update profile
        setProfile({
          firebaseId: user.uid || "",
          name: user.displayName || user.email || "",
          email: user.email || "",
          customerId: customerQuery.data.id,
        });
      } else if (customerQuery.isError) {
        // Customer doesn't exist, create new one
        const form = {
          first_name: user.displayName?.split(" ")[0] || "",
          last_name: user.displayName?.split(" ")[1] || "",
          email: user?.email || "",
        };
        signupMutation.mutate(form, {
          onSuccess: (data) => {
            setProfile({
              firebaseId: user.uid || "",
              name: user.displayName || user.email || "",
              email: user.email || "",
              customerId: data.id,
            });
          },
          onError: () => {
            console.log("error");
          },
        });
      }
    }
  }, [
    user,
    customerQuery.data,
    customerQuery.isLoading,
    customerQuery.isError,
  ]);

  const handleCardClick = (type: string) => {
    setIsExiting(true);

    setTimeout(() => {
      navigate("/goal", { state: { goal: type } });
    }, 800);
  };

  const handleQuizClick = () => {
    // Check if quiz has already been completed
    if (quizQuery.data) {
      // Quiz completed, navigate to goals or show a message
      alert(
        "You've already completed the quiz! Check your progress in the Goals section."
      );
      return;
    }
    setShowQuiz(true);
  };

  // Only show quiz option if quiz hasn't been completed
  const shouldShowQuizOption = !quizQuery.data && !quizQuery.isLoading;

  return (
    <div className="container mx-auto px-4 py-12">
      {!showQuiz && (
        <div className="grid grid-cols-1 gap-6 justify-items-center card-container">
          Select a category
          <div
            onClick={() => handleCardClick("life")}
            className={`card ${isExiting ? "slide-out" : ""}`}
            style={{ animationDelay: "0s" }}
          >
            <LifeBuoy className="w-12 h-12 text-[var(--btn-color)] mb-4" />
            <h2 className="text-xl font-semibold">Life</h2>
          </div>
          <div
            onClick={() => handleCardClick("health")}
            className={`card ${isExiting ? "slide-out" : ""}`}
            style={{ animationDelay: "0.2s" }}
          >
            <Heart className="w-12 h-12 text-[var(--btn-color)] mb-4" />
            <h2 className="text-xl font-semibold">Health</h2>
          </div>
          <div
            onClick={() => handleCardClick("education")}
            className={`card ${isExiting ? "slide-out" : ""}`}
            style={{ animationDelay: "0.4s" }}
          >
            <GraduationCap className="w-12 h-12 text-[var(--btn-color)] mb-4" />
            <h2 className="text-xl font-semibold">Education</h2>
          </div>
          {shouldShowQuizOption && (
            <div
              onClick={handleQuizClick}
              className={`card quiz-card ${isExiting ? "slide-out" : ""}`}
              style={{ animationDelay: "0.6s" }}
            >
              <h2 className="text-sm font-semibold ">
                Take our quiz for personalised recommendations
              </h2>
              <ChevronRight className="w-8 h-8 min-w-6 min-h-6" />
            </div>
          )}
          {quizQuery.data && (
            <div
              className={`card quiz-completed-card ${
                isExiting ? "slide-out" : ""
              }`}
              style={{ animationDelay: "0.6s" }}
            >
              <h2 className="text-sm font-semibold text-green-600 cursor-default">
                ✓ Quiz completed!
              </h2>
            </div>
          )}
        </div>
      )}
      {showQuiz && <Quiz setShowQuiz={setShowQuiz} />}
    </div>
  );
};

export default NewDashboard;
