import "./index.css";

import { useLocation, useNavigate } from "react-router-dom";

import HamburgerMenu from "../HamburgerMenu";
import ThemeSelector from "../themeSelector";
import ThemedLogo from "../ThemedLogo";
import { useAuth } from "../../context/FirebaseAuthContext";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="header-container w-full flex justify-between items-center p-4 bg-[var(--bg-color)] text-[var(--text-color)]">
      <div className="flex ">
        <ThemeSelector />
        {location.pathname !== "/" ? (
          <ThemedLogo size="small" link="/" />
        ) : null}
      </div>

      <div className="flex gap-4 min-w-10">
        {!user ? (
          <button className="login-btn" onClick={() => navigate("/login")}>
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
