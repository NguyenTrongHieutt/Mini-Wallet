export interface ApiEnvelope<T> {
  err: number;
  message: string;
  data?: T;
  code?: string;
}
