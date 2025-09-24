import {
  HabitCompletionRequest,
  HabitCompletionWithDetails,
  getHabitCompletions,
  recordHabitCompletion,
} from "../habits";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useHabitCompletions = (
  customerId: string | undefined,
  date?: string
) => {
  return useQuery<HabitCompletionWithDetails[]>({
    queryKey: ["habitCompletions", customerId, date],
    queryFn: () => getHabitCompletions(customerId as string, date),
    enabled: !!customerId,
    retry: (failureCount, error) => {
      // Don't retry if it's a 404 (no completions found)
      if (error?.message?.includes("Customer not found")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Hook to fetch habit completions for an entire month
export const useMonthlyHabitCompletions = (
  customerId: string | undefined,
  year: number,
  month: number // 0-based month (0 = January)
) => {
  // Helper function to get all dates in a month
  const getDatesInMonth = (year: number, month: number): string[] => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const monthDates = getDatesInMonth(year, month);

  return useQuery<HabitCompletionWithDetails[]>({
    queryKey: ["habitCompletions", customerId, year, month],
    queryFn: async () => {
      if (!customerId) return [];

      // Fetch completions for each day in the month
      const allCompletions: HabitCompletionWithDetails[] = [];

      // Note: This could be optimized with a backend endpoint that accepts date ranges
      for (const date of monthDates) {
        try {
          const dayCompletions = await getHabitCompletions(customerId, date);
          allCompletions.push(...dayCompletions);
        } catch (error) {
          // If no completions for a day, that's fine - just continue
          console.log(`No completions for ${date}:`, error);
        }
      }

      return allCompletions;
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook to record a habit completion
export const useRecordHabitCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      habitId,
      request = {},
    }: {
      customerId: string;
      habitId: string;
      request?: HabitCompletionRequest;
    }) => recordHabitCompletion(customerId, habitId, request),
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      const completionDate = new Date(data.completion_date);
      const year = completionDate.getFullYear();
      const month = completionDate.getMonth();

      // Invalidate monthly completions
      queryClient.invalidateQueries({
        queryKey: ["habitCompletions", variables.customerId, year, month],
      });

      // Invalidate daily completions for the specific date
      queryClient.invalidateQueries({
        queryKey: [
          "habitCompletions",
          variables.customerId,
          data.completion_date,
        ],
      });

      // Also invalidate today's completions if different from completion date
      const today = new Date().toISOString().split("T")[0];
      if (data.completion_date !== today) {
        queryClient.invalidateQueries({
          queryKey: ["habitCompletions", variables.customerId, today],
        });
      }
    },
    onError: (error) => {
      console.error("Failed to record habit completion:", error);
    },
  });
};

// Hook to get completions grouped by date for easy UI consumption
export const useHabitCompletionsByDate = (
  customerId: string | undefined,
  year: number,
  month: number
) => {
  const { data: completions = [], ...queryResult } = useMonthlyHabitCompletions(
    customerId,
    year,
    month
  );

  // Transform completions into a format that's easy to use in the UI
  const completionsByDate = completions.reduce((acc, completion) => {
    const date = new Date(completion.completion_date);
    const day = date.getDate();

    if (!acc[day]) {
      acc[day] = {};
    }

    acc[day][completion.habit_id] = true;

    return acc;
  }, {} as Record<number, Record<string, boolean>>);

  return {
    ...queryResult,
    data: completions,
    completionsByDate,
  };
};
