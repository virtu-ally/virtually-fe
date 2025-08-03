import { getBaseUrl, getBaseUrlForGoals } from "./getBaseUrl";

interface SuggestHabitsRequest {
  customerId: string;
  goal: string;
}

interface CreateGoalRequest {
  customerId: string;
  description: string;
  habits: string[];
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
  customerId,
  goal,
}: SuggestHabitsRequest): Promise<Result<AsyncProcessResponse>> => {
  const res = await fetch(
    `${getBaseUrlForGoals()}/customers/${customerId}/suggest-habits`,
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      credentials: "include",
      body: goal,
    }
  );

  const responseText = await res.text();
  let parsedData: any;
  
  try {
    parsedData = JSON.parse(responseText);
  } catch {
    console.warn(`Failed to parse response (status ${res.status}):`, responseText);
    parsedData = null;
  }

  if (res.status === 503) {
    return {
      status: 503,
      message: "System is busy. Please try again later.",
      isError: true
    };
  }

  if (!res.ok) {
    return {
      status: res.status,
      message: parsedData?.message || "Habits suggestion process failed to start",
      isError: true
    };
  }

  return {
    data: parsedData,
    status: 200,
    message: "Success",
    isError: false
  };
};

export const getProcessStatus = async (processId: string): Promise<Result<AsyncProcess>> => {
  const res = await fetch(
    `${getBaseUrlForGoals()}/processes/${processId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const responseText = await res.text();
  let parsedData: any;
  
  try {
    parsedData = JSON.parse(responseText);
  } catch {
    console.warn(`Failed to parse response (status ${res.status}):`, responseText);
    parsedData = null;
  }

  if (!res.ok) {
    return {
      status: res.status,
      message: parsedData?.message || "Process not found",
      isError: true
    };
  }

  return {
    data: parsedData,
    status: 200,
    message: "Success",
    isError: false
  };
};

export const getSuggestions = async (suggestionId: string): Promise<Result<HabitSuggestions>> => {
  const res = await fetch(
    `${getBaseUrlForGoals()}/suggestions/${suggestionId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const responseText = await res.text();
  let parsedData: any;
  
  try {
    parsedData = JSON.parse(responseText);
  } catch {
    console.warn(`Failed to parse response (status ${res.status}):`, responseText);
    parsedData = null;
  }

  if (res.status === 202) {
    return {
      status: 202,
      message: parsedData?.message || "Process still running",
      isError: false
    };
  }

  if (res.status === 404) {
    return {
      status: 404,
      message: parsedData?.message || "Suggestions not found",
      isError: true
    };
  }

  if (res.status === 500) {
    console.error(`Suggestion process failed (500):`, responseText);
    return {
      status: 500,
      message: parsedData?.message || "Internal server error",
      isError: true
    };
  }

  if (!res.ok) {
    console.error(`Unexpected status code ${res.status}:`, responseText);
    return {
      status: res.status,
      message: parsedData?.message || `Unexpected error: ${res.statusText}`,
      isError: true
    };
  }

  return {
    data: parsedData,
    status: 200,
    message: "Success",
    isError: false
  };
};

export const pollForResults = async (
  suggestionId: string,
  config: { maxAttempts?: number; intervalMs?: number } = {}
): Promise<string[]> => {
  const { maxAttempts = 30, intervalMs = 2000 } = config;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getSuggestions(suggestionId);
    
    if (result.status === 202) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      continue;
    }
    
    if (result.isError) {
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
  customerId,
  description,
  habits,
}: CreateGoalRequest) => {
  const res = await fetch(
    `${getBaseUrlForGoals()}/customers/${customerId}/goals`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        goal_description: description,
        finalised_habits: habits,
      }),
    }
  );
  if (!res.ok) throw new Error("Goal creation failed");
  return res.json();
};
