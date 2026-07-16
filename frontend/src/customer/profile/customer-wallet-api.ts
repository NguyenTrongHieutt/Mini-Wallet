import { apiPost } from "@/lib/api";
import { appConfig } from "@/config/app-config";
import type { CustomerPocket } from "@/customer/types";

export interface CustomerWalletBalanceData {
  pocket: CustomerPocket;
}

export const customerWalletApi = {
  balance: (currency = appConfig.defaultCurrency) =>
    apiPost<CustomerWalletBalanceData>("/api/v1/customer/wallet/balance", {
      currency: currency.toUpperCase(),
    }),
};
