import "./index.css";

import { Loader, Minus, PencilLine, Plus } from "lucide-react";
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
  const location = useLocation();
  const { profile, addGoal } = useCustomer();
  const [tasks, setTasks] = useState<string[]>(["", "", ""]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const createGoalMutation = useMutation({ mutationFn: createGoal });
  const createHabitsMutation = useMutation({ mutationFn: suggestHabits });
  const [goalFilledIn, setGoalFilledIn] = useState(false);

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const handleTaskEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleTaskSave = (index: number) => {
    setEditingIndex(null);
  };

  console.log(goalFilledIn, "goalFilledIn");

  const handleRemoveTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
  };

  const handleAddTask = () => {
    setTasks([...tasks, ""]);
  };

  const handleGoalSaveClick = () => {
    if (!profile?.customerId) return;

    createHabitsMutation.mutate(
      {
        customerId: profile.customerId,
        goal: goalDescription + " within the timeframe of " + timeDescription,
      },
      {
        onSuccess: (data) => {
          console.log(data, "response habits");
          const mockData = [
            "• Start by dedicating 25 minutes daily to listening to French podcasts or radio shows",
            "• Practice speaking by watching French TV shows and movies with English subtitles nightly",
            "• Immerse yourself in French conversations by having dinner at a French restaurant every other week",
            "• Use language exchange apps like Tandem and HelloTalk for 1 hour daily",
            "• Listen to French language audiobooks or pods on topics you're interested in",
          ];
          addGoal({
            id: data.id,
            description: goalDescription,
            timeframe: timeDescription,
            habits: data,
          });
          if (!goalFilledIn) {
            setTasks([...data]);
          } else {
            setTasks([...tasks, ...data]);
          }
          setGoalFilledIn(true);
          console.log(data, "response habits");
        },
        onError: (error) => {
          console.error("Error creating habits:", error);
        },
      }
    );
  };

  const handleSave = () => {
    if (!profile?.customerId) {
      console.error("No customer ID available");
      return;
    }

    createGoalMutation.mutate(
      {
        customerId: profile.customerId,
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
            disabled={createHabitsMutation.isPending}
            className="goal-save-button text-[var(--btn-color)] border-2 border-[var(--btn-color)] mt-4 p-2 rounded-md text-lg font-bold cursor-pointer bg-color-[var(--btn-color)] flex items-center justify-center gap-2"
          >
            {createHabitsMutation.isPending ? (
              <>
                <Loader className="animate-spin" size={20} />
                Generating Habits...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
        {goalFilledIn && (
          <div className="bg-white rounded-lg p-6 text-[var(--secondary-text-color)] mb-6 flex-auto w-[500px]">
            <h2 className="text-lg mb-4 w-auto">Your habits to track</h2>
            {createHabitsMutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="animate-spin" size={24} />
                <span className="ml-2">Generating habits...</span>
              </div>
            ) : (
              <>
                {tasks.map((task, index) => (
                  <div key={index} className="mb-4 task-container">
                    {editingIndex === index ? (
                      <div className="flex gap-2 w-full">
                        <textarea
                          rows={2}
                          className="w-full border-b border-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] pb-2 bg-transparent md:min-h-[36px] min-h-[120px]"
                          name={`habit-${index}`}
                          placeholder="Enter your habit"
                          value={task}
                          onChange={(e) =>
                            handleTaskChange(index, e.target.value)
                          }
                          onBlur={() => handleTaskSave(index)}
                          autoFocus
                        />
                        <button
                          onClick={() => handleTaskSave(index)}
                          className="text-[var(--btn-color)] hover:text-[var(--accent-color)]"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => {
                            if (goalFilledIn) {
                              handleTaskEdit(index);
                            }
                          }}
                          className="text-[var(--btn-color)] hover:text-[var(--accent-color)]"
                        >
                          <PencilLine size={16} />
                        </button>
                        <p
                          className="w-full md:min-h-[36px] min-h-[100px] border-b border-[var(--secondary-color)] focus:outline-none focus:border-[var(--accent-color)] pb-2 bg-transparent"
                          onClick={() => {
                            if (goalFilledIn) {
                              handleTaskEdit(index);
                            }
                          }}
                        >
                          {task}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (goalFilledIn) {
                                handleTaskEdit(index);
                              }
                            }}
                            className="text-[var(--btn-color)] hover:text-[var(--accent-color)]"
                          >
                            <Minus size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddTask}
                  disabled={!goalFilledIn}
                  className="text-[var(--btn-color)] text-2xl font-bold cursor-pointer"
                >
                  <Plus className="hover:stroke-[var(--accent-color)] plus" />
                </button>
              </>
            )}
          </div>
        )}

        <div className="mb-6 flex-auto w-[400px]">
          <h2 className="text-lg mb-2 text-center">
            Tell us more about your goal and desired outcome{" "}
            <PencilLine className="inline-block" />
          </h2>
          <textarea
            className="w-full h-auto rounded-lg p-3 text-[var(--secondary-text-color)] focus:outline-2 focus:outline-offset-1 focus:outline-[var(--accent-color)] bg-white"
            placeholder="Type your message here..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />

          <button
            onClick={handleSave}
            disabled={!goalFilledIn || createGoalMutation.isPending}
            className="save-button mt-4 flex items-center justify-center gap-2"
          >
            {createGoalMutation.isPending ? (
              <>
                <Loader className="animate-spin" size={20} />
                Saving...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Template;
