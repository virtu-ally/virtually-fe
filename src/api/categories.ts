import { getBaseUrlForGoals, getAuthHeaders } from "./getBaseUrl";

export interface Category {
  id: string;
  customer_id: string;
  name: string;
  created_at: string;
}

export const getCategories = async (): Promise<Category[]> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${getBaseUrlForGoals()}/me/categories`, {
    method: "GET",
    headers: authHeaders,
    credentials: "include",
  });

  if (res.status === 404) {
    throw new Error("Customer not found");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.statusText}`);
  }

  return res.json();
};

export const createCategory = async (name: string): Promise<Category> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${getBaseUrlForGoals()}/me/categories`, {
    method: "POST",
    headers: authHeaders,
    credentials: "include",
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create category: ${res.statusText}`);
  }

  return res.json();
};

export const updateCategory = async (
  categoryId: string,
  name: string
): Promise<Category> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${getBaseUrlForGoals()}/me/categories/${categoryId}`,
    {
      method: "PUT",
      headers: authHeaders,
      credentials: "include",
      body: JSON.stringify({ name }),
    }
  );

  if (res.status === 404) {
    throw new Error("Category not found");
  }

  if (!res.ok) {
    throw new Error(`Failed to update category: ${res.statusText}`);
  }

  return res.json();
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${getBaseUrlForGoals()}/me/categories/${categoryId}`,
    {
      method: "DELETE",
      headers: authHeaders,
      credentials: "include",
    }
  );

  if (res.status === 404) {
    throw new Error("Category not found");
  }

  if (!res.ok) {
    throw new Error(`Failed to delete category: ${res.statusText}`);
  }
};
