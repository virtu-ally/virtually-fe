export const getBaseUrl = () => {
  const isProd = import.meta.env.MODE === "production";

  if (isProd) {
    console.log("Production API URL");
    return "http://130.162.178.62";
  }

  return "http://localhost:8080";
};
