import "./index.css";

import ThemedLogo from "../../components/ThemedLogo";
import { useAuth } from "../../context/FirebaseAuthContext";
import { useNavigate } from "react-router-dom";

const features = [
  {
    title: "Set Personal Goals",
    desc: "Define your own goals and habits to focus on what matters most to you.",
    number: "01",
  },
  {
    title: "Track Your Progress",
    desc: "Monitor your daily, weekly, or monthly progress with beautiful charts.",
    number: "02",
  },
  {
    title: "Visualize Achievements",
    desc: "See your accomplishments and stay motivated as you reach new milestones.",
    number: "03",
  },
  {
    title: "Stay Accountable",
    desc: "Get reminders and encouragement to help you build lasting habits.",
    number: "04",
  },
];

const Home = () => {
  const { user } = useAuth();
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
          <h2 className="text-3xl ">A Shared Journey to Your Goals.</h2>

          {user ? (
            <button className="start-button" onClick={() => navigate("/goal")}>
              Set up your Goals
            </button>
          ) : (
            <button className="start-button" onClick={() => navigate("/login")}>
              Get Started
            </button>
          )}
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

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-4">
        {features.map((feature, index) => (
          <div key={feature.title} className="modern-feature-card">
            {/* <div className="feature-number">{feature.number}</div> */}
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
