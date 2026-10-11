// Money helpers. Amounts are stored as Decimal(14,2) in Postgres and arrive as
// Prisma Decimal objects; coerce to number only at the display/aggregation edge.
// Scale (cents) keeps values well within Number's safe integer range for
// personal-finance totals.

type Decimalish = { toString(): string } | number | string | null | undefined;

export function toNumber(value: Decimalish): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: Decimalish, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

// Signed display for a transaction amount given its type.
export function signedMoney(
  value: Decimalish,
  type: "INCOME" | "EXPENSE" | "TRANSFER",
  currency = "USD",
): string {
  const n = toNumber(value);
  const sign = type === "INCOME" ? "+" : type === "EXPENSE" ? "-" : "";
  return `${sign}${formatMoney(n, currency)}`;
}
