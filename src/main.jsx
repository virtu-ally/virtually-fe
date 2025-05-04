import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App.jsx";
import { HashRouter } from "react-router-dom";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const queryClient = new QueryClient();
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HashRouter>
  </StrictMode>
);
