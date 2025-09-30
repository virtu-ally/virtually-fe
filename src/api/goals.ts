import { getBaseUrlForGoals, getAuthHeaders } from "./getBaseUrl";

export interface Habit {
  id: string;
  title: string;
}

export interface Goal {
  id: string;
  description: string;
  habits: Habit[];
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
    // Customer not found → surface a clear error
    throw new Error("Customer not found");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch goals: ${res.statusText}`);
  }

  // Normalize API shape to the app's Goal interface if backend uses different keys
  const data = await res.json();
  return (data as any[]).map((g) => ({
    id: g.id ?? g.goal_id ?? crypto.randomUUID(),
    description: g.description ?? g.goal_description ?? "",
    habits: g.habits ?? g.finalised_habits ?? [],
    timeframe: g.timeframe,
    created_at: g.created_at,
  }));
};
