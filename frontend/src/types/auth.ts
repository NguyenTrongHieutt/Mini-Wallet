export interface Officer {
  id: string;
  phone: string;
  displayName: string;
  status: "active" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfficerSession {
  officer: Officer;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface LoginResult extends OfficerSession {
  auth: {
    accessToken: string;
    expiresAt: string;
    tokenType: "Bearer" | string;
  };
}
