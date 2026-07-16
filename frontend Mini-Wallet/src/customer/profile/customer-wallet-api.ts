import { apiPost } from "@/lib/api";
import type { CustomerPocket } from "@/customer/types";

export interface CustomerWalletBalanceData {
  pocket: CustomerPocket;
}

export const customerWalletApi = {
  balance: (currency = "VND") =>
    apiPost<CustomerWalletBalanceData>("/api/v1/customer/wallet/balance", {
      currency: currency.toUpperCase(),
    }),
};

