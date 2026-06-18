import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, ShoppingBag, Users, Package, AlertTriangle, FileText, BarChart2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { dashboardService, profitService } from "@/services";
import { StatCard, PageHeader } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from "@/components/ui/index";
import { formatCurrency } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { isAdmin } = useAuth();

  const { data: res, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.get(),
    refetchInterval: 60_000,
  });

  const d = res?.data?.data;

  const { data: trendRes, isLoading: trendLoading } = useQuery({
    queryKey: ["profit-trend-6m"],
    queryFn: () => profitService.getLastMonthsSummary(6),
    staleTime: 5 * 60_000,
    enabled: isAdmin,
  });

  const trendData = (trendRes?.data?.data ?? []).map((s) => ({
    month: s.periodLabel,
    sales: Number(s.totalSales ?? 0),
    profit: Number(s.netProfit ?? 0),
  }));

  const chartsLoading = isLoading || trendLoading;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your shop's performance" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Today's Sales" value={d?.todaySales ?? 0} icon={DollarSign} iconBg="bg-primary/10" iconColor="text-primary" loading={isLoading} isCurrency />
        <StatCard title="Monthly Sales" value={d?.monthlySales ?? 0} icon={BarChart2} iconBg="bg-success/10" iconColor="text-success" loading={isLoading} isCurrency />
        <StatCard title="Today's Invoices" value={d?.todayInvoiceCount ?? 0} icon={FileText} iconBg="bg-warning/10" iconColor="text-warning" loading={isLoading} />
        <StatCard title="Total Customers" value={d?.totalCustomers ?? 0} icon={Users} iconBg="bg-primary/10" iconColor="text-primary" loading={isLoading} />
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Monthly Profit" value={d?.monthlyProfit ?? 0} icon={TrendingUp} iconBg="bg-success/10" iconColor="text-success" loading={isLoading} isCurrency />
          <StatCard title="Yearly Sales" value={d?.yearlySales ?? 0} icon={ShoppingBag} iconBg="bg-primary/10" iconColor="text-primary" loading={isLoading} isCurrency />
          <StatCard title="Total Products" value={d?.totalProducts ?? 0} icon={Package} iconBg="bg-warning/10" iconColor="text-warning" loading={isLoading} />
          <StatCard title="Low Stock Items" value={d?.lowStockCount ?? 0} icon={AlertTriangle} iconBg="bg-danger/10" iconColor="text-danger" loading={isLoading} />
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview (6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : trendData.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-text-muted">No sales data yet for the last 6 months.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: number) => [formatCurrency(v), "Net Sales"]} />
                    <Area type="monotone" dataKey="sales" stroke="#2563EB" fill="url(#salesGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Profit Overview (6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : trendData.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-text-muted">No profit data yet for the last 6 months.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8 }} formatter={(v: number, name: string) => [formatCurrency(v), name === "sales" ? "Net Sales" : "Net Profit"]} />
                    <Legend formatter={(v) => (v === "sales" ? "Net Sales" : "Net Profit")} />
                    <Bar dataKey="sales" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !d?.recentInvoices?.length ? (
              <p className="p-4 text-sm text-text-muted text-center">No recent invoices</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {d.recentInvoices.slice(0, 6).map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-2">{inv.invoiceNumber}</td>
                      <td className="px-4 py-2">{inv.customerName || "Walk-in"}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(inv.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !d?.lowStockProducts?.length ? (
              <p className="p-4 text-sm text-text-muted text-center">All stock levels are healthy 🎉</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {d.lowStockProducts.slice(0, 6).map((v) => (
                    <tr key={v.id}>
                      <td className="px-4 py-2">{v.designName}</td>
                      <td className="px-4 py-2">
                        {v.color} / {v.size}
                      </td>
                      <td className="px-4 py-2 text-right">{v.stock} left</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
