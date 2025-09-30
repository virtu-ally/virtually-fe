import { getBaseUrl, getAuthHeaders } from "./getBaseUrl";

export const signup = async (form: {
  first_name: string;
  last_name: string;
  email: string;
}) => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${getBaseUrl()}/me`, {
    method: "POST",
    headers: authHeaders,
    credentials: "include",
    body: JSON.stringify(form),
  });
  if (!res.ok) throw new Error("Signup failed");
  return res.json();
};

export const login = async () => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${getBaseUrl()}/me`, {
    method: "GET",
    headers: authHeaders,
  });
  if (!res.ok) throw new Error("Login failed");
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
  quizData: Record<string, any>
): Promise<CustomerQuiz> => {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${getBaseUrl()}/me/quiz`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(quizData),
  });

  if (!response.ok) {
    throw new Error(`Failed to save quiz data: ${response.statusText}`);
  }

  return response.json();
};

export const getCustomerQuiz = async (): Promise<CustomerQuiz | null> => {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${getBaseUrl()}/me/quiz`, {
    method: "GET",
    headers: authHeaders,
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
