import { getBaseUrlForGoals, getAuthHeaders } from "./getBaseUrl";

interface SuggestHabitsRequest {
  goal: string;
}

interface CreateGoalRequest {
  description: string;
  habits: string[];
  category_id: string;
}

interface AsyncProcessResponse {
  process_id: string;
  suggestion_id: string;
  message?: string;
}

interface HabitSuggestions {
  suggestion_id: string;
  customer_id: string;
  goal_description: string;
  habits: string[];
  created_at: string;
}

interface AsyncProcess {
  id: string;
  customer_id: string;
  process_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  input_data?: string;
  result_data?: string[] | object;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface Result<T> {
  data?: T;
  status: number;
  message: string;
  isError: boolean;
}

export const suggestHabits = async ({
  goal,
}: SuggestHabitsRequest): Promise<Result<AsyncProcessResponse>> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${getBaseUrlForGoals()}/me/suggest-habits`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": "text/plain",
    },
    credentials: "include",
    body: goal,
  });

  const responseText = await res.text();
  let parsedData: any;

  try {
    parsedData = JSON.parse(responseText);
  } catch {
    console.warn(
      `Failed to parse response (status ${res.status}):`,
      responseText
    );
    parsedData = null;
  }

  if (res.status === 503) {
    return {
      status: 503,
      message: "System is busy. Please try again later.",
      isError: true,
    };
  }

  if (!res.ok) {
    return {
      status: res.status,
      message:
        parsedData?.message || "Habits suggestion process failed to start",
      isError: true,
    };
  }

  return {
    data: parsedData,
    status: 200,
    message: "Success",
    isError: false,
  };
};

export const getProcessStatus = async (
  processId: string
): Promise<Result<AsyncProcess>> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${getBaseUrlForGoals()}/processes/${processId}`, {
    method: "GET",
    headers: authHeaders,
    credentials: "include",
  });

  const responseText = await res.text();
  let parsedData: any;

  try {
    parsedData = JSON.parse(responseText);
  } catch {
    console.warn(
      `Failed to parse response (status ${res.status}):`,
      responseText
    );
    parsedData = null;
  }

  if (!res.ok) {
    return {
      status: res.status,
      message: parsedData?.message || "Process not found",
      isError: true,
    };
  }

  return {
    data: parsedData,
    status: 200,
    message: "Success",
    isError: false,
  };
};

export const getSuggestions = async (
  suggestionId: string
): Promise<Result<HabitSuggestions>> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${getBaseUrlForGoals()}/suggestions/${suggestionId}`,
    {
      method: "GET",
      headers: authHeaders,
      credentials: "include",
    }
  );

  const responseText = await res.text();
  let parsedData: any;

  try {
    parsedData = JSON.parse(responseText);
  } catch {
    console.warn(
      `Failed to parse response (status ${res.status}):`,
      responseText
    );
    parsedData = null;
  }

  if (res.status === 202) {
    return {
      status: 202,
      message: parsedData?.message || "Process still running",
      isError: false,
    };
  }

  if (res.status === 404) {
    return {
      status: 404,
      message: parsedData?.message || "Suggestions not found",
      isError: true,
    };
  }

  if (res.status === 500) {
    console.error(`Suggestion process failed (500):`, responseText);
    return {
      status: 500,
      message: parsedData?.message || "Internal server error",
      isError: true,
    };
  }

  if (!res.ok) {
    console.error(`Unexpected status code ${res.status}:`, responseText);
    return {
      status: res.status,
      message: parsedData?.message || `Unexpected error: ${res.statusText}`,
      isError: true,
    };
  }

  return {
    data: parsedData,
    status: 200,
    message: "Success",
    isError: false,
  };
};

export const pollForResults = async (
  suggestionId: string,
  config: { maxAttempts?: number; intervalMs?: number } = {}
): Promise<string[]> => {
  const { maxAttempts = 30, intervalMs = 2000 } = config;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getSuggestions(suggestionId);

    // Continue polling for temporary conditions (202, 404)
    if (result.status === 202 || result.status === 404) {
      console.log(
        `Attempt ${attempt + 1}/${maxAttempts}: Status ${
          result.status
        }, waiting ${intervalMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      continue;
    }

    // Throw immediately for permanent errors (500, etc)
    if (result.status >= 500) {
      throw new Error(`Failed to get suggestions: ${result.message}`);
    }

    if (!result.data) {
      throw new Error("Suggestions response contained no data");
    }

    return result.data.habits;
  }

  throw new Error(`Process timed out after ${maxAttempts} attempts`);
};

export const createGoal = async ({
  description,
  habits,
  category_id,
}: CreateGoalRequest) => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${getBaseUrlForGoals()}/me/goals`, {
    method: "POST",
    headers: authHeaders,
    credentials: "include",
    body: JSON.stringify({
      goal_description: description,
      finalised_habits: habits,
      category_id,
    }),
  });
  if (!res.ok) throw new Error("Goal creation failed");

  const data = await res.json();
  return {
    id: data.id,
    description: data.goal_description,
    habits: data.habits,
  };
};

export interface HabitCompletion {
  id: string;
  habit_id: string;
  customer_id: string;
  goal_id: string;
  completion_date: string; // YYYY-MM-DD format
  completed_at: string;
  notes?: string;
}

export interface HabitCompletionWithDetails extends HabitCompletion {
  habit_name: string;
  habit_description: string;
}

export interface HabitCompletionRequest {
  notes?: string;
  completionDate?: string;
}

export const getHabitCompletions = async (
  date?: string // YYYY-MM-DD format, defaults to today
): Promise<HabitCompletionWithDetails[]> => {
  const authHeaders = await getAuthHeaders();
  const url = new URL(`${getBaseUrlForGoals()}/me/completions`);
  if (date) {
    url.searchParams.append("date", date);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: authHeaders,
    credentials: "include",
  });

  if (res.status === 404) {
    throw new Error("Customer not found");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch habit completions: ${res.statusText}`);
  }

  return res.json();
};

export const recordHabitCompletion = async (
  habitId: string,
  request: HabitCompletionRequest = {}
): Promise<HabitCompletion> => {
  const authHeaders = await getAuthHeaders();
  const body: { habit_id: string; notes?: string; completion_date?: string } = {
    habit_id: habitId,
  };
  if (request.notes !== undefined) {
    body.notes = request.notes;
  }
  if (request.completionDate !== undefined) {
    body.completion_date = request.completionDate;
  }

  const res = await fetch(`${getBaseUrlForGoals()}/me/completions`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.status === 404) {
    throw new Error("Customer or habit not found");
  }

  if (res.status === 400) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Invalid input or habit already completed for this date"
    );
  }

  if (!res.ok) {
    throw new Error(`Failed to record habit completion: ${res.statusText}`);
  }

  return res.json();
};

export const deleteHabitCompletion = async (
  completionId: string
): Promise<void> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${getBaseUrlForGoals()}/me/completions/${completionId}`,
    {
      method: "DELETE",
      headers: authHeaders,
      credentials: "include",
    }
  );

  if (res.status === 404) {
    throw new Error("Completion not found");
  }

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(`Failed to delete habit completion: ${res.statusText}`);
  }
};
