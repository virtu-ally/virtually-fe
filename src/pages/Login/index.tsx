import "./index.css";

import { login, signup } from "../../api/customer";

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Login = () => {
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const navigate = useNavigate();

  const signupMutation = useMutation({ mutationFn: signup });
  const loginMutation = useMutation({ mutationFn: login });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "signup") {
      signupMutation.mutate(form, {
        onSuccess: () => {
          setForm({ first_name: "", last_name: "", email: "" });
          navigate("/dashboard");
        },
        onError: () => {
          console.log("error");
        },
      });
    } else {
      loginMutation.mutate({ id: 1 });
    }
  };

  return (
    <div className="login-container">
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          className={`login-title tab-btn ${tab === "signup" ? "active" : ""}`}
          onClick={() => setTab("signup")}
        >
          Sign Up
        </button>
        <span className="login-title"> / </span>
        <button
          className={`login-title tab-btn ${tab === "login" ? "active" : ""}`}
          onClick={() => setTab("login")}
        >
          Login
        </button>
      </div>
      <div className="login-form-container">
        <form className="login-form" onSubmit={handleSubmit}>
          {tab === "signup" && (
            <>
              <label>
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
              <label>
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
            </>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="login-input"
              placeholder="Enter your email"
            />
          </label>
          <button
            type="submit"
            className="login-button"
            disabled={signupMutation.isPending || loginMutation.isPending}
          >
            {tab === "signup"
              ? signupMutation.isPending
                ? "Signing up..."
                : "Sign Up"
              : loginMutation.isPending
              ? "Logging in..."
              : "Login"}
          </button>
          {tab === "signup" && signupMutation.isSuccess && (
            <div className="login-success">Signup successful!</div>
          )}
          {tab === "signup" && signupMutation.isError && (
            <div className="login-error">Signup failed. Please try again.</div>
          )}
          {tab === "login" && loginMutation.isSuccess && (
            <div className="login-success">Login successful!</div>
          )}
          {tab === "login" && loginMutation.isError && (
            <div className="login-error">Login failed. Please try again.</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
