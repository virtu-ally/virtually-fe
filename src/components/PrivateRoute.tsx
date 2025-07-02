import { Loader } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/FirebaseAuthContext";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/" />;
};
