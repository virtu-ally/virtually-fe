import { useAuth } from "../../context/FirebaseAuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout().then(() => {
      navigate("/");
    });
    // eslint-disable-next-line
  }, [logout, navigate]);

  return null;
};

export default Logout;
