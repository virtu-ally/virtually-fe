import { useEffect, useMemo, useState } from "react";
import { type Goal, moveGoal, deleteGoal } from "../../api/goals";
import { getCategories } from "../../api/categories";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderInput, Trash2 } from "lucide-react";
import { useMonthlyHabitCompletions } from "../../api/hooks/useHabits";
import Chart from "../../components/Chart";

const Goals = ({
  goals,
  isLoading,
  isError,
  error,
  customerId,
  initialCategoryId = null,
}: {
  goals: Goal[] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error;
  customerId: string;
  initialCategoryId?: string | null;
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId
  );
  const [movingGoalId, setMovingGoalId] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const { data: currentMonthCompletions = [] } = useMonthlyHabitCompletions(
    currentYear,
    currentMonth
  );

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });

  const categories = categoriesQuery.data || [];

  const categoriesWithHabits = useMemo(() => {
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
          ...category,
          goalsCount: categoryGoals.length,
          totalHabits: categoryGoals.reduce(
            (sum, goal) => sum + (goal.habits?.length || 0),
            0
          ),
        };
      })
      .filter((cat) => cat.goalsCount > 0);
  }, [goals, categories]);

  useEffect(() => {
    if (!selectedCategoryId && categoriesWithHabits.length > 0) {
      setSelectedCategoryId(categoriesWithHabits[0].id);
    }
  }, [categoriesWithHabits, selectedCategoryId]);

  const moveGoalMutation = useMutation({
    mutationFn: ({
      goalId,
      categoryId,
    }: {
      goalId: string;
      categoryId: string;
    }) => moveGoal(goalId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", customerId] });
      setMovingGoalId(null);
      alert("Goal moved successfully!");
    },
    onError: (error) => {
      console.error("Failed to move goal:", error);
      alert("Failed to move goal. Please try again.");
      setMovingGoalId(null);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => deleteGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", customerId] });
      queryClient.invalidateQueries({ queryKey: ["habitCompletions"] });
      setDeletingGoalId(null);
      alert("Goal deleted successfully!");
    },
    onError: (error) => {
      console.error("Failed to delete goal:", error);
      alert("Failed to delete goal. Please try again.");
      setDeletingGoalId(null);
    },
  });

  const filteredGoals = useMemo(() => {
    if (!selectedCategoryId || !goals) {
      return [];
    }
    return goals.filter(
      (goal) =>
        goal.category_id === selectedCategoryId &&
        goal.habits &&
        goal.habits.length > 0
    );
  }, [goals, selectedCategoryId]);

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Unknown";
  };

  const handleMoveGoal = (goalId: string, newCategoryId: string) => {
    setMovingGoalId(goalId);
    moveGoalMutation.mutate({ goalId, categoryId: newCategoryId });
  };

  const handleDeleteGoal = (goalId: string, goalDescription: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${goalDescription}"? This will also delete all associated habits and habit completions. This action cannot be undone.`
      )
    ) {
      setDeletingGoalId(goalId);
      deleteGoalMutation.mutate(goalId);
    }
  };

  const currentMonthStats = useMemo(() => {
    try {
      const completionCount = Array.isArray(currentMonthCompletions)
        ? currentMonthCompletions.length
        : 0;
      const totalHabits = (filteredGoals || []).reduce(
        (acc, goal) => acc + ((goal?.habits || []).length || 0),
        0
      );

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const possibleCompletions = daysInMonth * (totalHabits || 0);
      const completionRate =
        possibleCompletions > 0
          ? (completionCount / possibleCompletions) * 100
          : 0;

      return {
        completionCount: completionCount || 0,
        possibleCompletions: possibleCompletions || 0,
        completionRate: completionRate || 0,
      };
    } catch (error) {
      console.error("Error calculating stats:", error);
      return {
        completionCount: 0,
        possibleCompletions: 0,
        completionRate: 0,
      };
    }
  }, [currentMonthCompletions, filteredGoals, currentYear, currentMonth]);

  const chartData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const completionsByDay: Record<number, number> = {};

    if (
      currentMonthCompletions &&
      typeof currentMonthCompletions === "object"
    ) {
      Object.entries(currentMonthCompletions).forEach(
        ([dayStr, habitsForDay]) => {
          const day = parseInt(dayStr, 10);
          completionsByDay[day] = Object.keys(habitsForDay || {}).length;
        }
      );
    }

    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const completions = completionsByDay[day] || 0;
      return {
        day: day.toString(),
        completions,
        // Add color based on completion count
        color:
          completions === 0
            ? "var(--secondary-color)"
            : completions <= 2
            ? "var(--accent-color-light)"
            : "var(--accent-color)",
      };
    });

    return data;
  }, [currentMonthCompletions, currentYear, currentMonth]);

  return (
    <div className="progress-container px-4 py-6 text-[var(--text-color)]">
      <h2 className="mb-4">Goal Overview</h2>

      {!customerId && (
        <div className="mb-4 text-sm opacity-80">No customer selected.</div>
      )}

      {/* Category Filter Tabs */}
      <div className="mb-6 overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 pb-2">
          {categoriesQuery.isLoading && (
            <span className="px-4 py-2 text-sm opacity-70">
              Loading categories...
            </span>
          )}
          {categoriesWithHabits.length === 0 && !categoriesQuery.isLoading && (
            <span className="px-4 py-2 text-sm opacity-70">
              No categories with habits yet. Create some goals first!
            </span>
          )}
          {categoriesWithHabits.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-4 py-2 rounded whitespace-nowrap ${
                selectedCategoryId === category.id
                  ? "bg-[var(--btn-color)] text-white"
                  : "bg-white/70 text-[var(--secondary-text-color)] hover:bg-white/90"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Current Month Statistics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/70 text-[var(--secondary-text-color)] rounded p-4">
          <h4 className="font-semibold text-lg">
            {currentMonthStats.completionCount}
          </h4>
          <p className="text-sm opacity-80">Completions This Month</p>
        </div>
        <div className="bg-white/70 text-[var(--secondary-text-color)] rounded p-4">
          <h4 className="font-semibold text-lg">
            {currentMonthStats.completionRate.toFixed(1)}%
          </h4>
          <p className="text-sm opacity-80">Monthly Completion Rate</p>
        </div>
        <div className="bg-white/70 text-[var(--secondary-text-color)] rounded p-4">
          <h4 className="font-semibold text-lg">{filteredGoals.length}</h4>
          <p className="text-sm opacity-80">Active Goals</p>
        </div>
      </div>

      {/* Goals List */}
      <div className="mb-6">
        <h3 className="mb-2">Your Goals</h3>
        {isLoading && <div>Loading goals...</div>}
        {isError && (
          <div className="text-red-500">
            {(error as Error)?.message || "Failed to load goals"}
          </div>
        )}
        {!isLoading && !selectedCategoryId && (
          <div>Please select a category to view goals.</div>
        )}
        {!isLoading &&
          selectedCategoryId &&
          (!filteredGoals || filteredGoals.length === 0) && (
            <div>No goals with habits in this category yet.</div>
          )}
        <ul className="space-y-3">
          {(filteredGoals || []).map((g) => (
            <li
              key={g.id}
              className="bg-white/70 text-[var(--secondary-text-color)] rounded-lg p-4"
            >
              <div className="flex flex-col gap-3">
                {/* Goal description */}
                <div className="font-semibold text-base">{g.description}</div>

                {/* Habits - wrap properly on mobile */}
                {g.habits?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {g.habits?.map((h) => (
                      <span
                        key={`${g.id}::${h.id}`}
                        className="text-xs bg-[var(--accent-color-light)] text-[var(--secondary-text-color)] px-2 py-1 rounded whitespace-nowrap"
                      >
                        {h.title}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Category and action buttons */}
                <div className="flex items-center justify-between">
                  {g.category_id && (
                    <span className="text-xs bg-[var(--btn-color)] text-white px-2 py-1 rounded">
                      {getCategoryName(g.category_id)}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {/* Move Goal Dropdown */}
                    <div className="relative group">
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Move to another category"
                        disabled={movingGoalId === g.id || deletingGoalId === g.id}
                      >
                        <FolderInput size={16} />
                      </button>
                      {/* Dropdown menu */}
                      <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded border border-gray-200 z-10 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        <div className="py-1">
                          <div className="px-3 py-1 text-xs font-semibold text-gray-500 border-b">
                            Move to:
                          </div>
                          {categories
                            ?.filter((cat) => cat.id !== g.category_id)
                            ?.map((category) => (
                              <button
                                key={category.id}
                                onClick={() => handleMoveGoal(g.id, category.id)}
                                disabled={movingGoalId === g.id || deletingGoalId === g.id}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {category.name}
                              </button>
                            ))}
                          {categories.filter((cat) => cat.id !== g.category_id)
                            .length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No other categories
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteGoal(g.id, g.description)}
                      disabled={deletingGoalId === g.id || movingGoalId === g.id}
                      className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete goal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Chart
        data={chartData}
        title={`${new Date(currentYear, currentMonth).toLocaleString(
          undefined,
          {
            month: "long",
            year: "numeric",
          }
        )} - Daily Completions`}
        height={300}
      />
    </div>
  );
};

export default Goals;
