export const getBaseUrl = () => {
  const isProd = import.meta.env.MODE === "production";

  if (isProd) {
    console.log("Production API URL");
    return "http://130.162.178.62:80";
  }

  return "http://localhost:8080";
};
