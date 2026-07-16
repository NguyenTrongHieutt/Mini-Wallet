import { useQuery } from "@tanstack/react-query";
import { appConfig } from "@/config/app-config";
import { customerKeys } from "@/customer/api/customer-auth-api";
import { customerWalletApi } from "./customer-wallet-api";

export function useCustomerWallet(currency = appConfig.defaultCurrency) {
  const normalizedCurrency = currency.toUpperCase();
  return useQuery({
    queryKey: customerKeys.wallet(normalizedCurrency),
    queryFn: async () => (await customerWalletApi.balance(normalizedCurrency)).pocket,
  });
}
