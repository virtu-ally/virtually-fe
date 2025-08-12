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
import { useQuery } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import { getCustomerGoals, type Goal } from "../../api/goals";
import { useCustomer } from "../../context/CustomerContext";

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

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const storageKey = (customerId: string, key: string) =>
  `habitCompletions:${customerId}:${key}`;

const Progress = ({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) => {
  const { profile } = useCustomer();
  const customerId = profile?.customerId;

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [completions, setCompletions] = useState<MonthCompletions>({});

  const {
    data: goals = [],
    isLoading,
    isError,
    error,
  } = useQuery<Goal[]>({
    queryKey: ["goals", customerId],
    queryFn: () => getCustomerGoals(customerId as string),
    enabled: !!customerId,
  });

  // Load/save completions for month from localStorage
  useEffect(() => {
    if (!customerId) return;
    const key = storageKey(customerId, monthKey(currentMonth));
    const saved = localStorage.getItem(key);
    try {
      setCompletions(saved ? (JSON.parse(saved) as MonthCompletions) : {});
    } catch {
      setCompletions({});
    }
  }, [customerId, currentMonth]);

  useEffect(() => {
    if (!customerId) return;
    const key = storageKey(customerId, monthKey(currentMonth));
    localStorage.setItem(key, JSON.stringify(completions));
  }, [customerId, currentMonth, completions]);

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

  const allHabits = useMemo(() => {
    return goals.flatMap((g) =>
      g.habits.map((h) => ({ id: `${g.id}::${h.id}`, label: h.title }))
    );
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
  }, [currentMonth]);

  const toggleHabitForSelectedDay = (habitId: string) => {
    setCompletions((prev) => {
      const day = selectedMonthMatches ? selectedDay : 1;
      const existing = prev[day] || {};
      const next: MonthCompletions = {
        ...prev,
        [day]: { ...existing, [habitId]: !existing[habitId] },
      };
      return next;
    });
  };

  const chartData = useMemo(() => {
    const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const daily = completions[i + 1] || {};
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
  }, [daysInMonth, completions]);

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
        <h3 className="mb-2">Your Goals</h3>
        {isLoading && <div>Loading goals...</div>}
        {isError && (
          <div className="text-red-500">
            {(error as Error)?.message || "Failed to load goals"}
          </div>
        )}
        {!isLoading && goals.length === 0 && <div>No goals yet.</div>}
        <ul className="space-y-2">
          {goals.map((g) => (
            <li
              key={g.id}
              className="bg-white/70 text-[var(--secondary-text-color)] rounded p-3"
            >
              <div className="font-semibold">{g.description}</div>
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
                completions[dayNum] || {}
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
            <div className="text-sm opacity-70">No habits to track yet.</div>
          ) : (
            <ul className="space-y-2">
              {allHabits.map((h) => {
                const day = selectedMonthMatches ? selectedDay : 1;
                const checked = Boolean(completions[day]?.[h.id]);
                return (
                  <li key={h.id} className="flex items-center gap-2">
                    <input
                      id={h.id}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleHabitForSelectedDay(h.id)}
                    />
                    <label htmlFor={h.id}>{h.label}</label>
                  </li>
                );
              })}
            </ul>
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
