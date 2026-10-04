import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatMoney } from "@/lib/money";

export type ReportData = {
  totals: { income: number; expense: number; net: number };
  byCategory: { name: string; income: number; expense: number }[];
  byAccount: { name: string; income: number; expense: number }[];
  items: {
    date: string | Date;
    type: string;
    account: string;
    category: string;
    note: string;
    amount: number;
  }[];
};

export type ReportMeta = {
  userName: string;
  from: string | Date;
  to: string | Date;
  currency: string;
};

// Builds a tax-ready expense report PDF entirely in the browser.
export function buildReportPdf(data: ReportData, meta: ReportMeta): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const cur = meta.currency;
  const money = (n: number) => formatMoney(n, cur);
  const range = `${format(new Date(meta.from), "MM/dd/yyyy")} to ${format(
    new Date(meta.to),
    "MM/dd/yyyy",
  )}`;

  doc.setFontSize(18);
  doc.text("Kharcha Expense Report", 40, 48);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(meta.userName || "Account holder", 40, 66);
  doc.text(`Period: ${range}`, 40, 80);
  doc.text(`Generated: ${format(new Date(), "MM/dd/yyyy")}`, 40, 94);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 112,
    head: [["Summary", "Amount"]],
    body: [
      ["Total income", money(data.totals.income)],
      ["Total expense", money(data.totals.expense)],
      ["Net", money(data.totals.net)],
    ],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  autoTable(doc, {
    startY: lastY(doc) + 18,
    head: [["Category", "Income", "Expense"]],
    body: data.byCategory.map((c) => [c.name, money(c.income), money(c.expense)]),
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
  });

  autoTable(doc, {
    startY: lastY(doc) + 18,
    head: [["Account", "Income", "Expense"]],
    body: data.byAccount.map((a) => [a.name, money(a.income), money(a.expense)]),
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
  });

  autoTable(doc, {
    startY: lastY(doc) + 18,
    head: [["Date", "Type", "Account", "Category", "Note", "Amount"]],
    body: data.items.map((t) => [
      format(new Date(t.date), "MM/dd/yyyy"),
      t.type.charAt(0) + t.type.slice(1).toLowerCase(),
      t.account,
      t.category,
      t.note,
      money(t.amount),
    ]),
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
    foot: [["", "", "", "", "Grand total (net)", money(data.totals.net)]],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
  });

  return doc;
}

function lastY(doc: jsPDF): number {
  // jspdf-autotable attaches lastAutoTable to the doc instance.
  const d = doc as unknown as { lastAutoTable?: { finalY: number } };
  return d.lastAutoTable?.finalY ?? 112;
}
