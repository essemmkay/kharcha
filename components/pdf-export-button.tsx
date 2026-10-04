"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { buildReportPdf, type ReportData, type ReportMeta } from "@/lib/report-pdf";
import { Button } from "@/components/ui/button";

export function PdfExportButton({
  data,
  meta,
}: {
  data: ReportData;
  meta: ReportMeta;
}) {
  const [pending, setPending] = useState(false);

  async function onExport() {
    setPending(true);
    try {
      const doc = buildReportPdf(data, meta);
      const blob = doc.output("blob");
      const filename = `kharcha-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });

      if (
        typeof navigator !== "undefined" &&
        navigator.canShare?.({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title: "Kharcha report" });
          return;
        } catch (err) {
          if ((err as Error)?.name === "AbortError") return;
          // Fall through to download if sharing fails.
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not generate the PDF");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button onClick={onExport} disabled={pending} className="w-full">
      <FileDown className="size-4" />
      {pending ? "Preparing…" : "Export PDF"}
    </Button>
  );
}
