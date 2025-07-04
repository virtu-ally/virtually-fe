import "./index.css";

import { Menu, X } from "lucide-react";

import { useAuth } from "../../context/FirebaseAuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <div className="hamburger-menu">
      <button
        className="hamburger-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="menu-overlay" onClick={() => setIsOpen(false)}>
          <nav className="menu-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => handleNavigation("/dashboard")}>
              Dashboard
            </button>
            <button onClick={() => handleNavigation("/profile")}>
              Profile
            </button>
            <button onClick={handleLogout}>Logout</button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
