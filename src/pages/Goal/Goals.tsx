import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { type Goal, moveGoal } from "../../api/goals";
import { getCategories } from "../../api/categories";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderInput } from "lucide-react";
import { useMonthlyHabitCompletions } from "../../api/hooks/useHabits";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Goals = ({
  goals,
  isLoading,
  isError,
  error,
  customerId,
  initialCategoryId = null,
}: {
  goals: Goal[];
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
  const queryClient = useQueryClient();

  // Get current month data
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const { data: currentMonthCompletions = [] } = useMonthlyHabitCompletions(
    currentYear,
    currentMonth
  );

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ["categories", customerId],
    queryFn: () => getCategories(),
    enabled: !!customerId,
  });

  const categories = categoriesQuery.data || [];

  // Move goal mutation
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

  // Filter goals by selected category
  const filteredGoals = useMemo(() => {
    if (!selectedCategoryId) {
      return [];
    }
    return goals.filter((goal) => goal.category_id === selectedCategoryId);
  }, [goals, selectedCategoryId]);

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Unknown";
  };

  // Handle moving goal to new category
  const handleMoveGoal = (goalId: string, newCategoryId: string) => {
    setMovingGoalId(goalId);
    moveGoalMutation.mutate({ goalId, categoryId: newCategoryId });
  };

  // Calculate statistics for current month
  const currentMonthStats = useMemo(() => {
    const completionCount = currentMonthCompletions.length;
    const totalHabits = filteredGoals.reduce(
      (acc, goal) => acc + (goal.habits?.length || 0),
      0
    );

    const daysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();
    const possibleCompletions = daysInMonth * totalHabits;
    const completionRate =
      possibleCompletions > 0
        ? (completionCount / possibleCompletions) * 100
        : 0;

    return {
      completionCount,
      possibleCompletions,
      completionRate,
    };
  }, [currentMonthCompletions, filteredGoals, currentYear, currentMonth]);

  // Chart data for current month (daily completions)
  const chartData = useMemo(() => {
    const daysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

    // Group completions by day
    const completionsByDay: Record<number, number> = {};
    currentMonthCompletions.forEach((completion) => {
      const date = new Date(completion.completion_date);
      const day = date.getDate();
      completionsByDay[day] = (completionsByDay[day] || 0) + 1;
    });

    const data = labels.map((label, i) => completionsByDay[i + 1] || 0);

    return {
      labels,
      datasets: [
        {
          label: "Daily Completions",
          data,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
        },
      ],
    };
  }, [currentMonthCompletions, currentYear, currentMonth]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: `${new Date(currentYear, currentMonth).toLocaleString(
          undefined,
          {
            month: "long",
            year: "numeric",
          }
        )} - Daily Completions`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  return (
    <div className="progress-container px-4 py-6 text-[var(--text-color)]">
      <h2 className="mb-4">Goal Overview</h2>

      {!customerId && (
        <div className="mb-4 text-sm opacity-80">No customer selected.</div>
      )}

      {/* Category Filter Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {categoriesQuery.isLoading && (
            <span className="px-4 py-2 text-sm opacity-70">
              Loading categories...
            </span>
          )}
          {categories.map((category) => (
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
        {!isLoading && selectedCategoryId && filteredGoals.length === 0 && (
          <div>No goals in this category yet.</div>
        )}
        <ul className="space-y-2">
          {filteredGoals.map((g) => (
            <li
              key={g.id}
              className="bg-white/70 text-[var(--secondary-text-color)] rounded p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold flex-1">{g.description}</div>
                <div className="flex items-center gap-2">
                  {g.category_id && (
                    <span className="text-xs bg-[var(--btn-color)] text-white px-2 py-1 rounded">
                      {getCategoryName(g.category_id)}
                    </span>
                  )}
                  {/* Move Goal Dropdown */}
                  <div className="relative group">
                    <button
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Move to another category"
                      disabled={movingGoalId === g.id}
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
                          .filter((cat) => cat.id !== g.category_id)
                          .map((category) => (
                            <button
                              key={category.id}
                              onClick={() => handleMoveGoal(g.id, category.id)}
                              disabled={movingGoalId === g.id}
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
                </div>
              </div>
              {g.habits?.length ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {g.habits.map((h) => (
                    <span
                      key={`${g.id}::${h.id}`}
                      className="text-xs bg-[var(--accent-color-light)] text-[var(--secondary-text-color)] px-2 py-1 rounded"
                    >
                      {h.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {/* Chart */}
      <div className="chart-container mt-6 bg-white/80 rounded p-4 text-[var(--secondary-text-color)]">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default Goals;
