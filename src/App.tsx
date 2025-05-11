import "./App.css";

import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import { PrivateRoute } from "./components/PrivateRoute";
import Profile from "./pages/Profile";
import Template from "./pages/Template";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const location = useLocation();
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  console.log("isAuthenticated", isAuthenticated);
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/virtually-fe`,
        audience: `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/`,
        scope: "openid profile email",
      }}
      onRedirectCallback={(appState) => {
        navigate(appState?.returnTo || "/virtually-fe", { replace: true });
      }}
    >
      <ThemeProvider>
        <div
          className={`bg-[var(--bg-color)] text-[var(--text-color)] relative`}
        >
          <Header />

          <Routes location={location}>
            <Route path="/logout" element={<Logout />} />
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/template"
              element={
                <PrivateRoute>
                  <Template />
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
    </Auth0Provider>
  );
}

export default App;
