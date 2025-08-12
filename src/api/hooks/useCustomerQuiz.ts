import { getCustomerQuiz, saveCustomerQuiz } from "../customer";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useSaveCustomerQuiz = () => {
  return useMutation({
    mutationFn: ({
      customerId,
      quizData,
    }: {
      customerId: string;
      quizData: Record<string, any>;
    }) => saveCustomerQuiz(customerId, quizData),
    onError: (error) => {
      console.error("Failed to save quiz data:", error);
    },
  });
};

export const useGetCustomerQuiz = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ["customerQuiz", customerId],
    queryFn: () => getCustomerQuiz(customerId as string),
    enabled: !!customerId,
  });
};
