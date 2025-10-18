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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const GoalCard = ({
  goal,
  isSelected,
  categories,
  onMoveGoal,
  movingGoalId,
  selectedDate,
}: {
  goal: Goal;
  isSelected: boolean;
  categories: Category[];
  onMoveGoal: (goalId: string, categoryId: string) => void;
  movingGoalId: string | null;
  selectedDate: Date;
}) => {
  const {
    completionsByDate,
    isLoading: completionsLoading,
  } = useHabitCompletionsByDate(
    selectedDate.getFullYear(),
    selectedDate.getMonth()
  );

  const recordCompletionMutation = useRecordHabitCompletion();
  const deleteCompletionMutation = useDeleteHabitCompletion();

  const { data: completionsData = {} } = useHabitCompletionsByDate(
    selectedDate.getFullYear(),
    selectedDate.getMonth()
  );

  const completionIdsByDate = useMemo(() => {
    const mapping: Record<number, Record<string, string>> = {};
    for (const [day, habits] of Object.entries(completionsData)) {
      mapping[Number(day)] = {};
      for (const [habitId, completion] of Object.entries(habits)) {
        mapping[Number(day)][habitId] = completion.id;
      }
    }
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

  const selectedDay = selectedDate.getDate();

  const [optimisticCompletions, setOptimisticCompletions] = useState<
    Record<string, boolean>
  >({});

  const toggleHabitForSelectedDay = async (habitId: string) => {
    const day = selectedDay;
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
          await deleteCompletionMutation.mutateAsync({
            completionId,
            year: selectedDate.getFullYear(),
            month: selectedDate.getMonth(),
            day,
            habitId,
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
        <div className="mt-4">
          <div className="bg-white/80 text-[var(--secondary-text-color)] rounded p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Habits</h3>
              <div className="text-sm text-gray-600">
                {selectedDate.toLocaleDateString()}
              </div>
            </div>
            {selectedGoalHabits.length === 0 ? (
              <div className="text-sm opacity-70">
                {completionsLoading
                  ? "Loading habits..."
                  : "No habits to track yet."}
              </div>
            ) : (
              <ul className="space-y-2">
                {selectedGoalHabits.map((h) => {
                  const day = selectedDay;
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
                        className={`relative w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                          checked
                            ? "border-[var(--btn-color)]"
                            : "bg-white border-gray-300 hover:bg-gray-50"
                        } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {checked && (
                          <div
                            className="absolute inset-0 rounded-lg"
                            style={{
                              backgroundColor: "var(--btn-color)",
                              opacity: 0.1,
                            }}
                          />
                        )}
                        <span
                          className={`relative ${checked ? "font-medium" : ""}`}
                          style={checked ? { color: "var(--btn-color)" } : undefined}
                        >
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
