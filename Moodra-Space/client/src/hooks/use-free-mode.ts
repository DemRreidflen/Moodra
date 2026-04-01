import { useQueryClient } from "@tanstack/react-query";

export function useFreeMode() {
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData<any>(["/api/auth/user"]);
  const isFreeMode = !user?.openaiApiKey;
  return { isFreeMode };
}
