import "./index.css";

import {
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Heart,
  LifeBuoy,
} from "lucide-react";
import { useEffect, useState } from "react";

import Quiz from "../Quiz";
import { signup } from "../../api/customer";
import { suggestHabits } from "../../api/habits";
import { useAuth0 } from "@auth0/auth0-react";
import { useCustomer } from "../../context/CustomerContext";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";

const NewDashboard = () => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const signupMutation = useMutation({ mutationFn: signup });
  const { state, dispatch } = useQuiz();
  const [showQuiz, setShowQuiz] = useState(false);
  const { user } = useAuth0();
  const { setProfile, profile } = useCustomer();

  useEffect(() => {
    if (user) {
      const form = {
        first_name: user?.given_name || "",
        last_name: user?.family_name || "",
        email: user?.email || "",
      };
      signupMutation.mutate(form, {
        onSuccess: (data) => {
          setProfile({
            auth0Id: user.sub || "",
            name: user.name || "",
            email: user.email || "",
            customerId: data.id,
          });
        },
        onError: () => {
          console.log("error");
        },
      });
    }
  }, [user]);

  const handleCardClick = (type: string) => {
    setIsExiting(true);

    setTimeout(() => {
      navigate("/goal", { state: { goal: type } });
    }, 800);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {!showQuiz && (
        <div className="grid grid-cols-1 gap-6 justify-items-center card-container">
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
          <div
            onClick={() => setShowQuiz(true)}
            className={`card quiz-card ${isExiting ? "slide-out" : ""}`}
            style={{ animationDelay: "0.4s" }}
          >
            <h2 className="text-sm font-semibold ">
              Take our quiz for personalised recommendations
            </h2>
            <ChevronRight className="w-8 h-8 min-w-6 min-h-6" />
          </div>
        </div>
      )}
      {showQuiz && <Quiz setShowQuiz={setShowQuiz} />}
    </div>
  );
};

export default NewDashboard;
