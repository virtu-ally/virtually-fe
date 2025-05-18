export const signup = async (form: {
  first_name: string;
  last_name: string;
  email: string;
}) => {
  const res = await fetch("http://localhost:8080/customers", {
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
  const res = await fetch(`http://localhost:8080/customers/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
};
