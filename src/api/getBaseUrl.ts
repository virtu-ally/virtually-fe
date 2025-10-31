import { auth } from "../firebase";

export const getBaseUrl = () => {
  const isProd = import.meta.env.MODE === "production";

  if (isProd) {
    const API_BASE_URL =
      "https://c2eh9ev9bi.execute-api.eu-west-2.amazonaws.com/prod";
    return API_BASE_URL;
  }

  return "http://localhost:8080";
};

export const getBaseUrlForGoals = () => {
  const isProd = import.meta.env.MODE === "production";
  const API_BASE_URL =
    "https://c2eh9ev9bi.execute-api.eu-west-2.amazonaws.com/prod";
  if (isProd) {
    return API_BASE_URL;
  }

  return "http://localhost:8080";
};

export const getAuthHeaders = async (
  retryCount = 0
): Promise<Record<string, string>> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Force token refresh on first attempt or retries
    const forceRefresh = retryCount > 0;
    const token = await user.getIdToken(forceRefresh);

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error(
      `Failed to get auth token (attempt ${retryCount + 1}):`,
      error
    );

    // Retry up to 2 times with exponential backoff
    if (retryCount < 2) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      );
      return getAuthHeaders(retryCount + 1);
    }

    throw new Error("Failed to get authentication token after retries");
  }
};
