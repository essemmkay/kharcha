import { format } from "date-fns";
import { FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReport } from "@/lib/queries";
import { monthRange, first } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { ReportControls } from "@/components/report-controls";
import { PdfExportButton } from "@/components/pdf-export-button";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import type { SearchParams } from "@/lib/types";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const cur = user.baseCurrency;

  const { from: defFrom, to: defTo } = monthRange();
  const fromStr = first(sp.from) || format(defFrom, "yyyy-MM-dd");
  const toStr = first(sp.to) || format(defTo, "yyyy-MM-dd");
  const from = new Date(`${fromStr}T00:00:00`);
  const to = new Date(`${toStr}T23:59:59`);
  const accountId = first(sp.account) || undefined;
  const type = first(sp.type) as "INCOME" | "EXPENSE" | undefined;

  const [accounts, report] = await Promise.all([
    prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    getReport(user.id, from, to, { accountId, type }),
  ]);

  const meta = {
    userName: user.name ?? user.email,
    from: fromStr,
    to: toStr,
    currency: cur,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Reports</h1>

      <ReportControls from={fromStr} to={toStr} accounts={accounts} />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Income" value={formatMoney(report.totals.income, cur)} tint="text-income" />
        <Stat label="Expense" value={formatMoney(report.totals.expense, cur)} tint="text-expense" />
        <Stat label="Net" value={formatMoney(report.totals.net, cur)} />
      </div>

      {report.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No transactions in this range"
          description="Adjust the dates or filters above."
        />
      ) : (
        <>
          <Section title="By category">
            {report.byCategory.map((c) => (
              <Row key={c.name} name={c.name} value={c.expense + c.income} cur={cur} />
            ))}
          </Section>

          <Section title="By account">
            {report.byAccount.map((a) => (
              <Row key={a.name} name={a.name} value={a.expense + a.income} cur={cur} />
            ))}
          </Section>

          <Section title={`Itemized (${report.items.length})`}>
            {report.items.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate">
                    {t.category}
                    <span className="text-muted-foreground"> · {t.account}</span>
                  </p>
                  <p className="text-xs text-muted-foreground tabular">
                    {format(new Date(t.date), "MM/dd/yyyy")}
                    {t.note ? ` · ${t.note}` : ""}
                  </p>
                </div>
                <span
                  className={`tabular font-medium ${t.type === "INCOME" ? "text-income" : "text-expense"}`}
                >
                  {formatMoney(t.amount, cur)}
                </span>
              </div>
            ))}
          </Section>

          <PdfExportButton data={report} meta={meta} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold tabular ${tint ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3">
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function Row({ name, value, cur }: { name: string; value: number; cur: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="truncate">{name}</span>
      <span className="tabular font-medium">{formatMoney(value, cur)}</span>
    </div>
  );
}
