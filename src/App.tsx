import "./App.css";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Template from "./pages/Template";
import { useState } from "react";

function App() {
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(true);

  console.log(location.pathname, "location.pathname");
  return (
    <div
      className={`${location.pathname === "/" ? "background" : ""} 
      ${location.pathname === "/template" ? "bg-white" : ""}
      `}
    >
      <Routes location={location}>
        <Route
          path="/"
          element={loggedIn ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/template" element={<Template />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
