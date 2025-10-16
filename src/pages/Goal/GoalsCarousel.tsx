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
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useHabitCompletionsByDate,
  useMonthlyHabitCompletions,
} from "../../api/hooks/useHabits";
import useEmblaCarousel from "embla-carousel-react";
import CategoryFilter from "./CategoryFilter";
import GoalStats from "./GoalStats";
import GoalCard from "./GoalCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

  const queryClient = useQueryClient();

  const { completionsByDate } = useHabitCompletionsByDate(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

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

  const daysInMonth = useMemo(
    () =>
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      ).getDate(),
    [currentMonth]
  );

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

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedGoalIndex(0);
  };

  return (
    <div className="progress-container px-4 py-6 text-[var(--text-color)]">
      <h2 className="mb-4">Goals</h2>

      {!customerId && (
        <div className="mb-4 text-sm opacity-80">No customer selected.</div>
      )}

      <CategoryFilter
        categories={categories}
        isLoading={categoriesQuery.isLoading}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
      />

      <GoalStats
        completionCount={currentMonthStats.completionCount}
        completionRate={currentMonthStats.completionRate}
        goalCount={filteredGoals.length}
      />

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
                      <GoalCard
                        goal={goal}
                        isSelected={index === selectedGoalIndex}
                        categories={categories}
                        onMoveGoal={handleMoveGoal}
                        movingGoalId={movingGoalId}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                      />
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
