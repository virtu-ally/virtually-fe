import "./index.css";

import ThemeSelector from "../themeSelector";
import { useAuth0 } from "@auth0/auth0-react";

const Header = () => {
  const { isAuthenticated, logout, loginWithRedirect } = useAuth0();
  console.log(import.meta.env.MODE);
  const isProd = import.meta.env.MODE === "production";
  const logoutReturnTo = isProd
    ? import.meta.env.VITE_AUTH0_PROD_REDIRECT_URI
    : `${window.location.origin}/virtually-fe`;

  return (
    <header className="header-container w-full flex justify-between items-center p-4 bg-[var(--bg-color)] text-[var(--text-color)]">
      <ThemeSelector />

      <div className="flex gap-4">
        {!isAuthenticated ? (
          <button
            className="login-btn"
            onClick={() =>
              loginWithRedirect({
                appState: { returnTo: "/dashboard" },
              })
            }
          >
            Login / Sign Up
          </button>
        ) : (
          <button
            className="logout-btn"
            onClick={() =>
              logout({
                logoutParams: {
                  returnTo: logoutReturnTo,
                },
              })
            }
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
