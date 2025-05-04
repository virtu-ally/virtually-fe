import "./index.css";

import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Create a client
const queryClient = new QueryClient();
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/virtually-fe/">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
