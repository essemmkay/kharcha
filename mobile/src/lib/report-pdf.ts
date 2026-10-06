import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { format } from "date-fns";
import { formatMoney } from "@/lib/money";

// Builds and shares a tax-ready expense report PDF on-device. Replaces the web
// jsPDF version: the report data still comes from local-queries `report()`; here
// it is rendered to print HTML and handed to expo-print, then the share sheet.

export type ReportData = {
  totals: { income: number; expense: number; net: number };
  byCategory: {
    name: string;
    color: string | null;
    income: number;
    expense: number;
  }[];
  byAccount: { name: string; income: number; expense: number }[];
  items: {
    date: Date;
    type: string;
    account: string;
    category: string;
    note: string;
    amount: number;
  }[];
};

export type ReportMeta = {
  userName: string;
  from: Date;
  to: Date;
  currency: string;
};

// Escape user-supplied text so names/notes can't break or inject markup.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReportHtml(data: ReportData, meta: ReportMeta): string {
  const money = (n: number) => formatMoney(n, meta.currency);
  const d = (date: Date) => format(date, "MM/dd/yyyy");
  const range = `${d(meta.from)} to ${d(meta.to)}`;

  const catRows = data.byCategory
    .map(
      (c) =>
        `<tr><td>${esc(c.name)}</td><td class="n">${money(c.income)}</td><td class="n">${money(c.expense)}</td></tr>`,
    )
    .join("");

  const accRows = data.byAccount
    .map(
      (a) =>
        `<tr><td>${esc(a.name)}</td><td class="n">${money(a.income)}</td><td class="n">${money(a.expense)}</td></tr>`,
    )
    .join("");

  const itemRows = data.items
    .map(
      (i) =>
        `<tr><td>${d(i.date)}</td><td>${esc(i.type)}</td><td>${esc(i.account)}</td><td>${esc(i.category)}</td><td>${esc(i.note)}</td><td class="n">${money(i.amount)}</td></tr>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111827; padding: 24px; font-size: 12px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .sub { color: #6b7280; margin: 0 0 16px; }
    h2 { font-size: 14px; margin: 20px 0 6px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; }
    td.n, th.n { text-align: right; white-space: nowrap; }
    .totals td { font-weight: 600; border: none; padding: 2px 8px; }
  </style></head><body>
    <h1>Kharcha Expense Report</h1>
    <p class="sub">${esc(meta.userName)} &middot; ${range}</p>

    <table class="totals">
      <tr><td>Income</td><td class="n">${money(data.totals.income)}</td></tr>
      <tr><td>Expense</td><td class="n">${money(data.totals.expense)}</td></tr>
      <tr><td>Net</td><td class="n">${money(data.totals.net)}</td></tr>
    </table>

    <h2>By category</h2>
    <table><thead><tr><th>Category</th><th class="n">Income</th><th class="n">Expense</th></tr></thead>
    <tbody>${catRows || `<tr><td colspan="3">No activity</td></tr>`}</tbody></table>

    <h2>By account</h2>
    <table><thead><tr><th>Account</th><th class="n">Income</th><th class="n">Expense</th></tr></thead>
    <tbody>${accRows || `<tr><td colspan="3">No activity</td></tr>`}</tbody></table>

    <h2>Transactions</h2>
    <table><thead><tr><th>Date</th><th>Type</th><th>Account</th><th>Category</th><th>Note</th><th class="n">Amount</th></tr></thead>
    <tbody>${itemRows || `<tr><td colspan="6">No transactions</td></tr>`}</tbody></table>
  </body></html>`;
}

// Renders the PDF and opens the native share sheet. Returns an error message on
// failure, null on success.
export async function exportReportPdf(
  data: ReportData,
  meta: ReportMeta,
): Promise<string | null> {
  try {
    const { uri } = await Print.printToFileAsync({
      html: buildReportHtml(data, meta),
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "Kharcha Expense Report",
      });
    }
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not create the PDF";
  }
}
