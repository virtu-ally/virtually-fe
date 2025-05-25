import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

const Logout = () => {
  const { logout } = useAuth0();

  const isProd = import.meta.env.VITE_ENV === "production";
  const logoutReturnTo = isProd
    ? import.meta.env.VITE_AUTH0_PROD_REDIRECT_URI
    : window.location.origin;

  useEffect(() => {
    logout({
      logoutParams: {
        returnTo: logoutReturnTo,
      },
    });
    // eslint-disable-next-line
  }, [logout]);

  return null;
};

export default Logout;
