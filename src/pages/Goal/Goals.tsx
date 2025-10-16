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

import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { type Goal, moveGoal } from "../../api/goals";
import { getCategories, type Category } from "../../api/categories";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderInput } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type DayCompletions = Record<string, boolean>; // key is `${goalId}::${habit}`
type MonthCompletions = Record<number, DayCompletions>; // 1..N -> completions
type AllMonthsData = Record<string, MonthCompletions>; // "YYYY-MM" -> month data

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const storageKey = (customerId: string, key: string) =>
  `habitCompletions:${customerId}:${key}`;

// Helper function to get all available months from localStorage
const getAllAvailableMonths = (customerId: string): string[] => {
  if (!customerId) return [];

  const months: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`habitCompletions:${customerId}:`)) {
      const monthKey = key.replace(`habitCompletions:${customerId}:`, "");
      if (monthKey.match(/^\d{4}-\d{2}$/)) {
        // Validate YYYY-MM format
        months.push(monthKey);
      }
    }
  }

  return months.sort(); // Sort chronologically
};

// Helper function to parse month key to Date
const parseMonthKey = (monthKey: string): Date => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

// Helper function to get days in a month
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const Goals = ({
  goals,
  isLoading,
  isError,
  error,
  customerId,
}: {
  goals: Goal[];
  isLoading: boolean;
  isError: boolean;
  error: Error;
  customerId: string;
}) => {
  const [allMonthsData, setAllMonthsData] = useState<AllMonthsData>({});
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [movingGoalId, setMovingGoalId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ["categories", customerId],
    queryFn: () => getCategories(),
    enabled: !!customerId,
  });

  const categories = categoriesQuery.data || [];

  // Move goal mutation
  const moveGoalMutation = useMutation({
    mutationFn: ({ goalId, categoryId }: { goalId: string; categoryId: string }) =>
      moveGoal(goalId, categoryId),
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
      return goals; // Show all goals
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

  // Load all available months data from localStorage
  useEffect(() => {
    if (!customerId) return;

    const months = getAllAvailableMonths(customerId);
    setAvailableMonths(months);

    const allData: AllMonthsData = {};

    months.forEach((month) => {
      const key = storageKey(customerId, month);
      const saved = localStorage.getItem(key);
      try {
        allData[month] = saved ? (JSON.parse(saved) as MonthCompletions) : {};
      } catch {
        allData[month] = {};
      }
    });

    setAllMonthsData(allData);
  }, [customerId]);

  // Calculate total statistics across all months
  const totalStats = useMemo(() => {
    let totalCompletions = 0;
    let totalPossibleCompletions = 0;
    const monthlyTotals: Array<{
      month: string;
      completions: number;
      possible: number;
    }> = [];

    availableMonths.forEach((monthKey) => {
      const monthData = allMonthsData[monthKey] || {};
      const date = parseMonthKey(monthKey);
      const daysInMonth = getDaysInMonth(date.getFullYear(), date.getMonth());

      let monthCompletions = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const dailyCompletions = Object.values(monthData[day] || {}).filter(
          Boolean
        ).length;
        monthCompletions += dailyCompletions;
      }

      const totalHabits = filteredGoals.reduce(
        (acc, goal) => acc + (goal.habits?.length || 0),
        0
      );
      const monthPossible = daysInMonth * totalHabits;

      totalCompletions += monthCompletions;
      totalPossibleCompletions += monthPossible;

      monthlyTotals.push({
        month: monthKey,
        completions: monthCompletions,
        possible: monthPossible,
      });
    });

    const completionRate =
      totalPossibleCompletions > 0
        ? (totalCompletions / totalPossibleCompletions) * 100
        : 0;

    return {
      totalCompletions,
      totalPossibleCompletions,
      completionRate,
      monthlyTotals,
    };
  }, [allMonthsData, availableMonths, filteredGoals]);

  // Chart data for all months combined
  const chartData = useMemo(() => {
    if (availableMonths.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Create labels and data for all months
    const labels: string[] = [];
    const completionData: number[] = [];
    const completionRateData: number[] = [];

    availableMonths.forEach((monthKey) => {
      const monthData = allMonthsData[monthKey] || {};
      const date = parseMonthKey(monthKey);
      const daysInMonth = getDaysInMonth(date.getFullYear(), date.getMonth());
      const monthLabel = date.toLocaleString(undefined, {
        month: "short",
        year: "numeric",
      });

      // Calculate total completions for the month
      let monthCompletions = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const dailyCompletions = Object.values(monthData[day] || {}).filter(
          Boolean
        ).length;
        monthCompletions += dailyCompletions;
      }

      // Calculate completion rate for the month
      const totalHabits = filteredGoals.reduce(
        (acc, goal) => acc + (goal.habits?.length || 0),
        0
      );
      const monthPossible = daysInMonth * totalHabits;
      const monthRate =
        monthPossible > 0 ? (monthCompletions / monthPossible) * 100 : 0;

      labels.push(monthLabel);
      completionData.push(monthCompletions);
      completionRateData.push(Number(monthRate.toFixed(1)));
    });

    return {
      labels,
      datasets: [
        {
          label: "Total Completions",
          data: completionData,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
          yAxisID: "y",
        },
        {
          label: "Completion Rate (%)",
          data: completionRateData,
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          tension: 0.1,
          yAxisID: "y1",
        },
      ],
    };
  }, [allMonthsData, availableMonths, filteredGoals]);

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: "Goal Progress - All Time Overview",
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Month",
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Total Completions",
        },
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Completion Rate (%)",
        },
        beginAtZero: true,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="progress-container px-4 py-6 text-[var(--text-color)]">
      <h2 className="mb-4">All-Time Goal Progress</h2>

      {!customerId && (
        <div className="mb-4 text-sm opacity-80">No customer selected.</div>
      )}

      {/* Category Filter Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-4 py-2 rounded ${
              selectedCategoryId === null
                ? "bg-[var(--btn-color)] text-white"
                : "bg-white/70 text-[var(--secondary-text-color)] hover:bg-white/90"
            }`}
          >
            All Goals
          </button>
          {categoriesQuery.isLoading && (
            <span className="px-4 py-2 text-sm opacity-70">Loading categories...</span>
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

      {/* Overall Statistics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/70 text-[var(--secondary-text-color)] rounded p-4">
          <h4 className="font-semibold text-lg">
            {totalStats.totalCompletions}
          </h4>
          <p className="text-sm opacity-80">Total Completions</p>
        </div>
        <div className="bg-white/70 text-[var(--secondary-text-color)] rounded p-4">
          <h4 className="font-semibold text-lg">
            {totalStats.completionRate.toFixed(1)}%
          </h4>
          <p className="text-sm opacity-80">Overall Completion Rate</p>
        </div>
        <div className="bg-white/70 text-[var(--secondary-text-color)] rounded p-4">
          <h4 className="font-semibold text-lg">{availableMonths.length}</h4>
          <p className="text-sm opacity-80">Months Tracked</p>
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
        {!isLoading && filteredGoals.length === 0 && selectedCategoryId === null && <div>No goals yet.</div>}
        {!isLoading && filteredGoals.length === 0 && selectedCategoryId !== null && (
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
                        {categories.filter((cat) => cat.id !== g.category_id).length === 0 && (
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

      {/* Monthly Breakdown */}
      {availableMonths.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2">Monthly Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {totalStats.monthlyTotals.map(
              ({ month, completions, possible }) => {
                const rate = possible > 0 ? (completions / possible) * 100 : 0;
                const date = parseMonthKey(month);
                const monthLabel = date.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div
                    key={month}
                    className="bg-white/70 text-[var(--secondary-text-color)] rounded p-3"
                  >
                    <h4 className="font-semibold">{monthLabel}</h4>
                    <p className="text-sm">
                      {completions} / {possible} completions
                    </p>
                    <p className="text-sm font-medium">
                      {rate.toFixed(1)}% completion rate
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      {availableMonths.length > 0 ? (
        <div className="chart-container mt-6 bg-white/80 rounded p-4 text-[var(--secondary-text-color)]">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="chart-container mt-6 bg-white/80 rounded p-4 text-[var(--secondary-text-color)] text-center">
          <p>
            No progress data available yet. Start tracking your habits to see
            your progress!
          </p>
        </div>
      )}
    </div>
  );
};

export default Goals;
