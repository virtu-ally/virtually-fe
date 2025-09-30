import { getCustomerQuiz, saveCustomerQuiz } from "../customer";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useSaveCustomerQuiz = () => {
  return useMutation({
    mutationFn: (quizData: Record<string, any>) => saveCustomerQuiz(quizData),
    onError: (error) => {
      console.error("Failed to save quiz data:", error);
    },
  });
};

export const useGetCustomerQuiz = () => {
  return useQuery({
    queryKey: ["customerQuiz"],
    queryFn: () => getCustomerQuiz(),
  });
};
