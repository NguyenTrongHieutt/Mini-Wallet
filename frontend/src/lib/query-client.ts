import { QueryClient } from "@tanstack/react-query";
import { appConfig } from "@/config/app-config";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: appConfig.query.staleTimeMs,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const code = error && typeof error === "object" && "code" in error ? Number(error.code) : 0;
        return code !== 401 && code !== 403 && failureCount < 1;
      },
    },
    mutations: { retry: false },
  },
});
