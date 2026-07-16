import { apiPost } from "@/lib/api";
import type {
  CustomerLoginPayload,
  CustomerLoginResult,
  CustomerRegisterPayload,
  CustomerRegisterResult,
  CustomerSession,
} from "@/customer/types";

export const customerKeys = {
  all: ["customer-portal"] as const,
  session: ["customer-portal", "session"] as const,
  wallet: (currency: string) => ["customer-portal", "wallet", currency.toUpperCase()] as const,
};

export const customerAuthApi = {
  me: () => apiPost<CustomerSession>("/api/v1/customer/me"),
  login: (payload: CustomerLoginPayload) =>
    apiPost<CustomerLoginResult>("/api/v1/customer/auth/login", payload),
  register: (payload: CustomerRegisterPayload) =>
    apiPost<CustomerRegisterResult>("/api/v1/customer/auth/register", payload),
  logout: () => apiPost<null>("/api/v1/customer/auth/logout"),
};
