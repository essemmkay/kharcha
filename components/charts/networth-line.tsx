"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";

export function NetWorthLine({
  data,
  currency,
}: {
  data: { label: string; value: number }[];
  currency: string;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="var(--color-muted-foreground)"
          />
          <Tooltip
            formatter={(value) => [formatMoney(Number(value), currency), "Net worth"]}
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              color: "var(--color-popover-foreground)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            fill="url(#nw)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
