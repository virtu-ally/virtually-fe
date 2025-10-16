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
import { type Goal } from "../../api/goals";
import { useCustomer } from "../../context/CustomerContext";
import {
  useHabitCompletionsByDate,
  useRecordHabitCompletion,
  useDeleteHabitCompletion,
} from "../../api/hooks/useHabits";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to format date as YYYY-MM-DD
const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split("T")[0];
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
    data: completionsData = [],
    completionsByDate,
    isLoading: completionsLoading,
    isError: completionsError,
    error: completionsErrorDetails,
  } = useHabitCompletionsByDate(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const recordCompletionMutation = useRecordHabitCompletion();
  const deleteCompletionMutation = useDeleteHabitCompletion();

  // Create a mapping of day -> habitId -> completionId for deletion
  const completionIdsByDate = useMemo(() => {
    const mapping: Record<number, Record<string, string>> = {};
    completionsData.forEach((completion) => {
      const date = new Date(completion.completion_date);
      const day = date.getDate();
      if (!mapping[day]) {
        mapping[day] = {};
      }
      mapping[day][completion.habit_id] = completion.id;
    });
    return mapping;
  }, [completionsData]);

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

  // Extract habits from goals
  const allHabits = useMemo(() => {
    const habits = goals.flatMap((g) => {
      return g.habits
        .filter((h) => h.title && h.title.trim() !== "")
        .map((h) => ({
          id: h.id,
          label: h.title,
          goalId: g.id,
        }));
    });
    return habits;
  }, [goals]);

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
    console.log("Attempting to toggle habit:", { habitId });

    const day = selectedMonthMatches ? selectedDay : 1;
    const isCurrentlyCompleted = completionsByDate[day]?.[habitId] || false;

    if (!isCurrentlyCompleted) {
      // Checking a habit - only allow today's date or past dates
      const selectedDateFormatted = formatDateForAPI(selectedDate);
      const today = formatDateForAPI(new Date());

      if (selectedDateFormatted <= today) {
        try {
          await recordCompletionMutation.mutateAsync({
            habitId,
            request: {}, // Can add notes here if needed
          });
        } catch (error) {
          console.error("Failed to record habit completion:", error);
          alert(`Failed to record habit completion: ${error.message}`);
        }
      } else {
        alert("You can only mark habits as completed for today or past dates.");
      }
    } else {
      // Unchecking a habit - show confirmation dialog
      const confirmDelete = window.confirm(
        "Are you sure you want to remove this completion? This action cannot be undone."
      );

      if (confirmDelete) {
        const completionId = completionIdsByDate[day]?.[habitId];
        if (completionId) {
          try {
            await deleteCompletionMutation.mutateAsync({ completionId });
          } catch (error) {
            console.error("Failed to delete habit completion:", error);
            alert(`Failed to delete habit completion: ${error.message}`);
          }
        } else {
          alert("Completion ID not found. Please refresh the page and try again.");
        }
      }
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const chartData = useMemo(() => {
    const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const daily = completionsByDate[i + 1] || {};
      return Object.values(daily).filter(Boolean).length;
    });
    return {
      labels,
      datasets: [
        {
          label: "Completed habits",
          data,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };
  }, [daysInMonth, completionsByDate]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: `Daily Completions — ${currentMonth.toLocaleString(undefined, {
          month: "long",
          year: "numeric",
        })}`,
      },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  const today = new Date();
  const todayDay = today.getDate();
  const todayMatches =
    today.getFullYear() === currentMonth.getFullYear() &&
    today.getMonth() === currentMonth.getMonth();

  return (
    <div className="progress-container px-4 py-6 text-[var(--text-color)]">
      <h2 className="mb-4">Progress Tracker</h2>

      {!customerId && (
        <div className="mb-4 text-sm opacity-80">No customer selected.</div>
      )}

      <div className="mb-6">
        {goalsLoading && <div>Loading goals...</div>}
        {completionsLoading && <div>Loading habit completions...</div>}
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
        {!goalsLoading && goals.length === 0 && <div>No goals yet.</div>}
        {!goalsLoading && goals.length > 0 && allHabits.length === 0 && (
          <div className="text-yellow-600">
            Goals loaded but no habits found.
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/80 text-[var(--secondary-text-color)] rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              className="px-2 py-1 border rounded hover:bg-gray-100"
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
              className="px-2 py-1 border rounded hover:bg-gray-100"
              onClick={() =>
                setCurrentMonth(
                  (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                )
              }
            >
              Next
            </button>
          </div>

          <div className="mb-2 text-center">
            <button
              className="px-3 py-1 text-sm border rounded bg-blue-50 hover:bg-blue-100"
              onClick={goToToday}
            >
              Today
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
              const isToday = todayMatches && todayDay === dayNum;
              const dailyCount = Object.values(
                completionsByDate[dayNum] || {}
              ).filter(Boolean).length;

              // Color coding based on completion count
              let bgColor = "bg-white";
              if (dailyCount > 0) {
                const completionRatio = dailyCount / allHabits.length;
                if (completionRatio >= 0.8) {
                  bgColor = "bg-green-100";
                } else if (completionRatio >= 0.5) {
                  bgColor = "bg-yellow-100";
                } else {
                  bgColor = "bg-orange-100";
                }
              }

              return (
                <button
                  key={dayNum}
                  onClick={() => {
                    const d = new Date(currentMonth);
                    d.setDate(dayNum);
                    setSelectedDate(d);
                  }}
                  className={`h-10 rounded border text-sm flex flex-col items-center justify-center transition-colors ${bgColor} ${
                    isSelected
                      ? "border-2 border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30"
                      : isToday
                      ? "border-2 border-blue-400"
                      : "border-gray-300"
                  }`}
                >
                  <span className={isToday ? "font-bold" : ""}>{dayNum}</span>
                  {dailyCount > 0 && (
                    <span className="text-[10px] font-semibold text-green-700">
                      {dailyCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white/80 text-[var(--secondary-text-color)] rounded p-4">
          <h3 className="mb-2">
            Habits on{" "}
            {selectedMonthMatches
              ? selectedDate.toLocaleDateString()
              : currentMonth.toLocaleDateString()}
          </h3>
          {allHabits.length === 0 ? (
            <div className="text-sm opacity-70">
              {goalsLoading ? "Loading habits..." : "No habits to track yet."}
            </div>
          ) : (
            <ul className="space-y-2">
              {allHabits.map((h) => {
                const day = selectedMonthMatches ? selectedDay : 1;
                const checked = Boolean(completionsByDate[day]?.[h.id]);
                const isDisabled =
                  recordCompletionMutation.isPending ||
                  deleteCompletionMutation.isPending;

                return (
                  <li key={h.id} className="flex items-center gap-2">
                    <input
                      id={h.id}
                      type="checkbox"
                      checked={checked}
                      disabled={isDisabled}
                      onChange={() => toggleHabitForSelectedDay(h.id)}
                      className="cursor-pointer"
                    />
                    <label
                      htmlFor={h.id}
                      className={`cursor-pointer ${
                        isDisabled ? "opacity-50" : ""
                      }`}
                    >
                      {h.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {(recordCompletionMutation.isPending ||
            deleteCompletionMutation.isPending) && (
            <div className="mt-2 text-sm opacity-70">
              {recordCompletionMutation.isPending ? "Saving..." : "Deleting..."}
            </div>
          )}
        </div>
      </div>

      <div className="chart-container mt-6 bg-white/80 rounded p-4 text-[var(--secondary-text-color)]">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default Progress;
