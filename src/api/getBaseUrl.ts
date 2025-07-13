export const getBaseUrl = () => {
  const isProd = import.meta.env.MODE === "production";
  const API_BASE_URL =
    "https://c2eh9ev9bi.execute-api.eu-west-2.amazonaws.com/prod";
  return API_BASE_URL;
  // if (isProd) {
  //   const API_BASE_URL =
  //     "https://c2eh9ev9bi.execute-api.eu-west-2.amazonaws.com/prod";
  //   return API_BASE_URL;
  // }

  // return "http://localhost:8080";
};

export const getBaseUrlForGoals = () => {
  const isProd = import.meta.env.MODE === "production";
  const API_BASE_URL =
    "https://c2eh9ev9bi.execute-api.eu-west-2.amazonaws.com/prod";
  return API_BASE_URL;
  // if (isProd) {
  //   console.log("Production API URL");
  //   return "http://130.162.178.62";
  // }

  // return "http://localhost:8081";
};
