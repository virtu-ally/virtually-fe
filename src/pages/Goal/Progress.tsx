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
    completionsByDate,
    isLoading: completionsLoading,
    isError: completionsError,
    error: completionsErrorDetails,
  } = useHabitCompletionsByDate(
    customerId,
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

  // Extract habits from goals (this is the key fix)
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
    console.log("Attempting to complete habit:", { habitId, customerId });

    const day = selectedMonthMatches ? selectedDay : 1;
    const isCurrentlyCompleted = completionsByDate[day]?.[habitId] || false;

    if (!isCurrentlyCompleted) {
      // Only allow checking today's date or past dates
      const selectedDateFormatted = formatDateForAPI(selectedDate);
      const today = formatDateForAPI(new Date());

      if (selectedDateFormatted <= today) {
        try {
          await recordCompletionMutation.mutateAsync({
            customerId,
            habitId,
            request: {}, // Can add notes here if needed
          });
        } catch (error) {
          console.error("Failed to toggle habit:", error);
          alert(`Failed to record habit completion: ${error.message}`);
        }
      } else {
        alert("You can only mark habits as completed for today or past dates.");
      }
    } else {
      alert(
        "Unchecking habits is not supported by the current API. Please contact support if you need to modify past completions."
      );
    }
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
              return (
                <button
                  key={dayNum}
                  onClick={() => {
                    const d = new Date(currentMonth);
                    d.setDate(dayNum);
                    setSelectedDate(d);
                  }}
                  className={`h-10 rounded border text-sm flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-[var(--accent-color-light)] border-[var(--accent-color)]"
                      : "bg-white"
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
                const isDisabled = recordCompletionMutation.isPending;

                return (
                  <li key={h.id} className="flex items-center gap-2">
                    <input
                      id={h.id}
                      type="checkbox"
                      checked={checked}
                      disabled={isDisabled}
                      onChange={() => toggleHabitForSelectedDay(h.id)}
                    />
                    <label
                      htmlFor={h.id}
                      className={isDisabled ? "opacity-50" : ""}
                    >
                      {h.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {recordCompletionMutation.isPending && (
            <div className="mt-2 text-sm opacity-70">Saving...</div>
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
