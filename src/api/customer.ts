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
  const res = await fetch(`${getBaseUrl()}/customers/by-email/${email}`, {
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
