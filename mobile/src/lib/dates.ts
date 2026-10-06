import { endOfMonth, startOfMonth } from "date-fns";

export function monthRange(monthParam?: string) {
  const parsed = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
  const month = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return { month, from: startOfMonth(month), to: endOfMonth(month) };
}

export function first<T>(v: T | T[] | undefined): T | undefined {
  return Array.isArray(v) ? v[0] : v;
}
