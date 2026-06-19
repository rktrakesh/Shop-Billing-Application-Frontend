import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, DollarSign, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { creditService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, SelectField, SelectItem } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader, StatCard } from "@/components/common";
import { formatCurrency, formatDateTime } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { CustomerCreditResponse, PaymentMode } from "@/types";
import toast from "react-hot-toast";

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMode: z.enum(["CASH", "UPI", "CARD", "OTHER"] as const),
  notes: z.string().optional(),
});
type PaymentFormData = z.infer<typeof paymentSchema>;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PARTIAL: "Partial",
  CLEARED: "Cleared",
};

const STATUS_VARIANTS: Record<string, "danger" | "warning" | "success"> = {
  PENDING: "danger",
  PARTIAL: "warning",
  CLEARED: "success",
};

export default function CreditsPage() {
  const qc = useQueryClient();
  const { isAdmin, isManager } = useAuth();
  const canSeeAmounts = isAdmin || isManager;

  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "PARTIAL" | "CLEARED">("ALL");
  const [selectedCredit, setSelectedCredit] = useState<CustomerCreditResponse | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ["credits"],
    queryFn: () => creditService.getAll(),
  });
  const allCredits = res?.data?.data ?? [];

  // credit summary not used in this page currently

  const filtered = filterStatus === "ALL" ? allCredits : allCredits.filter((c) => c.status === filterStatus);

  const pendingCount = allCredits.filter((c) => c.status !== "CLEARED").length;
  const totalOutstanding = allCredits.filter((c) => c.status !== "CLEARED").reduce((s, c) => s + c.outstandingAmount, 0);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentMode: "CASH" },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ creditId, data }: { creditId: number; data: PaymentFormData }) => creditService.recordPayment(creditId, { amount: data.amount, paymentMode: data.paymentMode as PaymentMode, notes: data.notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["credit-summary"] });
      toast.success("Payment recorded successfully");
      setSelectedCredit(null);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to record payment"),
  });

  const maxAmount = selectedCredit?.outstandingAmount ?? 0;
  const watchedAmount = watch("amount");

  return (
    <div>
      <PageHeader title="Customer Credits" subtitle="Track outstanding balances and record repayments" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pending Credits" value={pendingCount} icon={Clock} iconBg="bg-warning/10" iconColor="text-warning" loading={isLoading} />
        {canSeeAmounts && <StatCard title="Total Outstanding" value={totalOutstanding} icon={DollarSign} iconBg="bg-danger/10" iconColor="text-danger" loading={isLoading} isCurrency />}
        <StatCard title="All Credits" value={allCredits.length} icon={CreditCard} iconBg="bg-primary/10" iconColor="text-primary" loading={isLoading} />
        <StatCard title="Cleared" value={allCredits.filter((c) => c.status === "CLEARED").length} icon={CheckCircle} iconBg="bg-success/10" iconColor="text-success" loading={isLoading} />
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Credit Records</CardTitle>
            <div className="flex items-center rounded-lg border border-border/40 overflow-hidden text-sm">
              {(["ALL", "PENDING", "PARTIAL", "CLEARED"] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 capitalize transition-colors ${filterStatus === s ? "bg-primary text-white" : "bg-card text-text-secondary hover:bg-card-hover"}`}>
                  {s === "ALL" ? "All" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={filtered as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search by customer name or invoice..."
            emptyMessage="No credit records found."
            columns={[
              {
                key: "invoiceNumber",
                header: "Invoice #",
                render: (r) => <span className="font-mono text-xs text-primary">{(r as unknown as CustomerCreditResponse).invoiceNumber}</span>,
              },
              {
                key: "customerName",
                header: "Customer",
                render: (r) => {
                  const c = r as unknown as CustomerCreditResponse;
                  return (
                    <div>
                      <p className="text-text-primary">{c.customerName}</p>
                      {c.customerMobile && <p className="text-xs text-text-muted">{c.customerMobile}</p>}
                    </div>
                  );
                },
              },
              ...(canSeeAmounts
                ? [
                    { key: "totalAmount", header: "Invoice Total", render: (r: any) => formatCurrency((r as CustomerCreditResponse).totalAmount) },
                    { key: "amountPaid", header: "Paid", render: (r: any) => <span className="text-success">{formatCurrency((r as CustomerCreditResponse).amountPaid)}</span> },
                    { key: "outstandingAmount", header: "Outstanding", render: (r: any) => <span className="font-semibold text-danger">{formatCurrency((r as CustomerCreditResponse).outstandingAmount)}</span> },
                  ]
                : []),
              {
                key: "status",
                header: "Status",
                render: (r) => {
                  const s = (r as unknown as CustomerCreditResponse).status;
                  return <Badge variant={STATUS_VARIANTS[s]}>{STATUS_LABELS[s]}</Badge>;
                },
              },
              { key: "createdAt", header: "Date", render: (r) => formatDateTime((r as unknown as CustomerCreditResponse).createdAt) },
            ]}
            actions={(row) => {
              const credit = row as unknown as CustomerCreditResponse;
              return (
                <>
                  <Button size="icon-sm" variant="ghost" onClick={() => setExpandedId(expandedId === credit.id ? null : credit.id)} title="View payment history">
                    {expandedId === credit.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>
                  {credit.status !== "CLEARED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCredit(credit);
                        reset({ paymentMode: "CASH", amount: credit.outstandingAmount });
                      }}
                    >
                      Record Payment
                    </Button>
                  )}
                </>
              );
            }}
            // @ts-ignore -- DataTable typing does not include expandedRow but component supports it
            expandedRow={(row: Record<string, unknown>) => {
              const credit = row as unknown as CustomerCreditResponse;
              if (expandedId !== credit.id) return null;
              return (
                <div className="px-4 pb-3 pt-1">
                  {credit.notes && <p className="text-xs text-text-muted mb-2">Note: {credit.notes}</p>}
                  {credit.payments.length === 0 ? (
                    <p className="text-xs text-text-muted italic">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-text-muted mb-1">Payment History</p>
                      {credit.payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-card/40 border border-border/20">
                          <span className="text-text-muted">
                            {formatDateTime(p.createdAt)} · {p.recordedByUsername} · {p.paymentMode}
                          </span>
                          {canSeeAmounts && <span className="font-medium text-success">+{formatCurrency(p.amount)}</span>}
                          {p.notes && <span className="text-text-muted ml-2">({p.notes})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={!!selectedCredit} onOpenChange={(o) => !o && setSelectedCredit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Record Payment
            </DialogTitle>
          </DialogHeader>
          {selectedCredit && (
            <form onSubmit={handleSubmit((d) => paymentMutation.mutate({ creditId: selectedCredit.id, data: d }))}>
              <DialogBody className="space-y-3">
                <div className="p-3 rounded-lg bg-card/40 border border-border/30 text-sm space-y-1">
                  <p className="text-text-primary font-medium">{selectedCredit.customerName}</p>
                  <p className="text-text-muted text-xs">Invoice: {selectedCredit.invoiceNumber}</p>
                  {canSeeAmounts && (
                    <>
                      <p className="text-text-muted text-xs">Total: {formatCurrency(selectedCredit.totalAmount)}</p>
                      <p className="text-text-muted text-xs">Already paid: {formatCurrency(selectedCredit.amountPaid)}</p>
                      <p className="text-warning font-semibold">Outstanding: {formatCurrency(selectedCredit.outstandingAmount)}</p>
                    </>
                  )}
                </div>

                <Input
                  label="Amount (₹) *"
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={maxAmount}
                  error={errors.amount?.message}
                  hint={canSeeAmounts && Number(watchedAmount) > 0 ? `Remaining after this: ${formatCurrency(Math.max(0, maxAmount - Number(watchedAmount)))}` : undefined}
                  {...register("amount")}
                />
                <Controller
                  control={control}
                  name="paymentMode"
                  render={({ field }) => (
                    <SelectField label="Payment Mode *" value={field.value} onValueChange={field.onChange}>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectField>
                  )}
                />
                <Input label="Notes (optional)" placeholder="e.g. Paid via GPay" {...register("notes")} />
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedCredit(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={paymentMutation.isPending}>
                  Record Payment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
