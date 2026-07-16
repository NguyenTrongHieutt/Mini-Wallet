import { useQuery } from "@tanstack/react-query";
import { customerKeys } from "@/customer/api/customer-auth-api";
import { customerWalletApi } from "./customer-wallet-api";

export function useCustomerWallet(currency = "VND") {
  const normalizedCurrency = currency.toUpperCase();
  return useQuery({
    queryKey: customerKeys.wallet(normalizedCurrency),
    queryFn: async () => (await customerWalletApi.balance(normalizedCurrency)).pocket,
  });
}

