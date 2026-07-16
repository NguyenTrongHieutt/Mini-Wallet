import { appConfig } from "@/config/app-config";

export interface PaginationQuery {
  page: number;
  pageSize: number;
}

export function parsePositiveInteger(
  value: string | null,
  fallback: number,
  maximum = Number.POSITIVE_INFINITY,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  const integer = Math.floor(parsed);
  return integer > 0 ? Math.min(integer, maximum) : fallback;
}

export function paginationFromSearch(params: URLSearchParams): PaginationQuery {
  return {
    page: parsePositiveInteger(params.get("page"), 1),
    pageSize: parsePositiveInteger(
      params.get("pageSize"),
      appConfig.pagination.defaultPageSize,
      appConfig.pagination.maxPageSize,
    ),
  };
}
