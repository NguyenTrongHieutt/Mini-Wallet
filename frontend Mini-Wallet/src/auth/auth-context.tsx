import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, type PropsWithChildren } from "react";
import { ApiError, apiPost, AUTH_EXPIRED_EVENT } from "@/lib/api";
import type { LoginPayload, LoginResult, Officer, OfficerSession } from "@/types/auth";

const authKeys = { session: ["auth", "session"] as const };

interface AuthContextValue {
  officer: Officer | null;
  status: "loading" | "authenticated" | "anonymous" | "error";
  error: Error | null;
  login: (payload: LoginPayload) => Promise<Officer>;
  logout: () => Promise<void>;
  retrySession: () => Promise<unknown>;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadSession(): Promise<Officer | null> {
  try {
    const data = await apiPost<OfficerSession>("/api/v1/officer/me");
    return data.officer;
  } catch (error) {
    if (error instanceof ApiError && (error.code === 401 || error.code === 403)) return null;
    throw error;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: authKeys.session, queryFn: loadSession });

  useEffect(() => {
    const expireSession = () => queryClient.setQueryData(authKeys.session, null);
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => apiPost<LoginResult>("/api/v1/officer/auth/login", payload),
    onSuccess: (data) => queryClient.setQueryData(authKeys.session, data.officer),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiPost<null>("/api/v1/officer/auth/logout"),
    onSettled: () => {
      queryClient.setQueryData(authKeys.session, null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" });
    },
  });

  const officer = session.data ?? null;
  const status = session.isPending
    ? "loading"
    : session.isError
      ? "error"
      : officer
        ? "authenticated"
        : "anonymous";

  return (
    <AuthContext.Provider
      value={{
        officer,
        status,
        error: session.error,
        login: async (payload) => (await loginMutation.mutateAsync(payload)).officer,
        logout: async () => { await logoutMutation.mutateAsync(); },
        retrySession: session.refetch,
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
