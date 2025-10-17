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

  const totalHabitCount = useMemo(() => {
    return filteredGoals.reduce((acc, goal) => {
      const validHabits = goal.habits.filter((h) => h.title && h.title.trim() !== "");
      return acc + validHabits.length;
    }, 0);
  }, [filteredGoals]);

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
    const last7Days = [];

    // Generate 7 days ending on selectedDate
    for (let i = 6; i >= 0; i--) {
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() - i);
      last7Days.push(date);
    }

    const labels = last7Days.map(date =>
      date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    );

    const data = last7Days.map(date => {
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();

      // Only use completionsByDate if it matches the date's month/year
      if (year === currentMonth.getFullYear() && month === currentMonth.getMonth()) {
        const daily = completionsByDate[day] || {};
        if (!selectedGoal) return 0;
        const goalHabitIds = selectedGoal.habits.map((h) => h.id);
        return Object.entries(daily).filter(
          ([habitId, completed]) =>
            completed && goalHabitIds.includes(habitId)
        ).length;
      }
      return 0;
    });

    return {
      labels,
      datasets: [
        {
          label: "Completed habits",
          data,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
      dateRange: {
        start: last7Days[0],
        end: last7Days[last7Days.length - 1],
      },
    };
  }, [completionsByDate, selectedGoal, currentMonth, selectedDate]);

  const chartOptions = useMemo(() => {
    const dateRange = selectedGoalChartData.dateRange;
    const startStr = dateRange.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = dateRange.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${startStr} - ${endStr}`,
          font: {
            size: 16,
            weight: "bold" as const,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
    };
  }, [selectedGoalChartData]);

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
                        selectedDate={selectedDate}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <GoalStats
              completionCount={currentMonthStats.completionCount}
              completionRate={currentMonthStats.completionRate}
              goalCount={filteredGoals.length}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />

            {selectedGoal && (
              <div className="chart-container bg-white/80 rounded p-4 text-[var(--secondary-text-color)]">
                <Line data={selectedGoalChartData} options={chartOptions} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GoalsCarousel;
