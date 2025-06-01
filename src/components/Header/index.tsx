import "./index.css";

import HamburgerMenu from "../HamburgerMenu";
import ThemeSelector from "../themeSelector";
import { useAuth0 } from "@auth0/auth0-react";

const Header = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

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
          <HamburgerMenu />
        )}
      </div>
    </header>
  );
};

export default Header;
