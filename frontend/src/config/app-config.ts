export interface AppConfig {
  api: {
    baseUrl: string;
  };
  locale: string;
  defaultCurrency: string;
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
    providerSuggestionsPageSize: number;
  };
  query: {
    staleTimeMs: number;
  };
}

export const appConfig: Readonly<AppConfig> = Object.freeze({
  api: Object.freeze({
    baseUrl: (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, ""),
  }),
  locale: "vi-VN",
  defaultCurrency: "VND",
  pagination: Object.freeze({
    defaultPageSize: 20,
    maxPageSize: 100,
    providerSuggestionsPageSize: 20,
  }),
  query: Object.freeze({
    staleTimeMs: 30_000,
  }),
});
