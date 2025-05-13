import "./index.css";

import { CheckCircle2, LineChart, Smile, Target } from "lucide-react";

import ThemedLogo from "../../components/ThemedLogo";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: <Target className="feature-icon " />,
    title: "Set Personal Goals",
    desc: "Define your own goals and habits to focus on what matters most to you.",
    bg: "bg-white",
  },
  {
    icon: <LineChart className="feature-icon " />,
    title: "Track Your Progress",
    desc: "Monitor your daily, weekly, or monthly progress with beautiful charts.",
    bg: "bg-white",
  },
  {
    icon: <CheckCircle2 className="feature-icon" />,
    title: "Visualize Achievements",
    desc: "See your accomplishments and stay motivated as you reach new milestones.",
    bg: "bg-white",
  },
  {
    icon: <Smile className="feature-icon " />,
    title: "Stay Accountable",
    desc: "Get reminders and encouragement to help you build lasting habits.",
    bg: "bg-white",
  },
];

const Home = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  return (
    <div
      className={`home-container bg-[var(--bg-color)] text-[var(--text-color)] min-h-screen flex flex-col items-center justify-center px-4`}
    >
      <div className="flex flex-row items-baseline justify-center flex-wrap">
        <ThemedLogo />
        <div className="flex flex-col text-center sm:text-left justify-center flex-wrap mb-10">
          <h1 className="home-title text-6xl md:text-9xl font-extrabold mb-4 text-center tracking-tight">
            Virtually
            <span className="home-title-underline" />
          </h1>
          <h2 className="text-3xl ">Your Goals, A Shared Journey.</h2>

          <button
            className="start-button"
            onClick={() => {
              if (isAuthenticated) {
                navigate("/dashboard");
              } else {
                loginWithRedirect({
                  appState: { returnTo: "/dashboard" },
                });
              }
            }}
          >
            Get Started
          </button>
        </div>
      </div>
      <div className="m-4 sm:m-10 self-start text-center sm:text-left">
        <p className="text-lg md:text-xl p-4">
          Virtually helps you set, track, and achieve your personal goals.
          Whether you want to build better habits, improve yourself, or simply
          keep track of your progress, Virtually provides the tools and
          motivation you need to succeed.
        </p>
      </div>

      <div className="w-full text-[var(--secondary-text-color)] max-w-5xl flex flex-row flex-wrap justify-center gap-6 mb-8">
        {features.map((f) => (
          <div
            key={f.title}
            className={`feature-card ${f.bg} rounded-xl shadow-md flex flex-col items-center text-center gap-3 p-4 md:p-6 transition-transform hover:scale-[1.025] min-w-[220px] max-w-xs flex-1`}
          >
            <div className="mb-2">{f.icon}</div>
            <h2 className="font-semibold text-lg md:text-xl mb-1">{f.title}</h2>
            <p className="text-sm md:text-base">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
