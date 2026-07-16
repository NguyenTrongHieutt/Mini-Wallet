import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, type PropsWithChildren } from "react";
import { appConfig } from "@/config/app-config";
import { customerAuthApi, customerKeys } from "@/customer/api/customer-auth-api";
import type {
  Customer,
  CustomerLoginPayload,
  CustomerRegisterPayload,
  CustomerRegisterResult,
} from "@/customer/types";
import { ApiError, AUTH_EXPIRED_EVENT } from "@/lib/api";

interface CustomerAuthContextValue {
  customer: Customer | null;
  status: "loading" | "authenticated" | "anonymous" | "error";
  error: Error | null;
  login: (payload: CustomerLoginPayload) => Promise<Customer>;
  register: (payload: CustomerRegisterPayload) => Promise<CustomerRegisterResult>;
  logout: () => Promise<void>;
  retrySession: () => Promise<unknown>;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isLoggingOut: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

async function loadCustomerSession(): Promise<Customer | null> {
  try {
    return (await customerAuthApi.me()).customer;
  } catch (error) {
    if (error instanceof ApiError && (error.code === 401 || error.code === 403)) return null;
    throw error;
  }
}

export function CustomerAuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: customerKeys.session,
    queryFn: loadCustomerSession,
  });

  useEffect(() => {
    const expireSession = () => queryClient.setQueryData(customerKeys.session, null);
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: customerAuthApi.login,
    onSuccess: (data) => queryClient.setQueryData(customerKeys.session, data.customer),
  });

  const registerMutation = useMutation({
    mutationFn: customerAuthApi.register,
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.session, data.customer);
      queryClient.setQueryData(customerKeys.wallet(appConfig.defaultCurrency), data.pocket);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: customerAuthApi.logout,
    onSettled: async () => {
      await queryClient.cancelQueries({ queryKey: customerKeys.all });
      queryClient.setQueryData(customerKeys.session, null);
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === customerKeys.all[0] &&
          query.queryKey[1] !== customerKeys.session[1],
      });
    },
  });

  const customer = session.data ?? null;
  const status = session.isPending
    ? "loading"
    : session.isError
      ? "error"
      : customer
        ? "authenticated"
        : "anonymous";

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        status,
        error: session.error,
        login: async (payload) => (await loginMutation.mutateAsync(payload)).customer,
        register: (payload) => registerMutation.mutateAsync(payload),
        logout: async () => { await logoutMutation.mutateAsync(); },
        retrySession: session.refetch,
        isLoggingIn: loginMutation.isPending,
        isRegistering: registerMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
  return context;
}
