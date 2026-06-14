import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Download, Eye, Trash2, FileBarChart, History } from "lucide-react";
import { reportService, downloadBlob } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader, ConfirmDialog } from "@/components/common";
import { PdfViewDialog } from "@/components/reports/PdfViewDialog";
import { formatDate, formatDateTime } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { ReportHistoryResponse, ReportRequest } from "@/types";
import toast from "react-hot-toast";

const schema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});
type FormData = z.infer<typeof schema>;

// What's currently shown in the view dialog
interface ViewTarget {
  title: string;
  filename: string;
  fetchPdf: () => Promise<Blob>;
}

export default function ReportsPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewTarget, setViewTarget] = useState<ViewTarget | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { data: historyRes, isLoading } = useQuery({
    queryKey: ["report-history"],
    queryFn: () => reportService.getHistory(),
  });
  const history = historyRes?.data?.data ?? [];

  const downloadAndSave = (blob: Blob, filename: string) => {
    downloadBlob(blob, filename);
    toast.success("Report downloaded");
  };

  const dailyMutation = useMutation({
    mutationFn: () => reportService.daily(),
    onSuccess: (res) => {
      downloadAndSave(res.data, `daily_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      qc.invalidateQueries({ queryKey: ["report-history"] });
    },
  });
  const monthlyMutation = useMutation({
    mutationFn: () => reportService.monthly(),
    onSuccess: (res) => {
      downloadAndSave(res.data, `monthly_report_${new Date().toISOString().slice(0, 7)}.pdf`);
      qc.invalidateQueries({ queryKey: ["report-history"] });
    },
  });
  const yearlyMutation = useMutation({
    mutationFn: () => reportService.yearly(),
    onSuccess: (res) => {
      downloadAndSave(res.data, `yearly_report_${new Date().getFullYear()}.pdf`);
      qc.invalidateQueries({ queryKey: ["report-history"] });
    },
  });
  const customMutation = useMutation({
    mutationFn: (data: ReportRequest) => reportService.custom(data),
    onSuccess: (res, vars) => {
      downloadAndSave(res.data, `custom_report_${vars.startDate}_${vars.endDate}.pdf`);
      qc.invalidateQueries({ queryKey: ["report-history"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => reportService.deleteHistory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report-history"] });
      toast.success("Report deleted");
      setDeleteId(null);
    },
  });

  const handleHistoryDownload = async (id: number) => {
    try {
      const res = await reportService.downloadHistory(id);
      downloadBlob(res.data, `report_${id}.pdf`);
    } catch {
      toast.error("Failed to download");
    }
  };

  // ── View handlers ──────────────────────────────────────────────
  // Each of these (re)generates the report and shows it in the PDF dialog
  // instead of immediately downloading. Generating it still records a
  // report-history entry on the backend, just like Download does.

  const viewDaily = () => {
    setViewTarget({
      title: `Daily Report — ${formatDate(new Date().toISOString())}`,
      filename: `daily_report_${new Date().toISOString().slice(0, 10)}.pdf`,
      fetchPdf: async () => {
        const res = await reportService.daily();
        qc.invalidateQueries({ queryKey: ["report-history"] });
        return res.data;
      },
    });
  };

  const viewMonthly = () => {
    setViewTarget({
      title: `Monthly Report — ${new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}`,
      filename: `monthly_report_${new Date().toISOString().slice(0, 7)}.pdf`,
      fetchPdf: async () => {
        const res = await reportService.monthly();
        qc.invalidateQueries({ queryKey: ["report-history"] });
        return res.data;
      },
    });
  };

  const viewYearly = () => {
    setViewTarget({
      title: `Yearly Report — ${new Date().getFullYear()}`,
      filename: `yearly_report_${new Date().getFullYear()}.pdf`,
      fetchPdf: async () => {
        const res = await reportService.yearly();
        qc.invalidateQueries({ queryKey: ["report-history"] });
        return res.data;
      },
    });
  };

  const viewCustom = () => {
    const { startDate, endDate } = getValues();
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    setViewTarget({
      title: `Custom Report — ${formatDate(startDate)} to ${formatDate(endDate)}`,
      filename: `custom_report_${startDate}_${endDate}.pdf`,
      fetchPdf: async () => {
        const res = await reportService.custom({ startDate, endDate });
        qc.invalidateQueries({ queryKey: ["report-history"] });
        return res.data;
      },
    });
  };

  const viewHistoryReport = (r: ReportHistoryResponse) => {
    setViewTarget({
      title: `${r.reportType} Report — ${formatDate(r.startDate)} to ${formatDate(r.endDate)}`,
      filename: r.fileName || `report_${r.id}.pdf`,
      fetchPdf: async () => {
        const res = await reportService.downloadHistory(r.id);
        return res.data;
      },
    });
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate, preview and download sales reports" />

      {/* Quick reports */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex flex-col items-center text-center gap-3 py-6">
            <div className="p-3 rounded-full bg-primary/10">
              <FileBarChart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Daily Report</p>
              <p className="text-xs text-text-muted">Today's sales summary</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button onClick={viewDaily} variant="outline" className="flex-1">
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button onClick={() => dailyMutation.mutate()} loading={dailyMutation.isPending} className="flex-1">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center text-center gap-3 py-6">
            <div className="p-3 rounded-full bg-success/10">
              <FileBarChart className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Monthly Report</p>
              <p className="text-xs text-text-muted">This month's sales summary</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button onClick={viewMonthly} variant="outline" className="flex-1">
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button onClick={() => monthlyMutation.mutate()} loading={monthlyMutation.isPending} className="flex-1" variant="success">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center text-center gap-3 py-6">
            <div className="p-3 rounded-full bg-warning/10">
              <FileBarChart className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Yearly Report</p>
              <p className="text-xs text-text-muted">This year's sales summary</p>
            </div>
            <div className="flex gap-2 w-full">
              <Button onClick={viewYearly} variant="outline" className="flex-1">
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button onClick={() => yearlyMutation.mutate()} loading={yearlyMutation.isPending} className="flex-1" variant="warning">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom report */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Custom Date Range Report
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => customMutation.mutate(d))} className="flex flex-col sm:flex-row items-end gap-3">
            <Input label="Start Date *" type="date" error={errors.startDate?.message} {...register("startDate")} />
            <Input label="End Date *" type="date" error={errors.endDate?.message} {...register("endDate")} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={viewCustom}>
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button type="submit" loading={customMutation.isPending}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Report History
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={history as unknown as Record<string, unknown>[]}
            searchable={false}
            emptyMessage="No reports generated yet."
            columns={[
              { key: "reportType", header: "Type", render: (r) => <span className="capitalize">{(r as unknown as ReportHistoryResponse).reportType?.toLowerCase()}</span> },
              { key: "startDate", header: "Start Date", render: (r) => formatDate((r as unknown as ReportHistoryResponse).startDate) },
              { key: "endDate", header: "End Date", render: (r) => formatDate((r as unknown as ReportHistoryResponse).endDate) },
              { key: "generatedBy", header: "Generated By" },
              { key: "generatedAt", header: "Generated On", render: (r) => formatDateTime((r as unknown as ReportHistoryResponse).generatedAt) },
            ]}
            actions={(row) => {
              const r = row as unknown as ReportHistoryResponse;
              return (
                <>
                  <Button size="icon-sm" variant="ghost" onClick={() => viewHistoryReport(r)} title="View">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => handleHistoryDownload(r.id)} title="Download">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {isAdmin && (
                    <Button size="icon-sm" variant="ghost" onClick={() => setDeleteId(r.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  )}
                </>
              );
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title="Delete Report" description="This will permanently remove this report from history." confirmLabel="Delete" loading={deleteMutation.isPending} />

      {/* PDF View Dialog */}
      {viewTarget && <PdfViewDialog key={viewTarget.filename + viewTarget.title} open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget.title} filename={viewTarget.filename} fetchPdf={viewTarget.fetchPdf} />}
    </div>
  );
}
