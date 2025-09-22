import "./index.css";

import Goals from "./Goals";
import Progress from "./Progress";
import Template from "../Template";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getCustomerGoals, type Goal } from "../../api/goals";
import { useCustomer } from "../../context/CustomerContext";

const Goal = ({ defaultTab = "setup" }: { defaultTab?: string }) => {
  const { profile } = useCustomer();
  const customerId = profile?.customerId;
  const [activeTab, setActiveTab] = useState(defaultTab);

  const {
    data: goals = [],
    isLoading,
    isError,
    error,
  } = useQuery<Goal[]>({
    queryKey: ["goals", customerId],
    queryFn: () => getCustomerGoals(customerId as string),
    enabled: !!customerId,
  });

  console.log(isLoading, "isLoading from goal parent");

  useEffect(() => {
    if (goals.length > 0) {
      setActiveTab("goals");
    }
  }, [goals]);

  const tabs = useMemo(
    () => [
      {
        label: "setup",
        component: <Template setActiveTab={setActiveTab} />,
      },
      {
        label: "progress",
        component: (
          <Progress
            goals={goals}
            isLoading={isLoading}
            isError={isError}
            error={error as Error}
            customerId={customerId as string}
          />
        ),
      },
      {
        label: "goals",
        component: (
          <Goals
            goals={goals}
            isLoading={isLoading}
            isError={isError}
            error={error as Error}
            customerId={customerId as string}
          />
        ),
      },
    ],
    []
  );

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
        <button
          className={`tab ${activeTab === "goals" ? "active" : ""}`}
          onClick={() => setActiveTab("goals")}
        >
          Goals
        </button>
      </div>

      <div className="tab-content">
        {tabs.find((tab) => tab.label === activeTab)?.component}
      </div>
    </div>
  );
};

export default Goal;
