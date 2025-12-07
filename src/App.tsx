import "./App.css";

import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AuthProvider } from "./context/FirebaseAuthContext";
import CategoryManagement from "./pages/CategoryManagement";
import { CustomerProvider } from "./context/CustomerContext";
import Goal from "./pages/Goal";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { PrivateRoute } from "./components/PrivateRoute";
import Profile from "./pages/Profile";
import { QuizProvider } from "./context/QuizContext";
import SessionExpiredModal from "./components/SessionExpiredModal";
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
            <SessionExpiredModal />

            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              <Route
                path="/dashboard"
                element={<Navigate to="/goal" replace />}
              />

              {/* Goal routes with specific tabs */}
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
                path="/goal/new"
                element={
                  <PrivateRoute>
                    <QuizProvider>
                      <Goal defaultTab="setup" />
                    </QuizProvider>
                  </PrivateRoute>
                }
              />

              <Route
                path="/goal/goals"
                element={
                  <PrivateRoute>
                    <QuizProvider>
                      <Goal defaultTab="goals" />
                    </QuizProvider>
                  </PrivateRoute>
                }
              />

              <Route
                path="/goal/progress"
                element={
                  <PrivateRoute>
                    <QuizProvider>
                      <Goal defaultTab="progress" />
                    </QuizProvider>
                  </PrivateRoute>
                }
              />

              <Route
                path="/goal/edit"
                element={
                  <PrivateRoute>
                    <QuizProvider>
                      <Goal defaultTab="edit" />
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

              <Route
                path="/categories"
                element={
                  <PrivateRoute>
                    <CategoryManagement />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ThemeProvider>
      </CustomerProvider>
    </AuthProvider>
  );
}

export default App;
