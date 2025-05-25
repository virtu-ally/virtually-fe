export const getBaseUrl = () => {
  const isProd = import.meta.env.MODE === "production";
  return isProd ? import.meta.env.VITE_API_PROD_URL : "http://localhost:8080";
};
