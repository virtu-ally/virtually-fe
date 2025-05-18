import "./index.css";

import { GraduationCap, Heart, LifeBuoy } from "lucide-react";
import { useEffect, useState } from "react";

import { signup } from "../../api/customer";
import { suggestHabits } from "../../api/habits";
import { useAuth0 } from "@auth0/auth0-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const NewDashboard = () => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const signupMutation = useMutation({ mutationFn: signup });
  const suggestHabitsMutation = useMutation({ mutationFn: suggestHabits });
  const { user } = useAuth0();

  console.log(user);

  useEffect(() => {
    if (user) {
      const form = {
        first_name: user?.given_name || "",
        last_name: user?.family_name || "",
        email: user?.email || "",
      };
      signupMutation.mutate(form, {
        onSuccess: (data) => {
          setCustomerId(data.id);
        },
        onError: () => {
          console.log("error");
        },
      });
    }
  }, [user]);

  const handleCardClick = (type: string) => {
    setIsExiting(true);

    if (customerId) {
      suggestHabitsMutation.mutate(
        {
          customerId,
          goal: type,
        },
        {
          onSuccess: (data) => {
            navigate("/template", {
              state: {
                goal: type,
                suggestedHabits: data,
                customerId,
              },
            });
          },
          onError: (error) => {
            console.error("Error suggesting habits:", error);
            navigate("/template", { state: { goal: type } });
          },
        }
      );
    } else {
      setTimeout(() => {
        navigate("/template", { state: { goal: type } });
      }, 800);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1  gap-6 justify-items-center">
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
      </div>
    </div>
  );
};

export default NewDashboard;
