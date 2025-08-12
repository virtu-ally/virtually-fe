import "./App.css";

import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { AuthProvider } from "./context/FirebaseAuthContext";
import { CustomerProvider } from "./context/CustomerContext";
import Goal from "./pages/Goal";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NewDashboard from "./pages/Dashboard";
import { PrivateRoute } from "./components/PrivateRoute";
import Profile from "./pages/Profile";
import { QuizProvider } from "./context/QuizContext";
import { ThemeProvider } from "./context/ThemeContext";
import VerifyEmailModal from "./components/VerifyEmailModal";

function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <CustomerProvider>
        <ThemeProvider>
          <div
            className={`bg-[var(--bg-color)] text-[var(--text-color)] relative app-container`}
          >
            <Header />
            <VerifyEmailModal />

            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <QuizProvider>
                      <NewDashboard />
                    </QuizProvider>
                  </PrivateRoute>
                }
              />

              <Route
                path="/goal"
                element={
                  <PrivateRoute>
                    <QuizProvider>
                      <Goal />
                    </QuizProvider>
                  </PrivateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </ThemeProvider>
      </CustomerProvider>
    </AuthProvider>
  );
}

export default App;
