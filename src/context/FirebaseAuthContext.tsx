import {
  GoogleAuthProvider,
  IdTokenResult,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  SESSION_CONFIG,
  SessionExpirationReason,
  SessionUtils,
} from "../config/session";

import { auth } from "../firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  sessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({} as User),
  signup: async () => ({} as User),
  loginWithGoogle: async () => ({} as User),
  logout: async () => {},
  sessionExpired: false,
});

// Use centralized session configuration

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Refs for timers to avoid stale closures
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tokenCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Function to handle automatic logout due to session expiration
  const handleSessionExpiration = useCallback(async (reason: string) => {
    console.log(`Session expired: ${reason}`);
    setSessionExpired(true);

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during automatic logout:", error);
    }

    // Reset session expired state after a short delay to allow for navigation
    setTimeout(
      () => setSessionExpired(false),
      SESSION_CONFIG.AUTO_REDIRECT_DELAY + 500
    );
  }, []);

  // Function to check token validity (remove session duration check)
  const checkTokenValidity = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      // Just check if the token is valid, don't check auth_time for max duration
      await auth.currentUser.getIdTokenResult();

      // Only check for inactivity timeout
      if (SessionUtils.isInactivityTimeout(lastActivityRef.current)) {
        await handleSessionExpiration(SessionExpirationReason.INACTIVITY);
        return;
      }
    } catch (error) {
      console.error("Error checking token validity:", error);
      // If token is invalid or expired, log out the user
      await handleSessionExpiration(SessionExpirationReason.INVALID_TOKEN);
    }
  }, [handleSessionExpiration]);

  // Function to reset activity timer
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timer
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }

    // Set new timer
    activityTimerRef.current = setTimeout(() => {
      handleSessionExpiration(SessionExpirationReason.ACTIVITY_TIMEOUT);
    }, SESSION_CONFIG.ACTIVITY_TIMEOUT);
  }, [handleSessionExpiration]);

  // Set up activity listeners and token monitoring
  useEffect(() => {
    if (!user) {
      // Clear timers if user is not authenticated
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
        activityTimerRef.current = null;
      }
      if (tokenCheckTimerRef.current) {
        clearInterval(tokenCheckTimerRef.current);
        tokenCheckTimerRef.current = null;
      }
      return;
    }

    // Set up activity monitoring
    const activityEvents = SESSION_CONFIG.ACTIVITY_EVENTS;

    activityEvents.forEach((event) => {
      document.addEventListener(event, resetActivityTimer, true);
    });

    // Initialize activity timer
    resetActivityTimer();

    // Set up periodic token validity checks
    tokenCheckTimerRef.current = setInterval(
      checkTokenValidity,
      SESSION_CONFIG.TOKEN_CHECK_INTERVAL
    );

    // Initial token check
    checkTokenValidity();

    // Cleanup function
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetActivityTimer, true);
      });

      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }

      if (tokenCheckTimerRef.current) {
        clearInterval(tokenCheckTimerRef.current);
      }
    };
  }, [user, resetActivityTimer, checkTokenValidity]);

  // Main auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Reset session expired state when user changes
      if (firebaseUser) {
        setSessionExpired(false);
        lastActivityRef.current = Date.now();
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return result.user;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        sessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
