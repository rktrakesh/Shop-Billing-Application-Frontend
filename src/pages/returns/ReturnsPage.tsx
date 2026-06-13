import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Undo2, DollarSign, Package } from "lucide-react";
import { returnService } from "@/services";
import { Card, CardContent, Badge } from "@/components/ui/index";
import { DataTable, type Column } from "@/components/common/DataTable";
import { PageHeader, StatCard } from "@/components/common";
import { formatCurrency, formatDateTime } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { CustomerHistoryDialog } from "@/components/customers/CustomerHistoryDialog";
import type { ItemReturnResponse } from "@/types";

export default function ReturnsPage() {
  const { isAdmin, isManager } = useAuth();
  const canSeeAmounts = isAdmin || isManager; // USER (cashier) cannot view refund amounts
  const [historyInvoiceId, setHistoryInvoiceId] = useState<number | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ["returns"],
    queryFn: () => returnService.getAll(),
  });
  const returns = res?.data?.data ?? [];

  const totalRefunded = returns.reduce((s, r) => s + r.refundAmount, 0);
  const totalQuantity = returns.reduce((s, r) => s + r.quantity, 0);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      sortable: true,
      render: (r) => {
        const ret = r as unknown as ItemReturnResponse;
        return (
          <button className="font-mono text-xs text-primary hover:underline" onClick={() => setHistoryInvoiceId(ret.invoiceId)} title="View customer history">
            {ret.invoiceNumber}
          </button>
        );
      },
    },
    {
      key: "designName",
      header: "Item",
      render: (r) => {
        const ret = r as unknown as ItemReturnResponse;
        return (
          <div>
            <p className="text-text-primary">{ret.designName}</p>
            <p className="text-xs text-text-muted">{[ret.color, ret.size, ret.productCode].filter(Boolean).join(" · ")}</p>
          </div>
        );
      },
    },
    { key: "quantity", header: "Qty", render: (r) => <Badge variant="muted">{(r as unknown as ItemReturnResponse).quantity}</Badge> },
  ];

  if (canSeeAmounts) {
    columns.push({
      key: "refundAmount",
      header: "Refund",
      sortable: true,
      render: (r) => <span className="font-semibold text-warning">{formatCurrency((r as unknown as ItemReturnResponse).refundAmount)}</span>,
    });
  }

  columns.push(
    { key: "reason", header: "Reason", render: (r) => (r as unknown as ItemReturnResponse).reason || "-" },
    { key: "returnedByUsername", header: "Processed By", render: (r) => <span className="text-xs text-text-muted">{(r as unknown as ItemReturnResponse).returnedByUsername}</span> },
    { key: "createdAt", header: "Date", sortable: true, render: (r) => formatDateTime((r as unknown as ItemReturnResponse).createdAt) },
  );

  return (
    <div>
      <PageHeader title="Returns" subtitle="Log of all item returns — original invoices remain unchanged" />

      <div className={`grid grid-cols-2 ${canSeeAmounts ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4 mb-6`}>
        {canSeeAmounts && <StatCard title="Total Refunded" value={totalRefunded} icon={DollarSign} iconBg="bg-warning/10" iconColor="text-warning" loading={isLoading} isCurrency />}
        <StatCard title="Items Returned" value={totalQuantity} icon={Package} iconBg="bg-primary/10" iconColor="text-primary" loading={isLoading} />
        <StatCard title="Return Transactions" value={returns.length} icon={Undo2} iconBg="bg-danger/10" iconColor="text-danger" loading={isLoading} />
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable loading={isLoading} data={returns as unknown as Record<string, unknown>[]} searchPlaceholder="Search by invoice #, product..." emptyMessage="No returns recorded yet." columns={columns} />
        </CardContent>
      </Card>

      <CustomerHistoryDialog open={!!historyInvoiceId} onClose={() => setHistoryInvoiceId(null)} invoiceId={historyInvoiceId} />
    </div>
  );
}
