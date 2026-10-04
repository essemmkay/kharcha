import type { ZodError } from "zod";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export function zodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
