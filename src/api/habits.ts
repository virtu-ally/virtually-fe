interface SuggestHabitsRequest {
  customerId: string;
  goal: string;
}

interface CreateGoalRequest {
  customerId: string;
  description: string;
  habits: string[];
}

export const suggestHabits = async ({
  customerId,
  goal,
}: SuggestHabitsRequest) => {
  const res = await fetch(
    `http://localhost:8081/customers/${customerId}/suggest-habits`,
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      credentials: "include",
      body: goal,
    }
  );
  if (!res.ok) throw new Error("Habits creation failed");
  return res.json();
};

export const createGoal = async ({
  customerId,
  description,
  habits,
}: CreateGoalRequest) => {
  const res = await fetch(
    `http://localhost:8081/customers/${customerId}/goals`,
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
