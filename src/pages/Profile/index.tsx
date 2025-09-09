import "./index.css";

import { Target, User } from "lucide-react";

import { Link } from "react-router-dom";
import { useAuth } from "../../context/FirebaseAuthContext";

const Profile = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading your profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="error-container">
        <div className="error-text">User not found</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || user.email || "User"}
            className="profile-avatar"
          />
        ) : (
          <div
            className="profile-avatar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--accent-color)",
              color: "var(--inverse-text-color)",
            }}
          >
            <User size={48} />
          </div>
        )}

        <h2 className="profile-name">{user.displayName || user.email}</h2>

        <p className="profile-email">{user.email}</p>

        <div className="profile-actions">
          <Link to="/goal" className="profile-link">
            <Target className="profile-link-icon" />
            View My Goals
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
