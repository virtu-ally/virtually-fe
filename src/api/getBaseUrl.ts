export const getBaseUrl = () => {
  const isProd = import.meta.env.MODE === "production";
  const prodUrl = import.meta.env.VITE_API_URL;

  if (isProd && !prodUrl) {
    console.error("Production API URL is not defined", prodUrl);
    return "http://130.162.178.62:80";
  }

  return isProd ? prodUrl : "http://localhost:8080";
};
