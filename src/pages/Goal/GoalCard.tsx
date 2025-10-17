import { useMemo, useState } from "react";
import { type Goal } from "../../api/goals";
import { FolderInput } from "lucide-react";
import {
  useHabitCompletionsByDate,
  useRecordHabitCompletion,
  useDeleteHabitCompletion,
} from "../../api/hooks/useHabits";

type Category = {
  id: string;
  name: string;
};

const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const GoalCard = ({
  goal,
  isSelected,
  categories,
  onMoveGoal,
  movingGoalId,
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
}: {
  goal: Goal;
  isSelected: boolean;
  categories: Category[];
  onMoveGoal: (goalId: string, categoryId: string) => void;
  movingGoalId: string | null;
  currentMonth: Date;
  setCurrentMonth: (date: Date | ((prev: Date) => Date)) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}) => {
  const {
    completionsByDate,
    isLoading: completionsLoading,
  } = useHabitCompletionsByDate(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const recordCompletionMutation = useRecordHabitCompletion();
  const deleteCompletionMutation = useDeleteHabitCompletion();

  const { data: completionsData = [] } = useHabitCompletionsByDate(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

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

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Unknown";
  };

  const selectedGoalHabits = useMemo(() => {
    if (!goal) return [];
    return goal.habits
      .filter((h) => h.title && h.title.trim() !== "")
      .map((h) => ({
        id: h.id,
        label: h.title,
        goalId: goal.id,
      }));
  }, [goal]);

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

  const startWeekday = firstDayOfMonth.getDay();

  const selectedDay = selectedDate.getDate();
  const selectedMonthMatches =
    selectedDate.getFullYear() === currentMonth.getFullYear() &&
    selectedDate.getMonth() === currentMonth.getMonth();

  const [optimisticCompletions, setOptimisticCompletions] = useState<
    Record<string, boolean>
  >({});

  const toggleHabitForSelectedDay = async (habitId: string) => {
    const day = selectedMonthMatches ? selectedDay : 1;
    const isCurrentlyCompleted = completionsByDate[day]?.[habitId] || false;
    const optimisticKey = `${day}-${habitId}`;

    if (!isCurrentlyCompleted) {
      const selectedDateFormatted = formatDateForAPI(selectedDate);
      const today = formatDateForAPI(new Date());

      if (selectedDateFormatted <= today) {
        setOptimisticCompletions((prev) => ({ ...prev, [optimisticKey]: true }));
        
        try {
          await recordCompletionMutation.mutateAsync({
            habitId,
            request: {
              completionDate: selectedDateFormatted,
            },
          });
          setOptimisticCompletions((prev) => {
            const next = { ...prev };
            delete next[optimisticKey];
            return next;
          });
        } catch (error) {
          setOptimisticCompletions((prev) => {
            const next = { ...prev };
            delete next[optimisticKey];
            return next;
          });
          console.error("Failed to record habit completion:", error);
          alert(`Failed to record habit completion: ${error.message}`);
        }
      } else {
        alert("You can only mark habits as completed for today or past dates.");
      }
    } else {
      const completionId = completionIdsByDate[day]?.[habitId];
      if (completionId) {
        setOptimisticCompletions((prev) => ({ ...prev, [optimisticKey]: false }));

        try {
          await deleteCompletionMutation.mutateAsync({ completionId });
          setOptimisticCompletions((prev) => {
            const next = { ...prev };
            delete next[optimisticKey];
            return next;
          });
        } catch (error) {
          setOptimisticCompletions((prev) => {
            const next = { ...prev };
            delete next[optimisticKey];
            return next;
          });
          console.error("Failed to delete habit completion:", error);
          alert(`Failed to delete habit completion: ${error.message}`);
        }
      } else {
        alert(
          "Completion ID not found. Please refresh the page and try again."
        );
      }
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const today = new Date();
  const todayDay = today.getDate();
  const todayMatches =
    today.getFullYear() === currentMonth.getFullYear() &&
    today.getMonth() === currentMonth.getMonth();

  return (
    <div className="bg-white/80 text-[var(--secondary-text-color)] rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-xl">{goal.description}</div>
        <div className="flex items-center gap-2">
          {goal.category_id && (
            <span className="text-xs bg-[var(--btn-color)] text-white px-3 py-1 rounded">
              {getCategoryName(goal.category_id)}
            </span>
          )}
          <div className="relative group">
            <button
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Move to another category"
              disabled={movingGoalId === goal.id}
            >
              <FolderInput size={20} />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded border border-gray-200 z-10 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="py-1">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 border-b">
                  Move to:
                </div>
                {categories
                  .filter((cat) => cat.id !== goal.category_id)
                  .map((category) => (
                    <button
                      key={category.id}
                      onClick={() => onMoveGoal(goal.id, category.id)}
                      disabled={movingGoalId === goal.id}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {category.name}
                    </button>
                  ))}
                {categories.filter((cat) => cat.id !== goal.category_id)
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

      {isSelected && (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
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
              <div className="font-semibold text-sm">
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
                <div key={`pad-${i}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const isSelectedDay =
                  selectedMonthMatches && selectedDay === dayNum;
                const isToday = todayMatches && todayDay === dayNum;
                const dailyCount = Object.values(
                  completionsByDate[dayNum] || {}
                ).filter(Boolean).length;

                let bgColor = "bg-white";
                if (dailyCount > 0) {
                  const completionRatio = dailyCount / selectedGoalHabits.length;
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
                    className={`h-8 rounded border text-xs flex flex-col items-center justify-center transition-colors ${bgColor} ${
                      isSelectedDay
                        ? "border-2 border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30"
                        : isToday
                        ? "border-2 border-blue-400"
                        : "border-gray-300"
                    }`}
                  >
                    <span className={isToday ? "font-bold" : ""}>{dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white/80 text-[var(--secondary-text-color)] rounded p-4">
            <h3 className="mb-2 font-semibold">
              Habits on{" "}
              {selectedMonthMatches
                ? selectedDate.toLocaleDateString()
                : currentMonth.toLocaleDateString()}
            </h3>
            {selectedGoalHabits.length === 0 ? (
              <div className="text-sm opacity-70">
                {completionsLoading
                  ? "Loading habits..."
                  : "No habits to track yet."}
              </div>
            ) : (
              <ul className="space-y-2">
                {selectedGoalHabits.map((h) => {
                  const day = selectedMonthMatches ? selectedDay : 1;
                  const optimisticKey = `${day}-${h.id}`;
                  const optimisticState = optimisticCompletions[optimisticKey];
                  const checked =
                    optimisticState !== undefined
                      ? optimisticState
                      : Boolean(completionsByDate[day]?.[h.id]);
                  const isDisabled =
                    recordCompletionMutation.isPending ||
                    deleteCompletionMutation.isPending;

                  return (
                    <li key={h.id}>
                      <button
                        onClick={() => toggleHabitForSelectedDay(h.id)}
                        disabled={isDisabled}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                          checked
                            ? "bg-green-100 border-green-400 hover:bg-green-200"
                            : "bg-white border-gray-300 hover:bg-gray-50"
                        } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className={checked ? "font-medium text-green-800" : ""}>
                          {h.label}
                        </span>
                      </button>
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
      )}
    </div>
  );
};

export default GoalCard;
