import "./index.css";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { SESSION_CONFIG } from "../../config/session";
import { useAuth } from "../../context/FirebaseAuthContext";
import { useNavigate } from "react-router-dom";

const SessionExpiredModal = () => {
  const { sessionExpired } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionExpired) {
      setIsVisible(true);
      // Auto-redirect to login after a short delay
      const timer = setTimeout(() => {
        navigate("/login");
        setIsVisible(false);
      }, SESSION_CONFIG.AUTO_REDIRECT_DELAY);

      return () => clearTimeout(timer);
    }
  }, [sessionExpired, navigate]);

  const handleLoginRedirect = () => {
    setIsVisible(false);
    navigate("/login");
  };

  if (!isVisible) return null;

  return (
    <div className="session-expired-overlay">
      <div className="session-expired-modal">
        <div className="session-expired-icon">
          <AlertTriangle size={48} />
        </div>

        <h2 className="session-expired-title">Session Expired</h2>

        <p className="session-expired-message">
          Your session has expired for security reasons. Please log in again to
          continue.
        </p>

        <div className="session-expired-actions">
          <button
            onClick={handleLoginRedirect}
            className="session-expired-button"
          >
            <RefreshCw size={16} />
            Log In Again
          </button>
        </div>

        <div className="session-expired-auto-redirect">
          Redirecting automatically in a few seconds...
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
