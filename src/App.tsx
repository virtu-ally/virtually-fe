import "./App.css";

import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Template from "./pages/Template";
import { useState } from "react";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);

  const handleTransition = (newLocation, state) => {
    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
      navigate(newLocation, state);
    }, 1500);
  };

  console.log(location.pathname, "location.pathname");
  return (
    <div
      className={`${location.pathname === "/" ? "background" : ""} 
      ${location.pathname === "/template" ? "bg-white" : ""}
      `}
    >
      <Routes location={location}>
        <Route path="/" element={<Dashboard onNavigate={handleTransition} />} />
        <Route path="/template" element={<Template />} />
      </Routes>
    </div>
  );
}

export default App;
