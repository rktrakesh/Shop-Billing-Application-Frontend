import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, ChevronDown, ChevronUp, TrendingDown, CreditCard, ShoppingBag } from "lucide-react";
import { shopDayService, downloadBlob } from "@/services";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui/index";
import { PageHeader, StatCard } from "@/components/common";
import { formatCurrency, formatDateTime } from "@/utils";
import type { ShopStatusResponse, DayReportResponse } from "@/types";
import toast from "react-hot-toast";

export default function DayReportPage() {
  const qc = useQueryClient();
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [expandReturns, setExpandReturns] = useState(true);
  const [expandCredits, setExpandCredits] = useState(true);

  const { data: logsRes, isLoading } = useQuery({
    queryKey: ["shop-logs"],
    queryFn: () => shopDayService.getLogs(),
  });
  const logs = logsRes?.data?.data ?? [];

  const { data: reportRes, isLoading: reportLoading } = useQuery({
    queryKey: ["day-report", selectedLogId],
    queryFn: () => shopDayService.getReport(selectedLogId!),
    enabled: !!selectedLogId,
  });
  const report: DayReportResponse | undefined = reportRes?.data?.data;

  const downloadMutation = useMutation({
    mutationFn: (dayLogId: number) => shopDayService.downloadReport(dayLogId),
    onSuccess: (res, dayLogId) => {
      downloadBlob(res.data, `day-report-${dayLogId}.pdf`);
      toast.success("Report downloaded");
    },
    onError: () => toast.error("Failed to download report"),
  });

  const modeIcons: Record<string, string> = {
    CASH: "💵",
    UPI: "📱",
    CARD: "💳",
    OTHER: "🔄",
  };

  return (
    <div>
      <PageHeader title="End of Day Reports" subtitle="View daily collection summaries, returns and credits" />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: Log list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted px-1">DAY HISTORY</p>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-text-muted p-4">No day logs yet.</p>
          ) : (
            logs.map((log: ShopStatusResponse) => (
              <button key={log.dayLogId} onClick={() => setSelectedLogId(log.dayLogId ?? null)} className={`w-full text-left p-3 rounded-xl border transition-all ${selectedLogId === log.dayLogId ? "border-primary bg-primary/5" : "border-border/30 bg-card hover:border-primary/30"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">{log.openTime ? formatDateTime(log.openTime).split(" ")[0] : "Unknown date"}</span>
                  <Badge variant={log.status === "OPEN" ? "success" : "muted"}>{log.status}</Badge>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {log.openTime ? formatDateTime(log.openTime) : ""}
                  {log.closeTime ? ` → ${formatDateTime(log.closeTime)}` : ""}
                </p>
                {log.closedBy && <p className="text-xs text-text-muted">Closed by: {log.closedBy}</p>}
              </button>
            ))
          )}
        </div>

        {/* Right: Report detail */}
        <div className="lg:col-span-2">
          {!selectedLogId ? (
            <div className="flex items-center justify-center h-64 text-center">
              <div>
                <FileText className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-40" />
                <p className="text-sm text-text-muted">Select a day from the list to view its report</p>
              </div>
            </div>
          ) : reportLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
              ))}
            </div>
          ) : report ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">
                    {formatDateTime(report.openTime)} → {report.closeTime ? formatDateTime(report.closeTime) : "Ongoing"}
                  </p>
                  <p className="text-xs text-text-muted">Closed by: {report.closedBy}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => downloadMutation.mutate(selectedLogId!)} loading={downloadMutation.isPending}>
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </Button>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard title="Total Sales" value={report.totalSales} icon={ShoppingBag} iconBg="bg-primary/10" iconColor="text-primary" isCurrency />
                <StatCard title="Net Collection" value={report.netCollection} icon={ShoppingBag} iconBg="bg-success/10" iconColor="text-success" isCurrency />
                <StatCard title="Returns" value={report.totalReturns} icon={TrendingDown} iconBg="bg-danger/10" iconColor="text-danger" isCurrency />
                <StatCard title="Credits Given" value={report.totalCreditGiven} icon={CreditCard} iconBg="bg-warning/10" iconColor="text-warning" isCurrency />
              </div>

              {/* Payment mode breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Collection by Payment Mode</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {Object.entries(report.salesByPaymentMode).map(([mode, amount]) => (
                      <div key={mode} className="bg-card/40 border border-border/30 rounded-xl p-3 text-center">
                        <p className="text-lg mb-1">{modeIcons[mode] ?? "💰"}</p>
                        <p className="text-xs text-text-muted">{mode}</p>
                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(amount)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/20 flex justify-between text-sm">
                    <span className="text-text-muted">Invoices</span>
                    <span className="font-medium">{report.invoiceCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Total Discounts</span>
                    <span className="text-warning">-{formatCurrency(report.totalDiscount)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Returns detail */}
              <Card>
                <CardHeader>
                  <button className="flex items-center justify-between w-full" onClick={() => setExpandReturns(!expandReturns)}>
                    <CardTitle>
                      Returns Today ({report.returnCount}){report.totalReturns > 0 && <span className="text-danger text-sm font-normal ml-2">-{formatCurrency(report.totalReturns)}</span>}
                    </CardTitle>
                    {expandReturns ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
                  </button>
                </CardHeader>
                {expandReturns && (
                  <CardContent className="p-0">
                    {report.returnDetails.length === 0 ? (
                      <p className="text-sm text-text-muted p-4 text-center">No returns today 🎉</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="px-4 py-2 text-left text-xs text-text-muted">Invoice</th>
                            <th className="px-4 py-2 text-left text-xs text-text-muted">Customer</th>
                            <th className="px-4 py-2 text-left text-xs text-text-muted">Item</th>
                            <th className="px-4 py-2 text-right text-xs text-text-muted">Qty</th>
                            <th className="px-4 py-2 text-right text-xs text-text-muted">Refund</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.returnDetails.map((r, i) => (
                            <tr key={i} className="data-table-row">
                              <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.invoiceNumber}</td>
                              <td className="px-4 py-2.5">
                                <p className="text-text-primary">{r.customerName || "Walk-in"}</p>
                                {r.customerMobile && <p className="text-xs text-text-muted">{r.customerMobile}</p>}
                              </td>
                              <td className="px-4 py-2.5">
                                <p className="text-text-secondary">{r.itemName}</p>
                                <p className="text-xs text-text-muted">{[r.color, r.size].filter(Boolean).join(" / ")}</p>
                              </td>
                              <td className="px-4 py-2.5 text-right text-text-muted">{r.quantity}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-danger">{formatCurrency(r.refundAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Credits detail */}
              <Card>
                <CardHeader>
                  <button className="flex items-center justify-between w-full" onClick={() => setExpandCredits(!expandCredits)}>
                    <CardTitle>
                      Credits Given Today ({report.creditCount}){report.totalCreditGiven > 0 && <span className="text-warning text-sm font-normal ml-2">{formatCurrency(report.totalCreditGiven)} outstanding</span>}
                    </CardTitle>
                    {expandCredits ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
                  </button>
                </CardHeader>
                {expandCredits && (
                  <CardContent className="p-0">
                    {report.creditDetails.length === 0 ? (
                      <p className="text-sm text-text-muted p-4 text-center">No credits given today 🎉</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="px-4 py-2 text-left text-xs text-text-muted">Invoice</th>
                            <th className="px-4 py-2 text-left text-xs text-text-muted">Customer</th>
                            <th className="px-4 py-2 text-right text-xs text-text-muted">Total</th>
                            <th className="px-4 py-2 text-right text-xs text-text-muted">Paid</th>
                            <th className="px-4 py-2 text-right text-xs text-text-muted">Outstanding</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.creditDetails.map((c, i) => (
                            <tr key={i} className="data-table-row">
                              <td className="px-4 py-2.5 font-mono text-xs text-primary">{c.invoiceNumber}</td>
                              <td className="px-4 py-2.5">
                                <p className="text-text-primary">{c.customerName}</p>
                                {c.customerMobile && <p className="text-xs text-text-muted">{c.customerMobile}</p>}
                              </td>
                              <td className="px-4 py-2.5 text-right text-text-secondary">{formatCurrency(c.invoiceTotal)}</td>
                              <td className="px-4 py-2.5 text-right text-success font-medium">{formatCurrency(c.amountPaid)}</td>
                              <td className="px-4 py-2.5 text-right text-warning font-semibold">{formatCurrency(c.outstandingAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
