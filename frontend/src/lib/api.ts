export interface ApiEnvelope<T> {
  err: number;
  message: string;
  data: T;
}

export interface ApiFieldError {
  field?: string;
  message?: string;
  messageKey?: string;
}

export class ApiError extends Error {
  readonly code: number;
  readonly data: unknown;
  readonly cause?: unknown;

  constructor(message: string, code = 500, data?: unknown, cause?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.data = data;
    this.cause = cause;
  }

  get fieldErrors(): ApiFieldError[] {
    if (!this.data || typeof this.data !== "object") return [];
    const errors = (this.data as { errors?: unknown }).errors;
    return Array.isArray(errors) ? (errors as ApiFieldError[]) : [];
  }
}

export const AUTH_EXPIRED_EVENT = "mini-wallet:auth-expired";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { err?: unknown }).err === "number" &&
      typeof (value as { message?: unknown }).message === "string" &&
      "data" in value,
  );
}

function notifyAuthExpired(code: number) {
  if ((code === 401 || code === 403) && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

export async function apiPost<T>(path: string, body: unknown = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new ApiError("Không thể kết nối đến máy chủ. Vui lòng thử lại.", 0, undefined, cause);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (cause) {
    throw new ApiError("Máy chủ trả về dữ liệu không hợp lệ.", response.status, undefined, cause);
  }

  if (!isEnvelope(payload)) {
    throw new ApiError("Phản hồi từ máy chủ không đúng định dạng.", response.status, payload);
  }

  if (!response.ok || payload.err !== 200) {
    const code = payload.err || response.status;
    notifyAuthExpired(code);
    throw new ApiError(payload.message || "Yêu cầu không thành công.", code, payload.data);
  }

  return payload.data as T;
}
