import "./index.css";

import HamburgerMenu from "../HamburgerMenu";
import ThemeSelector from "../themeSelector";
import { useAuth } from "../../context/FirebaseAuthContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header-container w-full flex justify-between items-center p-4 bg-[var(--bg-color)] text-[var(--text-color)]">
      <ThemeSelector />

      <div className="flex gap-4">
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
