"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";

export function IncomeExpenseBar({
  data,
  currency,
}: {
  data: { label: string; income: number; expense: number }[];
  currency: string;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="var(--color-muted-foreground)"
          />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
            formatter={(value, name) => [
              formatMoney(Number(value), currency),
              name === "income" ? "Income" : "Expense",
            ]}
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              color: "var(--color-popover-foreground)",
            }}
          />
          <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
