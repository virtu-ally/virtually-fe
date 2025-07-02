import "./index.css";

import { login, signup } from "../../api/customer";
import { useRef, useState } from "react";

import { useAuth } from "../../context/FirebaseAuthContext";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

// Function to convert Firebase error codes to user-friendly messages
const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/email-already-in-use":
    case "EMAIL_EXISTS":
      return "An account with this email already exists. Please try logging in instead.";
    case "auth/user-not-found":
      return "No account found with this email. Please check your email or sign up.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled. Please try again.";
    case "auth/popup-blocked":
      return "Google sign-in popup was blocked. Please allow popups and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    default:
      return "An error occurred. Please try again.";
  }
};

const Toast = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <div className="login-toast">
    <span>{message}</span>
    <button className="toast-close" onClick={onClose} aria-label="Close">
      &times;
    </button>
  </div>
);

const Login = () => {
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();

  //   const signupMutation = useMutation({ mutationFn: signup });
  //   const loginMutation = useMutation({ mutationFn: login });
  const { login, signup, loginWithGoogle, loading } = useAuth();

  const showToast = (msg: string) => {
    setError(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setError(""), 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (tab === "signup") {
      // Validation for signup
      if (form.password !== form.confirmPassword) {
        showToast("Passwords do not match.");
        return;
      }

      if (form.password.length < 6) {
        showToast("Password must be at least 6 characters long.");
        return;
      }

      try {
        await signup(form.email, form.password);
        setForm({
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        navigate("/dashboard");
      } catch (err: any) {
        const code = err.code || err.message;
        const errorMessage = getFirebaseErrorMessage(code);
        showToast(errorMessage);
      }
    } else {
      // Login
      try {
        await login(form.email, form.password);
        setForm({
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        navigate("/dashboard");
      } catch (err: any) {
        const code = err.code || err.message;
        const errorMessage = getFirebaseErrorMessage(code);
        showToast(errorMessage);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err: any) {
      const code = err.code || err.message;
      const errorMessage = getFirebaseErrorMessage(code);
      showToast(errorMessage);
    }
  };

  const handleTabChange = (newTab: "signup" | "login") => {
    setTab(newTab);
    setError("");
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="login-container bg-[var(--bg-color)] text-[var(--text-color)] mt-8">
      {error && <Toast message={error} onClose={() => setError("")} />}
      <div className="flex items-center justify-center gap-4">
        <button
          className={`login-title tab-btn ${tab === "signup" ? "active" : ""}`}
          onClick={() => handleTabChange("signup")}
        >
          Sign Up
        </button>
        <span className="login-title"> / </span>
        <button
          className={`login-title tab-btn ${tab === "login" ? "active" : ""}`}
          onClick={() => handleTabChange("login")}
        >
          Login
        </button>
      </div>
      <div className="login-form-container">
        <form
          className={`login-form ${tab !== "signup" ? "login " : "signup"}`}
          onSubmit={handleSubmit}
        >
          <div
            className={`flex flex-col gap-4 h-full transition-all duration-500 ease-in-out delay-75 signup-fields ${
              tab !== "signup" ? "hide" : ""
            }`}
          >
            <label className="text-lg">
              First Name
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                className="login-input"
                placeholder="Enter your first name"
              />
            </label>
            <label className="text-lg">
              Last Name
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                className="login-input"
                placeholder="Enter your last name"
              />
            </label>
          </div>
          <label className="text-lg">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="login-input z-[1]"
              placeholder="Enter your email"
            />
          </label>
          <label className="text-lg">
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="login-input"
              placeholder="Enter your password"
            />
          </label>
          {tab === "signup" && (
            <label className="text-lg">
              Confirm Password
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="login-input"
                placeholder="Confirm your password"
              />
            </label>
          )}
          <button
            type="submit"
            className="login-button btn text-[var(--bg-color)]"
            disabled={loading}
          >
            {tab === "signup"
              ? loading
                ? "Signing up..."
                : "Sign Up"
              : loading
              ? "Logging in..."
              : "Login"}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="login-button btn text-[var(--bg-color)] bg-red-500 hover:bg-red-600"
          >
            {loading ? "Please wait..." : "Sign in with Google"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
