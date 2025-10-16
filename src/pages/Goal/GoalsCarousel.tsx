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

import { useEffect, useMemo, useState, useCallback } from "react";
import { Line } from "react-chartjs-2";
import { type Goal, moveGoal } from "../../api/goals";
import { getCategories } from "../../api/categories";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderInput, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useHabitCompletionsByDate,
  useRecordHabitCompletion,
  useDeleteHabitCompletion,
  useMonthlyHabitCompletions,
} from "../../api/hooks/useHabits";
import useEmblaCarousel from "embla-carousel-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const GoalsCarousel = ({
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
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
  });
  const [selectedGoalIndex, setSelectedGoalIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const queryClient = useQueryClient();

  const {
    data: completionsData = [],
    completionsByDate,
    isLoading: completionsLoading,
  } = useHabitCompletionsByDate(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const recordCompletionMutation = useRecordHabitCompletion();
  const deleteCompletionMutation = useDeleteHabitCompletion();

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

  const categoriesQuery = useQuery({
    queryKey: ["categories", customerId],
    queryFn: () => getCategories(),
    enabled: !!customerId,
  });

  const categories = categoriesQuery.data || [];

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

  const filteredGoals = useMemo(() => {
    if (!selectedCategoryId) {
      return [];
    }
    return goals.filter((goal) => goal.category_id === selectedCategoryId);
  }, [goals, selectedCategoryId]);

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Unknown";
  };

  const handleMoveGoal = (goalId: string, newCategoryId: string) => {
    setMovingGoalId(goalId);
    moveGoalMutation.mutate({ goalId, categoryId: newCategoryId });
  };

  const currentYear = currentMonth.getFullYear();
  const currentMonthValue = currentMonth.getMonth();

  const { data: currentMonthCompletions = [] } = useMonthlyHabitCompletions(
    currentYear,
    currentMonthValue
  );

  const currentMonthStats = useMemo(() => {
    const completionCount = currentMonthCompletions.length;
    const totalHabits = filteredGoals.reduce(
      (acc, goal) => acc + (goal.habits?.length || 0),
      0
    );

    const daysInMonth = new Date(
      currentYear,
      currentMonthValue + 1,
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
  }, [currentMonthCompletions, filteredGoals, currentYear, currentMonthValue]);

  const selectedGoal = filteredGoals[selectedGoalIndex];

  const selectedGoalHabits = useMemo(() => {
    if (!selectedGoal) return [];
    return selectedGoal.habits
      .filter((h) => h.title && h.title.trim() !== "")
      .map((h) => ({
        id: h.id,
        label: h.title,
        goalId: selectedGoal.id,
      }));
  }, [selectedGoal]);

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

  useEffect(() => {
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
    const day = selectedMonthMatches ? selectedDay : 1;
    const isCurrentlyCompleted = completionsByDate[day]?.[habitId] || false;

    if (!isCurrentlyCompleted) {
      const selectedDateFormatted = formatDateForAPI(selectedDate);
      const today = formatDateForAPI(new Date());

      if (selectedDateFormatted <= today) {
        try {
          await recordCompletionMutation.mutateAsync({
            habitId,
            request: {
              completionDate: selectedDateFormatted,
            },
          });
        } catch (error) {
          console.error("Failed to record habit completion:", error);
          alert(`Failed to record habit completion: ${error.message}`);
        }
      } else {
        alert("You can only mark habits as completed for today or past dates.");
      }
    } else {
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
          alert(
            "Completion ID not found. Please refresh the page and try again."
          );
        }
      }
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const selectedGoalChartData = useMemo(() => {
    const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const daily = completionsByDate[i + 1] || {};
      if (!selectedGoal) return 0;
      const goalHabitIds = selectedGoal.habits.map((h) => h.id);
      return Object.entries(daily).filter(
        ([habitId, completed]) =>
          completed && goalHabitIds.includes(habitId)
      ).length;
    });
    return {
      labels,
      datasets: [
        {
          label: "Completed habits for this goal",
          data,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };
  }, [daysInMonth, completionsByDate, selectedGoal]);

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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedGoalIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const onInit = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onInit();
    onSelect();
    emblaApi.on("init", onInit);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onInit);
    return () => {
      emblaApi.off("init", onInit);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onInit);
    };
  }, [emblaApi, onSelect, onInit]);

  return (
    <div className="progress-container px-4 py-6 text-[var(--text-color)]">
      <h2 className="mb-4">Goals</h2>

      {!customerId && (
        <div className="mb-4 text-sm opacity-80">No customer selected.</div>
      )}

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
              onClick={() => {
                setSelectedCategoryId(category.id);
                setSelectedGoalIndex(0);
              }}
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

      {filteredGoals.length > 0 && (
        <>
          <div className="relative mb-6 flex items-center gap-4">
            {filteredGoals.length > 1 && (
              <button
                className="flex-shrink-0 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg z-10"
                onClick={scrollPrev}
                aria-label="Previous goal"
              >
                <ChevronLeft size={32} />
              </button>
            )}
            
            <div className="flex-1" style={{ perspective: "1200px" }}>
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {filteredGoals.map((goal, index) => (
                      <div
                        key={goal.id}
                        className={`embla__slide flex-[0_0_100%] min-w-0 px-4 ${
                          index === selectedGoalIndex ? 'is-selected' : ''
                        }`}
                      >
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
                                        onClick={() =>
                                          handleMoveGoal(goal.id, category.id)
                                        }
                                        disabled={movingGoalId === goal.id}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {category.name}
                                      </button>
                                    ))}
                                  {categories.filter(
                                    (cat) => cat.id !== goal.category_id
                                  ).length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-500">
                                      No other categories
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {index === selectedGoalIndex && (
                          <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-white/80 text-[var(--secondary-text-color)] rounded p-4">
                              <div className="flex items-center justify-between mb-3">
                                <button
                                  className="px-2 py-1 border rounded hover:bg-gray-100"
                                  onClick={() =>
                                    setCurrentMonth(
                                      (d) =>
                                        new Date(
                                          d.getFullYear(),
                                          d.getMonth() - 1,
                                          1
                                        )
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
                                      (d) =>
                                        new Date(
                                          d.getFullYear(),
                                          d.getMonth() + 1,
                                          1
                                        )
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
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                                  (d) => (
                                    <div key={d}>{d}</div>
                                  )
                                )}
                              </div>

                              <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: startWeekday }).map((_, i) => (
                                  <div key={`pad-${i}`} className="h-8" />
                                ))}
                                {Array.from({ length: daysInMonth }, (_, i) => {
                                  const dayNum = i + 1;
                                  const isSelected =
                                    selectedMonthMatches && selectedDay === dayNum;
                                  const isToday = todayMatches && todayDay === dayNum;
                                  const dailyCount = Object.values(
                                    completionsByDate[dayNum] || {}
                                  ).filter(Boolean).length;

                                  let bgColor = "bg-white";
                                  if (dailyCount > 0) {
                                    const completionRatio =
                                      dailyCount / selectedGoalHabits.length;
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
                                        isSelected
                                          ? "border-2 border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30"
                                          : isToday
                                          ? "border-2 border-blue-400"
                                          : "border-gray-300"
                                      }`}
                                    >
                                      <span className={isToday ? "font-bold" : ""}>
                                        {dayNum}
                                      </span>
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
                                    const checked = Boolean(
                                      completionsByDate[day]?.[h.id]
                                    );
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
                                          onChange={() =>
                                            toggleHabitForSelectedDay(h.id)
                                          }
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
                                  {recordCompletionMutation.isPending
                                    ? "Saving..."
                                    : "Deleting..."}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {filteredGoals.length > 1 && (
              <button
                className="flex-shrink-0 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg z-10"
                onClick={scrollNext}
                aria-label="Next goal"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>

          {selectedGoal && (
            <div className="chart-container mt-6 bg-white/80 rounded p-4 text-[var(--secondary-text-color)]">
              <Line data={selectedGoalChartData} options={chartOptions} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GoalsCarousel;
