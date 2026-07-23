import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrendingUp, Plus, DollarSign, Wallet, PiggyBank, Download, Percent, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { profitService, downloadBlob } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, SelectField, SelectItem, Skeleton } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader, StatCard } from "@/components/common";
import { formatCurrency, formatDate } from "@/utils";
import type { MonthlyProfitRequest, MonthlyProfitResponse } from "@/types";
import toast from "react-hot-toast";

const schema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  totalSales: z.coerce.number().min(0),
  productionCost: z.coerce.number().min(0),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Period = "daily" | "monthly" | "yearly";

export default function ProfitPage() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // ── New: Auto-calculated profit summary (Daily / Monthly / Yearly) ──
  const today = new Date();
  const [period, setPeriod] = useState<Period>("daily");
  const [summaryDate, setSummaryDate] = useState(today.toISOString().slice(0, 10)); // YYYY-MM-DD
  const [summaryMonth, setSummaryMonth] = useState(today.getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(today.getFullYear());

  const summaryQuery = useQuery({
    queryKey: ["profit-summary", period, summaryDate, summaryMonth, summaryYear],
    queryFn: () => {
      if (period === "daily") return profitService.getDailySummary(summaryDate);
      if (period === "monthly") return profitService.getMonthlySummary(summaryYear, summaryMonth);
      return profitService.getYearlySummary(summaryYear);
    },
  });
  const summary = summaryQuery.data?.data?.data;

  const downloadMutation = useMutation({
    mutationFn: () =>
      profitService.downloadSummary({
        period,
        date: period === "daily" ? summaryDate : undefined,
        year: period !== "daily" ? summaryYear : undefined,
        month: period === "monthly" ? summaryMonth : undefined,
      }),
    onSuccess: (res) => {
      const filename = period === "daily" ? `profit_daily_${summaryDate}.pdf` : period === "monthly" ? `profit_monthly_${summaryYear}_${String(summaryMonth).padStart(2, "0")}.pdf` : `profit_yearly_${summaryYear}.pdf`;
      downloadBlob(res.data, filename);
      toast.success("Profit report downloaded");
    },
    onError: () => toast.error("Failed to download profit report"),
  });

  // ── Existing: Manual monthly profit ledger ──────────────────────────
  const { data: yearRes, isLoading } = useQuery({
    queryKey: ["profit-year", selectedYear],
    queryFn: () => profitService.getByYear(selectedYear),
  });
  const yearData = yearRes?.data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { year: currentYear, month: new Date().getMonth() + 1 },
  });

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => profitService.createOrUpdate(data as MonthlyProfitRequest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profit-year"] });
      toast.success("Profit entry saved");
      setFormOpen(false);
    },
  });

  const totalSales = yearData.reduce((s, m) => s + m.totalSales, 0);
  const totalCost = yearData.reduce((s, m) => s + m.productionCost + m.otherExpenses, 0);
  const totalProfit = yearData.reduce((s, m) => s + m.netProfit, 0);
  const margin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  const chartData = MONTHS.map((name, i) => {
    const entry = yearData.find((m) => m.month === i + 1);
    return {
      month: name.slice(0, 3),
      Revenue: entry?.totalSales ?? 0,
      Cost: (entry?.productionCost ?? 0) + (entry?.otherExpenses ?? 0),
      Profit: entry?.netProfit ?? 0,
    };
  });

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div>
      <PageHeader title="Profit Reports" subtitle="Auto-calculated profit (Sales − Production Cost) from your invoices" />

      {/* ── Auto Profit Summary: Daily / Monthly / Yearly ───────────── */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <CardTitle>
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Profit Summary
              </span>
            </CardTitle>

            {/* Period toggle */}
            <div className="flex items-center rounded-lg border border-border/40 overflow-hidden text-sm w-fit">
              {(["daily", "monthly", "yearly"] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 capitalize transition-colors ${period === p ? "bg-primary text-white" : "bg-card text-text-secondary hover:bg-card-hover"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Date / Month / Year selectors */}
          <div className="flex flex-wrap items-end gap-3 mb-5">
            {period === "daily" && <Input label="Date" type="date" value={summaryDate} onChange={(e) => setSummaryDate(e.target.value)} className="w-48" />}
            {period === "monthly" && (
              <>
                <SelectField label="Month" value={String(summaryMonth)} onValueChange={(v) => setSummaryMonth(Number(v))}>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectField>
                <SelectField label="Year" value={String(summaryYear)} onValueChange={(v) => setSummaryYear(Number(v))}>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectField>
              </>
            )}
            {period === "yearly" && (
              <SelectField label="Year" value={String(summaryYear)} onValueChange={(v) => setSummaryYear(Number(v))}>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectField>
            )}

            <Button variant="outline" onClick={() => downloadMutation.mutate()} loading={downloadMutation.isPending} className="ml-auto">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {/* Preview */}
          {summaryQuery.isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : summaryQuery.isError ? (
            <p className="text-sm text-danger text-center py-6">
              Could not load profit summary. Make sure the backend exposes the
              <code className="mx-1 px-1 bg-card rounded text-xs">/api/profit/summary/*</code>
              endpoints.
            </p>
          ) : summary ? (
            <>
              <p className="text-xs text-text-muted mb-3">
                Period: <span className="text-text-secondary font-medium">{summary.periodLabel}</span> ({formatDate(summary.startDate)} – {formatDate(summary.endDate)}) · {summary.invoiceCount} invoice{summary.invoiceCount === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Sales" value={summary.totalSales} icon={DollarSign} iconBg="bg-primary/10" iconColor="text-primary" isCurrency />
                <StatCard title="Production Cost" value={summary.productionCost} icon={Wallet} iconBg="bg-warning/10" iconColor="text-warning" isCurrency />
                <StatCard title="Expenses" value={summary.totalExpenses} icon={Receipt} iconBg="bg-danger/10" iconColor="text-danger" isCurrency />
                <StatCard title="Net Profit" value={summary.netProfit} icon={PiggyBank} iconBg="bg-success/10" iconColor="text-success" isCurrency />
                <StatCard title="Profit Margin" value={`${summary.marginPercent.toFixed(1)}%`} icon={Percent} iconBg="bg-primary/10" iconColor="text-primary" />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Manual Monthly Profit Ledger (existing) ─────────────────── */}
      <PageHeader
        title="Manual Profit Ledger"
        subtitle="Record total sales and production cost for the month — expenses are pulled in automatically from your Expense entries"
        actions={
          <div className="flex items-center gap-2">
            <SelectField value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectField>
            <Button
              onClick={() => {
                reset({ year: selectedYear, month: new Date().getMonth() + 1 });
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add / Update Entry
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue" value={totalSales} icon={DollarSign} iconBg="bg-primary/10" iconColor="text-primary" loading={isLoading} isCurrency />
        <StatCard title="Total Cost" value={totalCost} icon={Wallet} iconBg="bg-warning/10" iconColor="text-warning" loading={isLoading} isCurrency />
        <StatCard title="Net Profit" value={totalProfit} icon={PiggyBank} iconBg="bg-success/10" iconColor="text-success" loading={isLoading} isCurrency />
        <StatCard title="Profit Margin" value={`${margin.toFixed(1)}%`} icon={TrendingUp} iconBg="bg-primary/10" iconColor="text-primary" loading={isLoading} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Profit Breakdown — {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cost" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit Entries — {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={yearData as unknown as Record<string, unknown>[]}
            searchable={false}
            emptyMessage="No manual profit entries for this year."
            columns={[
              { key: "monthName", header: "Month" },
              { key: "totalSales", header: "Revenue", render: (r) => formatCurrency((r as unknown as MonthlyProfitResponse).totalSales) },
              { key: "productionCost", header: "Production Cost", render: (r) => formatCurrency((r as unknown as MonthlyProfitResponse).productionCost) },
              { key: "otherExpenses", header: "Other Expenses", render: (r) => formatCurrency((r as unknown as MonthlyProfitResponse).otherExpenses) },
              { key: "netProfit", header: "Net Profit", render: (r) => <span className="font-semibold text-success">{formatCurrency((r as unknown as MonthlyProfitResponse).netProfit)}</span> },
            ]}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add / Update Monthly Profit Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
            <DialogBody className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  control={control}
                  name="month"
                  render={({ field }) => (
                    <SelectField label="Month *" value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectField>
                  )}
                />
                <Input label="Year *" type="number" error={errors.year?.message} {...register("year")} />
              </div>
              <Input label="Total Sales (₹) *" type="number" step="0.01" error={errors.totalSales?.message} {...register("totalSales")} />
              <Input label="Production Cost (₹) *" type="number" step="0.01" error={errors.productionCost?.message} {...register("productionCost")} />
              <p className="text-xs text-text-muted">Other expenses are now pulled in automatically from your recorded Expense entries for this month — no need to enter them here.</p>
              <Input label="Notes" {...register("notes")} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saveMutation.isPending}>
                Save Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
