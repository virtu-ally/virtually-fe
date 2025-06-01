import "./index.css";

import React, { useState } from "react";

import Progress from "./Progress";
import Template from "../Template";

const Goal = () => {
  const [activeTab, setActiveTab] = useState("setup");

  return (
    <div className="goal-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === "setup" ? "active" : ""}`}
          onClick={() => setActiveTab("setup")}
        >
          Setup
        </button>
        <button
          className={`tab ${activeTab === "progress" ? "active" : ""}`}
          onClick={() => setActiveTab("progress")}
        >
          Progress
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "setup" ? (
          <Template setActiveTab={setActiveTab} />
        ) : (
          <Progress setActiveTab={setActiveTab} />
        )}
      </div>
    </div>
  );
};

export default Goal;
