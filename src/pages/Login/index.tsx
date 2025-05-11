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
      loginMutation.mutate({ id: "b46e48a3-51f5-424a-a332-0bc57abfcdfc" });
    }
  };

  return (
    <div className="login-container bg-[var(--bg-color)] text-[var(--text-color)] mt-8">
      <div className="flex items-center justify-center gap-4 mb-4">
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
        <form
          className={`login-form ${tab !== "signup" ? "login " : "signup"}`}
          onSubmit={handleSubmit}
        >
          <div
            // className={`flex flex-col gap-4 h-full transition-all duration-500 ease-in-out ${
            className={`flex flex-col gap-4 h-full transition-all duration-500 linear delay-75 signup-fields ${
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
          <button
            type="submit"
            className="login-button btn text-[var(--bg-color)]"
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
