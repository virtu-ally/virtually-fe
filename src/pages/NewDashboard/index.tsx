import "./index.css";

import { GraduationCap, Heart, LifeBuoy } from "lucide-react";
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

const NewDashboard = () => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  const handleCardClick = (type: string) => {
    setIsExiting(true);

    setTimeout(() => {
      navigate("/template", { state: { goal: type } });
    }, 800);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
        <div
          onClick={() => handleCardClick("life")}
          className={`card ${isExiting ? "slide-out" : ""}`}
          style={{ animationDelay: "0s" }}
        >
          <LifeBuoy className="w-12 h-12 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold">Life</h2>
        </div>

        <div
          onClick={() => handleCardClick("health")}
          className={`card ${isExiting ? "slide-out" : ""}`}
          style={{ animationDelay: "0.2s" }}
        >
          <Heart className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold">Health</h2>
        </div>

        <div
          onClick={() => handleCardClick("education")}
          className={`card ${isExiting ? "slide-out" : ""}`}
          style={{ animationDelay: "0.4s" }}
        >
          <GraduationCap className="w-12 h-12 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold">Education</h2>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;
