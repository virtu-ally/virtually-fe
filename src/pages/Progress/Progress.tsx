import { useEffect, useMemo, useState } from "react";
import { type Goal } from "../../api/goals";
import {
  useHabitCompletionsByDate,
  useRecordHabitCompletion,
} from "../../api/hooks/useHabits";
import { getCategories } from "../../api/categories";
import { useQuery } from "@tanstack/react-query";

import Chart from "../../components/Chart";

// Helper function to format date as YYYY-MM-DD
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Progress = ({
  goals,
  isLoading: goalsLoading,
  isError: goalsError,
  error: goalsErrorDetails,
  customerId,
}: {
  goals: Goal[];
  isLoading: boolean;
  isError: boolean;
  error: Error;
  customerId: string;
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Get completions for the current month
  const {
    completionsByDate,
    isLoading: completionsLoading,
    isError: completionsError,
    error: completionsErrorDetails,
  } = useHabitCompletionsByDate(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const recordCompletionMutation = useRecordHabitCompletion();

  const firstDayOfMonth = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    [currentMonth]
  );

  const daysInMonth = useMemo(
    () =>
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      ).getDate(),
    [currentMonth]
  );

  const startWeekday = firstDayOfMonth.getDay(); // 0=Sun

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });

  const categories = categoriesQuery.data || [];

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Uncategorized";
  };

  // Extract habits from goals grouped by category
  const habitsByCategory = useMemo(() => {
    const grouped: Record<
      string,
      {
        categoryName: string;
        habits: Array<{ id: string; label: string; goalId: string }>;
      }
    > = {};

    goals.forEach((goal) => {
      const categoryId = goal.category_id || "uncategorized";
      const categoryName = getCategoryName(categoryId);

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          categoryName,
          habits: [],
        };
      }

      goal.habits
        .filter((h) => h.title && h.title.trim() !== "")
        .forEach((habit) => {
          grouped[categoryId].habits.push({
            id: habit.id,
            label: habit.title,
            goalId: goal.id,
          });
        });
    });

    return grouped;
  }, [goals, categories]);

  const selectedDay = selectedDate.getDate();
  const selectedMonthMatches =
    selectedDate.getFullYear() === currentMonth.getFullYear() &&
    selectedDate.getMonth() === currentMonth.getMonth();

  useEffect(() => {
    // Ensure selected date stays within current month view
    if (
      selectedDate.getFullYear() !== currentMonth.getFullYear() ||
      selectedDate.getMonth() !== currentMonth.getMonth()
    ) {
      const d = new Date(currentMonth);
      d.setDate(1);
      setSelectedDate(d);
    }
  }, [currentMonth, selectedDate]);

  const toggleHabitForSelectedDay = async (habitId: string) => {
    console.log("Attempting to complete habit:", { habitId, selectedDate });

    const day = selectedMonthMatches ? selectedDay : 1;
    const isCurrentlyCompleted = completionsByDate[day]?.[habitId] || false;

    if (!isCurrentlyCompleted) {
      // Format the selected date for the API (YYYY-MM-DD)
      const selectedDateFormatted = formatDateForAPI(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);

      // Prevent future date submissions as a safety check
      if (selectedDateObj > today) {
        alert("You cannot mark habits as completed for future dates.");
        return;
      }

      try {
        await recordCompletionMutation.mutateAsync({
          habitId,
          request: {
            completionDate: selectedDateFormatted,
          },
        });
      } catch (error) {
        console.error("Failed to toggle habit:", error);
        alert(`Failed to record habit completion: ${error.message}`);
      }
    } else {
      alert(
        "Unchecking habits is not supported by the current API. Please contact support if you need to modify past completions."
      );
    }
  };

  // Update chartData in Progress component
  const chartData = useMemo(() => {
    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const data = labels.map((day) => {
      const daily = completionsByDate[day] || {};
      const completions = Object.values(daily).filter(Boolean).length;
      return {
        day: day.toString(),
        completions,
        color:
          completions === 0 ? "var(--secondary-color)" : "var(--accent-color)",
      };
    });
    return data;
  }, [daysInMonth, completionsByDate]);

  return (
    <div className="progress-container px-4 py-6 text-[var(--text-color)]">
      <h2 className="mb-4">Progress Tracker</h2>

      {!customerId && (
        <div className="mb-4 text-sm opacity-80">No customer selected.</div>
      )}

      <div className="mb-6">
        {goalsLoading && <div>Loading goals...</div>}
        {completionsLoading && <div>Loading habit completions...</div>}
        {categoriesQuery.isLoading && <div>Loading categories...</div>}
        {goalsError && (
          <div className="text-red-500">
            {goalsErrorDetails?.message || "Failed to load goals"}
          </div>
        )}
        {completionsError && (
          <div className="text-red-500">
            Failed to load completions: {completionsErrorDetails?.message}
          </div>
        )}
        {categoriesQuery.isError && (
          <div className="text-red-500">
            Failed to load categories: {categoriesQuery.error?.message}
          </div>
        )}
        {!goalsLoading && goals.length === 0 && <div>No goals yet.</div>}
        {!goalsLoading &&
          goals.length > 0 &&
          Object.keys(habitsByCategory).length === 0 && (
            <div className="text-yellow-600">
              Goals loaded but no habits found.
            </div>
          )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/80 text-[var(--secondary-text-color)] rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              className="px-2 py-1 border rounded"
              onClick={() =>
                setCurrentMonth(
                  (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                )
              }
            >
              Prev
            </button>
            <div className="font-semibold">
              {currentMonth.toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              className="px-2 py-1 border rounded"
              onClick={() =>
                setCurrentMonth(
                  (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                )
              }
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1 opacity-70">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`pad-${i}`} className="h-10" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedMonthMatches && selectedDay === dayNum;
              const dailyCount = Object.values(
                completionsByDate[dayNum] || {}
              ).filter(Boolean).length;

              // Check if this date is in the future
              const dayDate = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                dayNum
              );
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
              dayDate.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
              const isFutureDate = dayDate > today;

              return (
                <button
                  key={dayNum}
                  onClick={() => {
                    if (!isFutureDate) {
                      const d = new Date(currentMonth);
                      d.setDate(dayNum);
                      setSelectedDate(d);
                    }
                  }}
                  disabled={isFutureDate}
                  className={`h-10 rounded-lg border-2 text-sm flex flex-col items-center justify-center transition-all shadow-sm ${
                    isSelected
                      ? "bg-[var(--accent-color)] border-[var(--accent-color)] text-white shadow-lg scale-105"
                      : isFutureDate
                      ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60"
                      : "bg-white border-transparent hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 hover:shadow-md"
                  }`}
                >
                  <span>{dayNum}</span>
                  {dailyCount > 0 && (
                    <span className="text-[10px] opacity-70">{dailyCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white/80 text-[var(--secondary-text-color)] rounded p-4">
          <h3 className="mb-4 font-semibold">
            Habits on{" "}
            {selectedMonthMatches
              ? selectedDate.toLocaleDateString()
              : currentMonth.toLocaleDateString()}
          </h3>

          {Object.keys(habitsByCategory).length === 0 ? (
            <div className="text-sm opacity-70">
              {goalsLoading ? "Loading habits..." : "No habits to track yet."}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(habitsByCategory).map(
                ([categoryId, { categoryName, habits }]) => (
                  <div key={categoryId} className="space-y-2">
                    <h4 className="text-md font-medium border-b border-gray-200 pb-1">
                      {categoryName}
                    </h4>
                    <div className="space-y-1">
                      {habits.map((habit) => {
                        const day = selectedMonthMatches ? selectedDay : 1;
                        const checked = Boolean(
                          completionsByDate[day]?.[habit.id]
                        );
                        const isDisabled = recordCompletionMutation.isPending;

                        return (
                          <div
                            key={habit.id}
                            onClick={() =>
                              !isDisabled && toggleHabitForSelectedDay(habit.id)
                            }
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              checked
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            } ${
                              isDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:shadow-sm"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                checked
                                  ? "bg-green-500 border-green-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {checked && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`flex-1 ${
                                isDisabled ? "opacity-50" : ""
                              }`}
                            >
                              {habit.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {recordCompletionMutation.isPending && (
            <div className="mt-4 text-sm opacity-70 text-center">Saving...</div>
          )}
        </div>
      </div>

      <Chart
        data={chartData}
        title={`Daily Completions — ${currentMonth.toLocaleString(undefined, {
          month: "long",
          year: "numeric",
        })}`}
        height={250}
      />
    </div>
  );
};

export default Progress;
