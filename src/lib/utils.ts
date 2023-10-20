import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: number | string | undefined | null,
  options?: { decimals?: number; emptyValues?: string }
) {
  if (typeof value === "undefined" || value === null) return "";

  const { decimals = 2, emptyValues = "-" } = options ?? {};
  if (isNaN(Number(value)) || (value as unknown) instanceof Date) return value.toString();
  value = Number(value);

  if (value === 0) return emptyValues;

  const formatter = Intl.NumberFormat("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return formatter.format(value);
}
