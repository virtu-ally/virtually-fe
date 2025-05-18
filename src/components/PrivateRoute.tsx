import { Loader } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" />;
};
