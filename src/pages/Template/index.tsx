import "./index.css";

import {
  ChevronRight,
  FolderOpen,
  GraduationCap,
  Heart,
  LifeBuoy,
  Loader,
  Sparkles,
} from "lucide-react";
import { createGoal, pollForResults, suggestHabits } from "../../api/habits";
import { useMutation, useQuery } from "@tanstack/react-query";

import HabitEditor from "../../components/HabitEditor";
import Quiz from "../Quiz";
import React from "react";
import { getCategories } from "../../api/categories";
import { useCustomer } from "../../context/CustomerContext";
import { useGetCustomerQuiz } from "../../api/hooks/useCustomerQuiz";
import { useLocation } from "react-router-dom";
import { useState } from "react";

const Template = ({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) => {
  const [goalDescription, setGoalDescription] = useState("");
  const [timeDescription, setTimeDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const location = useLocation();
  const { profile, addGoal } = useCustomer();
  const [tasks, setTasks] = useState<string[]>(["", "", ""]);
  const createGoalMutation = useMutation({ mutationFn: createGoal });
  const createHabitsMutation = useMutation({ mutationFn: suggestHabits });
  const [goalFilledIn, setGoalFilledIn] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: true,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const quizQuery = useGetCustomerQuiz();

  // Map category names to icons
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name === "life")
      return <LifeBuoy className="w-8 h-8 text-[var(--btn-color)]" />;
    if (name === "health")
      return <Heart className="w-8 h-8 text-[var(--btn-color)]" />;
    if (name === "education")
      return <GraduationCap className="w-8 h-8 text-[var(--btn-color)]" />;
    return <FolderOpen className="w-8 h-8 text-[var(--btn-color)]" />;
  };

  // Initialize selected category from location state if available
  React.useEffect(() => {
    if (location.state?.categoryId && location.state?.categoryName) {
      setSelectedCategory({
        id: location.state.categoryId,
        name: location.state.categoryName,
      });
    }
  }, [location.state]);

  const handleCategorySelect = (category: { id: string; name: string }) => {
    setSelectedCategory(category);
  };

  const handleQuizClick = () => {
    if (quizQuery.data) {
      alert(
        "You've already completed the quiz! Check your progress in the Goals section."
      );
      return;
    }
    setShowQuiz(true);
  };

  const handleGoalSaveClick = async () => {
    if (!profile?.customerId) return;

    createHabitsMutation.mutate(
      {
        goal: goalDescription + " within the timeframe of " + timeDescription,
      },
      {
        onSuccess: async (result) => {
          if (result.isError) {
            console.error(
              "Error starting habit suggestion process:",
              result.message
            );
            return;
          }

          if (!result.data) {
            console.error("No data received from habit suggestion process");
            return;
          }

          console.log(result.data, "process started");
          try {
            setIsPolling(true);
            const habits = await pollForResults(result.data.suggestion_id);
            console.log(habits, "received habits");

            addGoal({
              id: result.data.suggestion_id,
              description: goalDescription,
              timeframe: timeDescription,
              habits: habits,
            });

            const formattedHabits = habits.map((habit) =>
              habit.replaceAll("*", "").trim()
            );

            if (!goalFilledIn) {
              setTasks([...formattedHabits]);
            } else {
              setTasks([...tasks, ...formattedHabits]);
            }
            setGoalFilledIn(true);
          } catch (pollError) {
            console.error("Error polling for results:", pollError);
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

    if (!selectedCategory) {
      alert("Please select a category first.");
      return;
    }

    createGoalMutation.mutate(
      {
        description: goalDescription,
        habits: tasks,
        category_id: selectedCategory.id,
      },
      {
        onSuccess: (data) => {
          console.log(data, "response goal");
          setActiveTab("goals");
        },
        onError: (error) => {
          console.error("Error creating goal:", error);
        },
      }
    );
  };

  const shouldShowQuizOption = !quizQuery.data && !quizQuery.isLoading;
  console.log(quizQuery.data, "quizQuery.data");
  // If no category is selected, show category selection
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] p-6">
        {!showQuiz ? (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">
              Create a New Goal
            </h1>
            <p className="text-center text-lg mb-8 opacity-80">
              Choose a category to get started
            </p>

            {categoriesQuery.isLoading && (
              <div className="text-center py-8">
                <Loader className="animate-spin mx-auto mb-4" size={32} />
                <p>Loading categories...</p>
              </div>
            )}

            {categoriesQuery.isError && (
              <div className="text-center py-8 text-red-600">
                <p>Failed to load categories. Please try again.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {categoriesQuery.data?.map((category) => (
                <button
                  key={category.id}
                  onClick={() =>
                    handleCategorySelect({
                      id: category.id,
                      name: category.name,
                    })
                  }
                  className="category-card group"
                >
                  <div className="category-icon-container">
                    {getCategoryIcon(category.name)}
                  </div>
                  <h3 className="category-title">{category.name}</h3>
                  <div className="category-arrow">
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>

            {shouldShowQuizOption && (
              <div className="max-w-md mx-auto">
                <button onClick={handleQuizClick} className="quiz-option-card">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Uniquely yours</h3>
                    <p className="text-sm opacity-80">
                      Take our quiz for personalized recommendations
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 min-w-6" />
                </button>
              </div>
            )}

            {quizQuery.data && (
              <div className=" mx-auto">
                <div className="quiz-completed-card">
                  <span className="text-green-600 font-semibold">
                    ✓ Quiz completed!
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Quiz setShowQuiz={setShowQuiz} />
        )}
      </div>
    );
  }

  // Rest of the existing Template component for goal creation...
  return (
    <div
      className={`min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] fade-in flex flex-col items-center`}
    >
      {/* Back button to category selection */}
      <div className="w-full pt-4 px-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-[var(--btn-color)] hover:text-[var(--accent-color)] transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to categories
        </button>
      </div>

      {/* Loading Overlay */}
      {isPolling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white-transparent rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl transform animate-pulse-scale">
            <div className="relative mb-6">
              <div className="loading-spinner-container">
                <Sparkles
                  className="animate-sparkle-1 absolute top-0 left-0 text-[var(--accent-color)]"
                  size={24}
                />
                <Loader
                  className="animate-spin text-[var(--btn-color)] mx-auto"
                  size={48}
                />
                <Sparkles
                  className="animate-sparkle-2 absolute bottom-0 right-0 text-[var(--secondary-color)]"
                  size={20}
                />
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

      {/* Main Content */}
      <div
        className={
          isPolling ? "pointer-events-none opacity-75" : "goal-form-container"
        }
      >
        <h1 className="title text-3xl mb-6 pt-8 px-4 w-full text-center capitalize">
          {selectedCategory.name}
        </h1>

        {/* Rest of your existing goal creation form... */}
        <div className="flex flex-col gap-4 w-full md:p-16 p-4 items-center">
          <div className="bg-white/80 rounded-lg p-6 text-[var(--secondary-text-color)] mb-4 md:w-[500px] max-w-[500px] flex-auto justify-center items-center">
            <h2 className="text-lg mb-4 w-auto">
              Describe your overall {selectedCategory.name} goal
            </h2>
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
            <div className="bg-white/80 rounded-lg p-6 text-[var(--secondary-text-color)] mb-6 md:w-[500px] flex-auto max-w-[500px] bg-white-transparent">
              <h2 className="text-lg mb-4 w-auto">Your habits to track</h2>
              {createHabitsMutation.isPending ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin" size={24} />
                  <span className="ml-2">Generating habits...</span>
                </div>
              ) : (
                <>
                  <HabitEditor
                    habits={tasks}
                    onHabitsChange={setTasks}
                    disabled={!goalFilledIn}
                    className="mb-6"
                  />
                </>
              )}
            </div>
          )}

          <div className="mb-6 flex-auto md:w-[500px] ">
            {/* <h2 className="text-lg mb-2 text-center">
              Tell us more about your goal and desired outcome{" "}
              <PencilLine className="inline-block" />
            </h2>
            <textarea
              className="w-full h-auto rounded-lg p-3 text-[var(--secondary-text-color)] focus:outline-2 focus:outline-offset-1 focus:outline-[var(--accent-color)] bg-white"
              placeholder="Type your message here..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            /> */}

            <button
              onClick={handleSave}
              disabled={
                !goalFilledIn || createGoalMutation.isPending || isPolling
              }
              className="save-button flex items-center justify-center gap-2"
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
