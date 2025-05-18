import "./index.css";

import ThemeSelector from "../themeSelector";
import { useAuth0 } from "@auth0/auth0-react";

const Header = () => {
  const { isAuthenticated, logout, loginWithRedirect } = useAuth0();

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
                  returnTo: `${window.location.origin}/virtually-fe`,
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
