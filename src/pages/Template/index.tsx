import "./index.css";

import { Minus, PencilLine, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { createGoal } from "../../api/habits";
import { suggestHabits } from "../../api/habits";
import { useCustomer } from "../../context/CustomerContext";
import { useMutation } from "@tanstack/react-query";

const Template = ({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) => {
  const [chatInput, setChatInput] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [timeDescription, setTimeDescription] = useState("");
  const [isEntering, setIsEntering] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, addGoal } = useCustomer();
  const [tasks, setTasks] = useState(() => {
    const suggestedHabits = location.state?.suggestedHabits || ["", "", ""];
    return suggestedHabits;
  });
  const createGoalMutation = useMutation({ mutationFn: createGoal });

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const handleRemoveTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
  };

  const handleAddTask = () => {
    setTasks([...tasks, ""]);
  };

  const handleGoalSaveClick = () => {
    if (!profile?.customerId) return;

    createGoalMutation.mutate(
      {
        customerId: profile.customerId,
        description: goalDescription,
        habits: tasks,
      },
      {
        onSuccess: (data) => {
          addGoal({
            id: data.id,
            description: goalDescription,
            timeframe: timeDescription,
            habits: tasks,
          });
          setActiveTab("progress");
        },
        onError: (error) => {
          console.error("Error creating goal:", error);
        },
      }
    );
  };

  const handleSave = () => {
    createGoalMutation.mutate(
      {
        customerId: location.state?.customerId,
        description: chatInput,
        habits: tasks,
      },
      {
        onSuccess: (data) => {
          console.log(data, "response goal");
        },
        onError: (error) => {
          console.error("Error creating goal:", error);
        },
      }
    );
  };

  return (
    <div
      className={`min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] fade-in flex flex-col items-center `}
    >
      <h1 className="title text-3xl mb-6 pt-8 px-4 w-full text-center capitalize ">
        {location.state?.goal}
      </h1>
      <div className="flex flex-wrap md:gap-16 gap-4 w-full md:p-16 p-4">
        <div className="bg-white rounded-lg p-6 text-[var(--secondary-text-color)] mb-6 flex-auto w-[500px]">
          <h2 className="text-lg mb-4 w-auto">Describe your overall goal</h2>
          <input
            className="w-full border-b border-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] pb-2 bg-transparent"
            placeholder="I want to..."
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
          />

          <h2 className="text-lg mt-4 mb-4 w-auto">
            What is the time frame for this goal?
          </h2>
          <input
            className="w-full border-b border-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] pb-2 bg-transparent"
            placeholder="12 months..."
            value={timeDescription}
            onChange={(e) => setTimeDescription(e.target.value)}
          />
          <button
            onClick={handleGoalSaveClick}
            className="goal-save-button text-[var(--btn-color)] border-2 border-[var(--btn-color)] mt-4 p-2 rounded-md text-lg font-bold cursor-pointer bg-color-[var(--btn-color)]"
          >
            Save
          </button>
        </div>
        <div className="bg-white rounded-lg p-6 text-[var(--secondary-text-color)] mb-6 flex-auto w-[500px]">
          <h2 className="text-lg mb-4 w-auto">Your habits to track</h2>
          {tasks.map((task, index) => (
            <div key={index} className="mb-4 task-container">
              <input
                type="text"
                className="w-full border-b border-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] pb-2 bg-transparent"
                placeholder="Enter your habit"
                value={task}
                onChange={(e) => handleTaskChange(index, e.target.value)}
              />
              <Minus
                className="minus cursor-pointer"
                onClick={() => handleRemoveTask(index)}
              />
            </div>
          ))}
          <button
            onClick={handleAddTask}
            className="text-[var(--btn-color)] text-2xl font-bold cursor-pointer"
          >
            <Plus className="hover:stroke-[var(--accent-color)] plus" />
          </button>
        </div>

        <div className="mb-6 flex-auto w-[400px]">
          <h2 className="text-lg mb-2 text-center">
            Tell us more about your goal and desired outcome{" "}
            <PencilLine className="inline-block" />
          </h2>
          <textarea
            className="w-full h-48 rounded-lg p-3 text-[var(--secondary-text-color)] focus:outline-2 focus:outline-offset-1 focus:outline-[var(--accent-color)] bg-white"
            placeholder="Type your message here..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />

          <button onClick={handleSave} className="save-button mt-4">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Template;
