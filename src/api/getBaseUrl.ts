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

  return "http://localhost:8081";
};
