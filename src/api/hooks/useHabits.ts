import {
  HabitCompletionRequest,
  HabitCompletionWithDetails,
  getHabitCompletions,
  recordHabitCompletion,
  deleteHabitCompletion,
} from "../habits";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Type for the day-keyed cache structure for a month
export type MonthCompletionsCache = Record<number, Record<string, HabitCompletionWithDetails>>;

// Hook to fetch habit completions for an entire month
export const useMonthlyHabitCompletions = (
  year: number,
  month: number // 0-based month (0 = January)
) => {
  // Convert to YYYY-MM format (month is 0-based, so add 1)
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  return useQuery<MonthCompletionsCache>({
    queryKey: ["habitCompletions", year, month],
    queryFn: async () => {
      const completions = await getHabitCompletions(monthStr);

      // Transform flat array into day-keyed structure
      const cache: MonthCompletionsCache = {};
      for (const completion of completions) {
        // Parse day directly from YYYY-MM-DD string to avoid timezone issues
        const day = parseInt(completion.completion_date.split('-')[2], 10);

        if (!cache[day]) {
          cache[day] = {};
        }

        cache[day][completion.habit_id] = completion;
      }

      return cache;
    },
    retry: (failureCount, error) => {
      // Don't retry if it's a 404 (no completions found) or 400 (invalid month)
      if (error?.message?.includes("Customer not found") ||
          error?.message?.includes("Invalid month")) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: Infinity, // Never refetch in background - rely on optimistic updates and page refresh
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes after last use
  });
};

// Hook to record a habit completion
export const useRecordHabitCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      habitId,
      request = {},
    }: {
      habitId: string;
      request?: HabitCompletionRequest;
    }) => recordHabitCompletion(habitId, request),
    onSuccess: (data) => {
      // Optimistically update the cache for the specific month and day
      // Parse date components directly from YYYY-MM-DD string to avoid timezone issues
      const dateParts = data.completion_date.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0-based
      const day = parseInt(dateParts[2], 10);

      const queryKey = ["habitCompletions", year, month];

      // Update the cache by adding/updating the completion for this day and habit
      queryClient.setQueryData<MonthCompletionsCache>(queryKey, (old = {}) => {
        return {
          ...old,
          [day]: {
            ...old[day],
            [data.habit_id]: data as HabitCompletionWithDetails,
          },
        };
      });
    },
    onError: (error) => {
      console.error("Failed to record habit completion:", error);
    },
  });
};

// Hook to delete a habit completion
export const useDeleteHabitCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      completionId,
    }: {
      completionId: string;
      year: number;
      month: number;
      day: number;
      habitId: string;
    }) => deleteHabitCompletion(completionId),
    onSuccess: (_, variables) => {
      // Optimistically remove the completion from cache
      const { year, month, day, habitId } = variables;
      const queryKey = ["habitCompletions", year, month];

      queryClient.setQueryData<MonthCompletionsCache>(queryKey, (old = {}) => {
        if (!old[day]) return old;

        const { [habitId]: removed, ...remainingHabits } = old[day];

        return {
          ...old,
          [day]: remainingHabits,
        };
      });
    },
    onError: (error) => {
      console.error("Failed to delete habit completion:", error);
    },
  });
};

// Hook to get completions grouped by date for easy UI consumption
// This now simply returns the already-structured data, optionally simplifying to boolean flags
export const useHabitCompletionsByDate = (year: number, month: number) => {
  const { data: completionsCache = {}, ...queryResult } = useMonthlyHabitCompletions(
    year,
    month
  );

  // Transform to simpler boolean map if needed for UI
  const completionsByDate: Record<number, Record<string, boolean>> = {};
  for (const [day, habits] of Object.entries(completionsCache)) {
    completionsByDate[Number(day)] = {};
    for (const habitId of Object.keys(habits)) {
      completionsByDate[Number(day)][habitId] = true;
    }
  }

  return {
    ...queryResult,
    data: completionsCache, // Full completion details
    completionsByDate, // Simplified boolean map
  };
};
