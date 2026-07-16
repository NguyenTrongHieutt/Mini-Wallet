import { appConfig } from "@/config/app-config";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(appConfig.locale).format(value);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(appConfig.locale, {
        dateStyle: "short",
        timeStyle: "medium",
      }).format(date);
}

export function formatDateOnly(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(appConfig.locale).format(date);
}
