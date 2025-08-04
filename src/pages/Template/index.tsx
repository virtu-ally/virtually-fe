import "./index.css";

import { Loader, Minus, PencilLine, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { createGoal, suggestHabits, pollForResults } from "../../api/habits";
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
  const [isPolling, setIsPolling] = useState(false);

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

  const handleGoalSaveClick = async () => {
    if (!profile?.customerId) return;

    createHabitsMutation.mutate(
      {
        customerId: profile.customerId,
        goal: goalDescription + " within the timeframe of " + timeDescription,
      },
      {
        onSuccess: async (result) => {
          if (result.isError) {
            console.error("Error starting habit suggestion process:", result.message);
            return;
          }

          if (!result.data) {
            console.error("No data received from habit suggestion process");
            return;
          }

          console.log(result.data, "process started");
          try {
            setIsPolling(true);
            // Poll for results using suggestion_id
            const habits = await pollForResults(result.data.suggestion_id);
            console.log(habits, "received habits");
            
            addGoal({
              id: result.data.suggestion_id,
              description: goalDescription,
              timeframe: timeDescription,
              habits: habits,
            });
            
            if (!goalFilledIn) {
              setTasks([...habits]);
            } else {
              setTasks([...tasks, ...habits]);
            }
            setGoalFilledIn(true);
          } catch (pollError) {
            console.error("Error polling for results:", pollError);
            // Handle polling error - maybe show a fallback UI
          } finally {
            setIsPolling(false);
          }
        },
        onError: (error) => {
          console.error("Error in mutation:", error);
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
      className={`min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] fade-in flex flex-col items-center relative`}
    >
      {/* Loading Overlay */}
      {isPolling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl transform animate-pulse-scale">
            <div className="relative mb-6">
              <div className="loading-spinner-container">
                <Sparkles className="animate-sparkle-1 absolute top-0 left-0 text-[var(--accent-color)]" size={24} />
                <Loader className="animate-spin text-[var(--btn-color)] mx-auto" size={48} />
                <Sparkles className="animate-sparkle-2 absolute bottom-0 right-0 text-[var(--secondary-color)]" size={20} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[var(--secondary-text-color)] mb-2">
              Getting your habit suggestions...
            </h3>
            <p className="text-[var(--secondary-text-color)] opacity-70">
              Our AI is crafting personalized habits just for you
            </p>
            <div className="mt-4 flex justify-center">
              <div className="progress-dots">
                <span className="animate-bounce-1">•</span>
                <span className="animate-bounce-2">•</span>
                <span className="animate-bounce-3">•</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content - Disabled when polling */}
      <div className={isPolling ? 'pointer-events-none opacity-75' : ''}>
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
            disabled={createHabitsMutation.isPending || isPolling}
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
            disabled={!goalFilledIn || createGoalMutation.isPending || isPolling}
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
    </div>
  );
};

export default Template;
