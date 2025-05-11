import ThemeSelector from "../themeSelector";
import { useAuth0 } from "@auth0/auth0-react";

const Header = () => {
  const { isAuthenticated, logout, loginWithRedirect } = useAuth0();

  return (
    <header className="w-full flex justify-between items-center p-4 bg-[var(--bg-color)] text-[var(--text-color)]">
      <ThemeSelector />

      <div className="flex gap-4">
        {!isAuthenticated ? (
          <button
            className="cursor-pointer px-6 py-2 text-base font-semibold border-2 border-[var(--btn-color)] hover:bg-[var(--btn-color)] hover:text-[var(--text-color)] transition-all duration-300"
            onClick={() =>
              loginWithRedirect({ appState: { returnTo: "/dashboard" } })
            }
          >
            Login / Sign Up
          </button>
        ) : (
          <button
            className="logout-button cursor-pointer px-6 py-2 text-base font-semibold border-2 border-[var(--btn-color)] hover:bg-[var(--btn-color)] hover:text-[var(--text-color)] transition-all duration-300"
            onClick={() =>
              logout({
                logoutParams: { returnTo: window.location.origin },
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
