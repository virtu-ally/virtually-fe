import { getBaseUrl } from "./getBaseUrl";

export const signup = async (form: {
  first_name: string;
  last_name: string;
  email: string;
}) => {
  const res = await fetch(`${getBaseUrl()}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(form),
  });
  if (!res.ok) throw new Error("Signup failed");
  return res.json();
};

export const login = async ({ id }) => {
  const res = await fetch(`${getBaseUrl()}/customers/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
};

export const getCustomerByEmail = async (email: string) => {
  const res = await fetch(`${getBaseUrl()}/customers/${email}?byEmail=true`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Customer not found");
  return res.json();
};

export interface CustomerQuiz {
  id: string;
  customer_id: string;
  quiz_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const saveCustomerQuiz = async (
  customerId: string,
  quizData: Record<string, any>
): Promise<CustomerQuiz> => {
  const response = await fetch(`${getBaseUrl()}/customers/${customerId}/quiz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quizData),
  });

  if (!response.ok) {
    throw new Error(`Failed to save quiz data: ${response.statusText}`);
  }

  return response.json();
};

export const getCustomerQuiz = async (
  customerId: string
): Promise<CustomerQuiz | null> => {
  const response = await fetch(`${getBaseUrl()}/customers/${customerId}/quiz`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (response.status === 404) {
    // Quiz not found - customer hasn't completed it yet
    return null;
  }

  if (response.status === 400) {
    throw new Error("Invalid customer identifier");
  }

  if (response.status === 500) {
    throw new Error("Internal server error");
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch quiz data: ${response.statusText}`);
  }

  return response.json();
};
