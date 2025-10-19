import { getAuthHeaders, getBaseUrlForGoals } from "./getBaseUrl";

export interface Habit {
  id: string;
  title: string;
}

export interface Goal {
  id: string;
  description: string;
  habits: Habit[];
  category_id: string;
  timeframe?: string;
  created_at?: string;
}

export const getCustomerGoals = async (): Promise<Goal[]> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${getBaseUrlForGoals()}/me/goals`, {
    method: "GET",
    headers: authHeaders,
    credentials: "include",
  });

  if (res.status === 404) {
    return []; // Return empty array instead of throwing error
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch goals: ${res.statusText}`);
  }

  const data = await res.json();
  return data || []; // Handle null response
};

export const getCategorizedGoals = async (
  categoryId: string
): Promise<Goal[]> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${getBaseUrlForGoals()}/me/goals?category=${categoryId}`,
    {
      method: "GET",
      headers: authHeaders,
      credentials: "include",
    }
  );

  if (res.status === 404) {
    throw new Error("Customer not found");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch goals: ${res.statusText}`);
  }

  const data = await res.json();
  return (data as any[]).map((g) => ({
    id: g.id ?? g.goal_id ?? crypto.randomUUID(),
    description: g.description ?? g.goal_description ?? "",
    habits: g.habits ?? g.finalised_habits ?? [],
    category_id: g.category_id ?? "",
    timeframe: g.timeframe,
    created_at: g.created_at,
  }));
};

export const moveGoal = async (
  goalId: string,
  categoryId: string
): Promise<Goal> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${getBaseUrlForGoals()}/me/goals/${goalId}/category`,
    {
      method: "PATCH",
      headers: authHeaders,
      credentials: "include",
      body: JSON.stringify({ category_id: categoryId }),
    }
  );

  if (res.status === 404) {
    throw new Error("Goal or category not found");
  }

  if (!res.ok) {
    throw new Error(`Failed to move goal: ${res.statusText}`);
  }

  const g = await res.json();
  return {
    id: g.id ?? g.goal_id ?? crypto.randomUUID(),
    description: g.description ?? g.goal_description ?? "",
    habits: g.habits ?? g.finalised_habits ?? [],
    category_id: g.category_id ?? "",
    timeframe: g.timeframe,
    created_at: g.created_at,
  };
};
