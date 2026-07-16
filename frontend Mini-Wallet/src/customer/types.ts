export interface Customer {
  id: string;
  phone: string;
  displayName: string;
  status: "active" | "locked" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerSession {
  customer: Customer;
}

export interface CustomerAuthInfo {
  expiresAt: string;
  tokenType: "Bearer" | string;
}

export interface CustomerLoginPayload {
  phone: string;
  password: string;
}

export interface CustomerRegisterPayload extends CustomerLoginPayload {
  pin: string;
  displayName?: string;
  currency: "VND";
}

export interface CustomerLoginResult extends CustomerSession {
  auth: CustomerAuthInfo;
}

export interface CustomerCurrency {
  code: string;
  name?: string;
  minorUnit?: number;
}

export interface CustomerPocket {
  id: string;
  name: string;
  balance: number;
  currency: CustomerCurrency | string;
  status: "active" | "locked" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerRegisterResult extends CustomerLoginResult {
  pocket: CustomerPocket;
}
