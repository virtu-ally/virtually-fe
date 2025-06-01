import "./App.css";

import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { CustomerProvider } from "./context/CustomerContext";
import Goal from "./pages/Goal";
import Header from "./components/Header";
import Home from "./pages/Home";
import Logout from "./pages/Logout";
import NewDashboard from "./pages/Dashboard";
import { PrivateRoute } from "./components/PrivateRoute";
import Profile from "./pages/Profile";
import { QuizProvider } from "./context/QuizContext";
import Template from "./pages/Template";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/virtually-fe/`,
        audience: `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/`,
        scope: "openid profile email",
      }}
      onRedirectCallback={(appState) => {
        navigate(appState?.returnTo || "/", { replace: true });
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }}
    >
      <CustomerProvider>
        <ThemeProvider>
          <div
            className={`bg-[var(--bg-color)] text-[var(--text-color)] relative app-container`}
          >
            <Header />

            <Routes location={location}>
              <Route path="/logout" element={<Logout />} />
              <Route path="/" element={<Home />} />

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
    </Auth0Provider>
  );
}

export default App;
