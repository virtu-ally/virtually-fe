import { saveCustomerQuiz } from "../customer";
import { useMutation } from "@tanstack/react-query";

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
