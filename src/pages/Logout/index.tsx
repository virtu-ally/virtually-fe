import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

const Logout = () => {
  const { logout } = useAuth0();

  useEffect(() => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
    // eslint-disable-next-line
  }, [logout]);

  return null;
};

export default Logout;
