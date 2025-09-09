import { Loader } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/FirebaseAuthContext";
import { useEffect } from "react";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, sessionExpired, logout } = useAuth();

  // Handle session expiration - force logout if session has expired
  useEffect(() => {
    const handleUnauthenticatedUser = async () => {
      // If session expired or user is not authenticated, ensure clean logout
      if (sessionExpired || (!loading && !user)) {
        try {
          await logout();
        } catch (error) {
          console.error("Error during forced logout:", error);
        }
      }
    };

    handleUnauthenticatedUser();
  }, [user, loading, sessionExpired, logout]);

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin" size={32} />
        <span className="ml-2 text-[var(--text-color)] opacity-70">
          Verifying authentication...
        </span>
      </div>
    );
  }

  // If session expired, redirect to login immediately
  if (sessionExpired) {
    return <Navigate to="/login" replace />;
  }

  // If no user is authenticated, redirect to home/login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and session is valid - render protected content
  return <>{children}</>;
};
