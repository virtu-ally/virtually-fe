import {
  HabitCompletionRequest,
  HabitCompletionWithDetails,
  createGoal,
  deleteHabitCompletion,
  getHabitCompletions,
  recordHabitCompletion,
} from "../habits";
import { getAuthHeaders, getBaseUrl } from "../getBaseUrl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Goal } from "../goals";

// Type for the day-keyed cache structure for a month
export type MonthCompletionsCache = Record<
  number,
  Record<string, HabitCompletionWithDetails>
>;

// Hook to fetch habit completions for an entire month
export const useMonthlyHabitCompletions = (
  year: number,
  month: number // 0-based month (0 = January)
) => {
  // Convert to YYYY-MM format (month is 0-based, so add 1)
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  return useQuery<MonthCompletionsCache>({
    queryKey: ["habitCompletions", year, month],
    queryFn: async () => {
      try {
        const completions = await getHabitCompletions(monthStr);

        // Handle null/undefined response
        if (!completions) {
          return {};
        }

        // Ensure we have an array
        if (!Array.isArray(completions)) {
          console.warn(
            "Expected array but got:",
            typeof completions,
            completions
          );
          return {};
        }

        // Transform flat array into day-keyed structure
        const cache: MonthCompletionsCache = {};
        for (const completion of completions) {
          if (!completion || !completion.completion_date) {
            continue; // Skip invalid completions
          }

          // Parse day directly from YYYY-MM-DD string to avoid timezone issues
          const day = parseInt(completion.completion_date.split("-")[2], 10);

          if (isNaN(day)) {
            continue; // Skip invalid dates
          }

          if (!cache[day]) {
            cache[day] = {};
          }

          cache[day][completion.habit_id] = completion;
        }

        return cache;
      } catch (error) {
        console.error("Error fetching habit completions:", error);
        return {}; // Return empty cache on error
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if it's a 404 (no completions found) or 400 (invalid month)
      if (
        error?.message?.includes("Customer not found") ||
        error?.message?.includes("Invalid month")
      ) {
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
      const dateParts = data.completion_date.split("-");
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
  const { data: completionsCache = {}, ...queryResult } =
    useMonthlyHabitCompletions(year, month);

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

export interface CreateNewHabitsRequest {
  goalId: string;
  progressNotes: string;
  newHabits: Array<{
    title: string;
    description: string;
  }>;
}

export const useCreateNewHabitsForGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: {
      originalGoal: Goal;
      progressNotes: string;
      newHabits: Array<{ title: string; description: string }>;
    }) => {
      // Use the correct property name and add date for versioning
      const currentDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const updatedDescription = `${
        request.originalGoal.description ||
        "Goal"
      } (Updated ${currentDate})`;

      // Clean and format habit titles, removing any bullet points or markers
      const habitTitles = request.newHabits
        .filter((h) => h.title && h.title.trim()) // Only include non-empty habits
        .map((h) => {
          const cleanTitle = h.title.replace(/^[\s]*[•*\-\+]\s*/, "").trim();
          return h.description ? `${cleanTitle}: ${h.description}` : cleanTitle;
        });

      return await createGoal({
        description: updatedDescription,
        habits: habitTitles,
        category_id: request.originalGoal.category_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["habitCompletions"] });
    },
  });
};
