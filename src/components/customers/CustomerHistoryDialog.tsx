import { useQuery } from "@tanstack/react-query";
import { User, Phone, MapPin, FileText, Undo2 } from "lucide-react";
import { customerService, invoiceService, returnService } from "@/services";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, Badge, Skeleton } from "@/components/ui/index";
import { formatCurrency, formatDate, formatDateTime } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { InvoiceResponse, ItemReturnResponse } from "@/types";

interface CustomerHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  customerId?: number | null;
  // If customerId isn't known up-front (e.g. from the Returns page), pass an
  // invoiceId instead — the dialog will resolve the invoice to find the customer.
  invoiceId?: number | null;
  // Fallback display info if customer isn't linked (walk-in)
  walkInName?: string;
  walkInMobile?: string;
}

export function CustomerHistoryDialog({ open, onClose, customerId, invoiceId, walkInName, walkInMobile }: CustomerHistoryDialogProps) {
  const { isAdmin, isManager } = useAuth();
  const canSeeAmounts = isAdmin || isManager;

  // Resolve the invoice (only needed when customerId isn't provided directly)
  const { data: invoiceRes, isLoading: invoiceLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoiceService.getById(invoiceId!),
    enabled: open && !customerId && !!invoiceId,
  });
  const resolvedInvoice = invoiceRes?.data?.data;
  const resolvedCustomerId = customerId ?? resolvedInvoice?.customerId;
  const resolvedWalkInName = walkInName ?? resolvedInvoice?.customerName;
  const resolvedWalkInMobile = walkInMobile ?? resolvedInvoice?.customerMobile;

  const { data: customerRes, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", resolvedCustomerId],
    queryFn: () => customerService.getById(resolvedCustomerId!),
    enabled: open && !!resolvedCustomerId,
  });
  const customer = customerRes?.data?.data;

  const { data: purchasesRes, isLoading: purchasesLoading } = useQuery({
    queryKey: ["customer-purchases", resolvedCustomerId],
    queryFn: () => customerService.getPurchaseHistory(resolvedCustomerId!),
    enabled: open && !!resolvedCustomerId,
  });
  const purchases = purchasesRes?.data?.data ?? [];

  // Fetch all returns once and filter client-side by this customer's invoice numbers
  const { data: returnsRes, isLoading: returnsLoading } = useQuery({
    queryKey: ["returns"],
    queryFn: () => returnService.getAll(),
    enabled: open && !!resolvedCustomerId,
  });
  const allReturns = returnsRes?.data?.data ?? [];

  const invoiceNumbers = new Set(purchases.map((p) => p.invoiceNumber));
  const customerReturns = allReturns.filter((r) => invoiceNumbers.has(r.invoiceNumber));

  const totalPurchased = purchases.reduce((s, p) => s + p.grandTotal, 0);
  const totalReturned = customerReturns.reduce((s, r) => s + r.refundAmount, 0);
  const totalReturnedQty = customerReturns.reduce((s, r) => s + r.quantity, 0);
  const netTotal = totalPurchased - totalReturned;

  const loading = invoiceLoading || customerLoading || purchasesLoading || returnsLoading;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Customer History
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          {invoiceLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : !resolvedCustomerId ? (
            <div className="text-center py-8">
              <User className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-40" />
              <p className="text-sm text-text-secondary">This was a walk-in sale — no customer record linked.</p>
              {(resolvedWalkInName || resolvedWalkInMobile) && (
                <p className="text-xs text-text-muted mt-1">
                  {resolvedWalkInName}
                  {resolvedWalkInName && resolvedWalkInMobile ? " · " : ""}
                  {resolvedWalkInMobile}
                </p>
              )}
            </div>
          ) : loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Customer info */}
              <div className="p-3 rounded-lg border border-border/30">
                <p className="text-sm font-semibold text-text-primary">{customer?.name}</p>
                <div className="flex flex-wrap gap-4 mt-1.5">
                  {customer?.mobileNumber && (
                    <span className="flex items-center gap-1.5 text-xs text-text-muted">
                      <Phone className="h-3 w-3" /> {customer.mobileNumber}
                    </span>
                  )}
                  {customer?.address && (
                    <span className="flex items-center gap-1.5 text-xs text-text-muted">
                      <MapPin className="h-3 w-3" /> {customer.address}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-text-muted">Customer since {formatDate(customer?.createdAt)}</span>
                </div>
              </div>

              {/* Summary stats */}
              <div className={`grid grid-cols-2 ${canSeeAmounts ? "sm:grid-cols-4" : "sm:grid-cols-2"} gap-3`}>
                <div className="p-3 rounded-lg bg-card/40 text-center">
                  <p className="text-lg font-bold text-text-primary">{purchases.length}</p>
                  <p className="text-xs text-text-muted">Invoices</p>
                </div>
                {canSeeAmounts && (
                  <div className="p-3 rounded-lg bg-card/40 text-center">
                    <p className="text-lg font-bold text-primary">{formatCurrency(totalPurchased)}</p>
                    <p className="text-xs text-text-muted">Total Purchased</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-card/40 text-center">
                  <p className="text-lg font-bold text-warning">{totalReturnedQty}</p>
                  <p className="text-xs text-text-muted">Items Returned</p>
                </div>
                {canSeeAmounts && (
                  <div className="p-3 rounded-lg bg-card/40 text-center">
                    <p className="text-lg font-bold text-success">{formatCurrency(netTotal)}</p>
                    <p className="text-xs text-text-muted">Net Total</p>
                  </div>
                )}
              </div>

              {/* Purchase history */}
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Purchase History
                </p>
                {purchases.length === 0 ? (
                  <p className="text-sm text-text-muted">No purchases found.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {purchases.map((inv: InvoiceResponse) => (
                      <div key={inv.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/20 text-sm">
                        <div>
                          <span className="font-mono text-xs text-primary">{inv.invoiceNumber}</span>
                          <span className="text-xs text-text-muted ml-2">{formatDateTime(inv.invoiceDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="muted">{inv.items.length} items</Badge>
                          {canSeeAmounts && <span className="font-medium text-text-primary">{formatCurrency(inv.grandTotal)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Return history */}
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Undo2 className="h-3.5 w-3.5" /> Return History
                </p>
                {customerReturns.length === 0 ? (
                  <p className="text-sm text-text-muted">No returns recorded.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {customerReturns.map((r: ItemReturnResponse) => (
                      <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-warning/20 bg-warning/5 text-sm">
                        <div>
                          <p className="text-text-primary">{r.designName}</p>
                          <p className="text-xs text-text-muted">
                            {[r.color, r.size].filter(Boolean).join(" · ")} · <span className="font-mono text-primary">{r.invoiceNumber}</span> · {formatDate(r.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="warning">Qty {r.quantity}</Badge>
                          {canSeeAmounts && <span className="font-medium text-warning">-{formatCurrency(r.refundAmount)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
