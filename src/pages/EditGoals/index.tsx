import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories } from "../../api/categories";
import { type Goal, deleteGoal } from "../../api/goals";
import { ArrowRight, Trash2 } from "lucide-react";
import { useCreateNewHabitsForGoal } from "../../api/hooks/useHabits";

import HabitEditor from "../../components/HabitEditor";

interface EditGoalsProps {
  goals: Goal[];
  isLoading: boolean;
  isError: boolean;
  error: Error;
  customerId: string;
}

const EditGoals = ({
  goals,
  isLoading,
  isError,
  error,
  customerId,
}: EditGoalsProps) => {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [progressNotes, setProgressNotes] = useState("");
  const [newHabits, setNewHabits] = useState([{ title: "", description: "" }]);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createNewHabitsMutation = useCreateNewHabitsForGoal();

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: true,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const categories = categoriesQuery.data || [];

  // Group goals by category, only show goals that have habits
  const goalsByCategory = useMemo(() => {
    if (!goals || !categories) return [];

    return categories
      .map((category) => {
        const categoryGoals = goals.filter(
          (goal) =>
            goal.category_id === category.id &&
            goal.habits &&
            goal.habits.length > 0
        );

        return {
          category,
          goals: categoryGoals,
        };
      })
      .filter((group) => group.goals.length > 0);
  }, [goals, categories]);

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Unknown";
  };

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => deleteGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", customerId] });
      queryClient.invalidateQueries({ queryKey: ["habitCompletions"] });
      setDeletingGoalId(null);
      if (selectedGoal) {
        setSelectedGoal(null);
        setProgressNotes("");
        setNewHabits([{ title: "", description: "" }]);
      }
      alert("Goal deleted successfully!");
    },
    onError: (error) => {
      console.error("Failed to delete goal:", error);
      alert("Failed to delete goal. Please try again.");
      setDeletingGoalId(null);
    },
  });

  const handleGoalSelect = (goal: Goal) => {
    setSelectedGoal(goal);
    setProgressNotes("");

    // Populate the HabitEditor with existing habits, properly formatted
    const existingHabits =
      goal.habits && goal.habits.length > 0
        ? goal.habits
            .filter((habit) => habit.title && habit.title.trim()) // Filter out empty habits
            .map((habit) => ({
              title: habit.title.replace(/^[\s]*[•*\-\+]\s*/, "").trim(), // Clean bullet points
              description: "",
            }))
        : [{ title: "", description: "" }];

    setNewHabits(existingHabits);
  };

  const handleDeleteGoal = (goalId: string, goalDescription: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the goal selection
    if (
      window.confirm(
        `Are you sure you want to delete "${goalDescription}"? This will also delete all associated habits and habit completions. This action cannot be undone.`
      )
    ) {
      setDeletingGoalId(goalId);
      deleteGoalMutation.mutate(goalId);
    }
  };

  const handleSubmit = async () => {
    if (!selectedGoal) return;

    if (!progressNotes.trim()) {
      alert("Please add progress notes about your current habits");
      return;
    }

    const validNewHabits = newHabits.filter((h) => h.title.trim());
    if (validNewHabits.length === 0) {
      alert("Please add at least one new habit");
      return;
    }

    try {
      await createNewHabitsMutation.mutateAsync({
        originalGoal: selectedGoal,
        progressNotes: progressNotes.trim(),
        newHabits: validNewHabits,
      });

      // Reset form
      setSelectedGoal(null);
      setProgressNotes("");
      setNewHabits([{ title: "", description: "" }]);

      alert(
        "New improved goal created successfully! You can now track your new habits."
      );
    } catch (error) {
      alert(`Failed to create new goal: ${error.message}`);
    }
  };

  const handleBack = () => {
    setSelectedGoal(null);
    setProgressNotes("");
    setNewHabits([{ title: "", description: "" }]);
  };

  if (isLoading) return <div>Loading goals...</div>;
  if (isError)
    return <div className="text-red-500">Error: {error?.message}</div>;

  return (
    <div className="edit-goals-container px-4 py-6 text-[var(--text-color)]">
      {!selectedGoal ? (
        // Goal Selection View
        <>
          <h2 className="mb-4">Edit Goals</h2>
          <p className="mb-6 text-sm opacity-80">
            Select a goal to evolve its habits based on your progress and
            learnings.
          </p>

          {goalsByCategory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg mb-2">No goals with habits found</p>
              <p className="text-sm opacity-70">
                Create some goals with habits first to edit them here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {goalsByCategory.map(({ category, goals: categoryGoals }) => (
                <div
                  key={category.id}
                  className="bg-white/70 rounded-lg p-4"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <h3 className="text-lg font-semibold mb-3 category-heading">
                    {category.name}
                  </h3>

                  <div className="space-y-3">
                    {categoryGoals.map((goal) => (
                      <div
                        key={goal.id}
                        onClick={() => handleGoalSelect(goal)}
                        className="bg-white/50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:shadow-md transition-all group"
                        style={{ borderColor: "var(--card-border)" }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div
                              className="font-medium mb-2"
                              style={{ color: "var(--text-color)" }}
                            >
                              {goal.description}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {goal.habits?.map((habit) => (
                                <span
                                  key={habit.id}
                                  className="text-xs px-2 py-1 rounded"
                                  style={{
                                    backgroundColor:
                                      "var(--accent-color-light)",
                                    color: "var(--secondary-text-color)",
                                  }}
                                >
                                  {habit.title}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleDeleteGoal(goal.id, goal.description, e)}
                              disabled={deletingGoalId === goal.id}
                              className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete goal"
                            >
                              <Trash2 size={18} />
                            </button>
                            <ArrowRight
                              size={20}
                              className="text-gray-400 group-hover:text-blue-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm mb-4 hover:underline"
              style={{ color: "var(--accent-color)" }}
            >
              ← Back to goals
            </button>
            <h2 className="mb-2">Edit Your Goal</h2>
            <p className="text-sm opacity-80">
              Create new improved habits for:{" "}
              <strong>{selectedGoal.description}</strong>
            </p>
          </div>

          <div
            className="mb-6 p-4 rounded-lg"
            style={{ backgroundColor: "white", opacity: 0.8 }}
          >
            <h3 className="font-medium mb-3">Current Habits</h3>
            <div className="flex flex-wrap gap-2">
              {selectedGoal.habits?.map((habit) => (
                <span
                  key={habit.id}
                  className="text-sm px-3 py-1 rounded"
                  style={{
                    backgroundColor: "var(--accent-color-light)",
                    color: "var(--secondary-text-color)",
                  }}
                >
                  {habit.title}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Progress Notes *
            </label>
            <textarea
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              className="w-full p-3 border rounded-lg resize-none"
              rows={4}
              placeholder="How have your current habits been working? What have you learned? What would you like to improve or change?"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--card-border)",
                color: "var(--text-color)",
              }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              Edit Habits *
            </label>
            <p className="text-xs opacity-70 mb-3">
              Modify your existing habits or add new ones based on your
              progress.
            </p>

            <HabitEditor
              habits={newHabits.map((h) => h.title)}
              onHabitsChange={(habitTitles) => {
                setNewHabits(
                  habitTitles.map((title) => ({ title, description: "" }))
                );
              }}
              disabled={false}
              className="bg-white/90 rounded-lg p-4"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              style={{ borderColor: "var(--card-border)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createNewHabitsMutation.isPending}
              className="px-6 py-2 rounded text-white"
              style={{ backgroundColor: "var(--accent-color)" }}
            >
              {createNewHabitsMutation.isPending
                ? "Creating..."
                : "Create New Habits"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EditGoals;
