import "./index.css";

import Goals from "./Goals";
import Progress from "../Progress/Progress";
import Template from "../Template";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

import { getCustomerGoals, type Goal } from "../../api/goals";
import { useCustomer } from "../../context/CustomerContext";
import EditGoals from "../EditGoals";

const Goal = ({ defaultTab = "setup" }: { defaultTab?: string }) => {
  const { profile } = useCustomer();
  const customerId = profile?.customerId;
  const location = useLocation();
  const navigate = useNavigate();
  const initialCategoryId = location.state?.categoryId || null;

  // Determine tab from URL path
  const getTabFromPath = (pathname: string) => {
    if (pathname.includes("/goal/new")) return "setup";
    if (pathname.includes("/goal/goals")) return "goals";
    if (pathname.includes("/goal/progress")) return "progress";
    if (pathname.includes("/goal/edit")) return "edit";
    return defaultTab;
  };

  const [activeTab, setActiveTab] = useState(() =>
    getTabFromPath(location.pathname)
  );

  const {
    data: goals = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Goal[]>({
    queryKey: ["goals", customerId],
    queryFn: () => getCustomerGoals(),
    enabled: !!customerId,
  });

  useEffect(() => {
    const tabFromPath = getTabFromPath(location.pathname);
    setActiveTab(tabFromPath);
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoading && customerId && location.pathname === "/goal") {
      if (goals.length > 0) {
        navigate("/goal/goals", { replace: true });
      } else {
        navigate("/goal/new", { replace: true });
      }
    }
  }, [goals, isLoading, customerId, location.pathname, navigate]);

  useEffect(() => {
    refetch();
  }, [activeTab, refetch]);

  // Handle tab changes with navigation
  const handleTabChange = (tab: string) => {
    const routes = {
      setup: "/goal/new",
      goals: "/goal/goals",
      progress: "/goal/progress",
      edit: "/goal/edit",
    };
    navigate(routes[tab as keyof typeof routes]);
  };

  const tabs = useMemo(
    () => [
      {
        label: "setup",
        component: <Template setActiveTab={handleTabChange} />,
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
            initialCategoryId={initialCategoryId}
          />
        ),
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
        label: "edit",
        component: (
          <EditGoals
            goals={goals}
            isLoading={isLoading}
            isError={isError}
            error={error as Error}
            customerId={customerId as string}
          />
        ),
      },
    ],
    [goals, isLoading, isError, error, customerId, initialCategoryId]
  );

  return (
    <div className="goal-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === "setup" ? "active" : ""}`}
          onClick={() => handleTabChange("setup")}
        >
          New Goal
        </button>
        <button
          className={`tab ${activeTab === "goals" ? "active" : ""}`}
          onClick={() => handleTabChange("goals")}
        >
          Goals
        </button>
        <button
          className={`tab ${activeTab === "progress" ? "active" : ""}`}
          onClick={() => handleTabChange("progress")}
        >
          Progress
        </button>
        <button
          className={`tab ${activeTab === "edit" ? "active" : ""}`}
          onClick={() => handleTabChange("edit")}
        >
          Edit Goals
        </button>
      </div>

      <div className="tab-content">
        {tabs.find((tab) => tab.label === activeTab)?.component}
      </div>
    </div>
  );
};

export default Goal;
