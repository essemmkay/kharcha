"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { useLocalData } from "@/lib/db/use-local-data";
import { report as buildReport } from "@/lib/local-queries";
import { monthRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { ReportControls } from "@/components/report-controls";
import { PdfExportButton } from "@/components/pdf-export-button";
import { EmptyState } from "@/components/empty-state";
import { PageLoading } from "@/components/page-loading";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsPage() {
  const sp = useSearchParams();
  const { ready, accounts, categories, transactions, baseCurrency: cur, email, name } =
    useLocalData();

  const { from: defFrom, to: defTo } = monthRange();
  const fromStr = sp.get("from") || format(defFrom, "yyyy-MM-dd");
  const toStr = sp.get("to") || format(defTo, "yyyy-MM-dd");
  const accountId = sp.get("account") || undefined;
  const type = (sp.get("type") as "INCOME" | "EXPENSE" | null) || undefined;

  const { report, accountOptions } = useMemo(() => {
    const from = new Date(`${fromStr}T00:00:00`);
    const to = new Date(`${toStr}T23:59:59`);
    return {
      report: buildReport(transactions, accounts, categories, from, to, {
        accountId,
        type,
      }),
      accountOptions: accounts
        .filter((a) => !a.deletedAt)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((a) => ({ id: a.id, name: a.name })),
    };
  }, [transactions, accounts, categories, fromStr, toStr, accountId, type]);

  if (!ready) return <PageLoading />;

  const meta = {
    userName: name ?? email ?? "",
    from: fromStr,
    to: toStr,
    currency: cur,
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Reports</h1>

      <ReportControls from={fromStr} to={toStr} accounts={accountOptions} />

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
