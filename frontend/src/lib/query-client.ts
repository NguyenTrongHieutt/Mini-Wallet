import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const code = error && typeof error === "object" && "code" in error ? Number(error.code) : 0;
        return code !== 401 && code !== 403 && failureCount < 1;
      },
    },
    mutations: { retry: false },
  },
});
