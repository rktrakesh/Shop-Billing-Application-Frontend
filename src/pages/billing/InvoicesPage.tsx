import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Download, Eye, Printer, Receipt, Undo2, AlertTriangle } from "lucide-react";
import { invoiceService, settingsService, returnService, downloadBlob, printBlob, printReceipt } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common";
import { formatCurrency, formatDateTime } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { InvoiceItemResponse, InvoiceResponse, ItemReturnRequest } from "@/types";
import { CustomerHistoryDialog } from "@/components/customers/CustomerHistoryDialog";
import toast from "react-hot-toast";

// Per-line-item state inside the Return dialog
interface ReturnLineState {
  quantity: number; // quantity the user wants to return now
  refundAmount: number;
  reason: string;
}

export default function InvoicesPage() {
  const qc = useQueryClient();
  const { isAdmin, isManager } = useAuth();
  const [viewing, setViewing] = useState<InvoiceResponse | null>(null);
  const [returningInvoice, setReturningInvoice] = useState<InvoiceResponse | null>(null);
  const [returnLines, setReturnLines] = useState<Record<number, ReturnLineState>>({});
  const [historyInvoice, setHistoryInvoice] = useState<InvoiceResponse | null>(null);

  const canViewAll = isAdmin || isManager;
  const canReturn = true; // all roles can process returns
  const canSeeAmounts = isAdmin || isManager; // USER cannot see refund/money amounts

  const { data: res, isLoading } = useQuery({
    queryKey: ["invoices", canViewAll],
    queryFn: () => (canViewAll ? invoiceService.getAll() : invoiceService.getMy()),
  });
  const invoices = res?.data?.data ?? [];

  // Shop settings used for the thermal receipt header/footer.
  // GET /api/settings is restricted to ADMIN at the security-filter level,
  // so only fetch it for admins; managers get a default header.
  const { data: shopSettingsRes } = useQuery({
    queryKey: ["shop-settings"],
    queryFn: () => settingsService.get(),
    staleTime: 5 * 60_000,
    enabled: isAdmin,
  });
  const shopSettings = shopSettingsRes?.data?.data;

  // Already-returned quantities for the invoice currently being returned
  const { data: existingReturnsRes, isLoading: returnsLoading } = useQuery({
    queryKey: ["returns-by-invoice", returningInvoice?.id],
    queryFn: () => returnService.getByInvoice(returningInvoice!.id),
    enabled: !!returningInvoice,
  });
  const existingReturns = existingReturnsRes?.data?.data ?? [];

  // Map: invoiceItemId -> total quantity already returned
  const alreadyReturnedMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const r of existingReturns) {
      map[r.invoiceItemId] = (map[r.invoiceItemId] ?? 0) + r.quantity;
    }
    return map;
  }, [existingReturns]);

  // Initialize return line state when dialog opens / returns data loads
  useEffect(() => {
    if (!returningInvoice) {
      setReturnLines({});
      return;
    }
    const initial: Record<number, ReturnLineState> = {};
    for (const item of returningInvoice.items) {
      initial[item.id] = { quantity: 0, refundAmount: 0, reason: "" };
    }
    setReturnLines(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returningInvoice?.id, existingReturnsRes]);

  const handleDownload = async (id: number, num: string) => {
    try {
      const r = await invoiceService.downloadPdf(id);
      downloadBlob(r.data, `${num}.pdf`);
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  const handlePrint = async (id: number) => {
    try {
      const r = await invoiceService.downloadPdf(id);
      printBlob(r.data);
    } catch {
      toast.error("Failed to open print preview");
    }
  };

  const handlePrintReceipt = (invoice: InvoiceResponse) => {
    printReceipt(invoice, shopSettings);
  };

  // ── Return dialog helpers ─────────────────────────────────────

  const availableToReturn = (item: InvoiceItemResponse) => {
    const already = alreadyReturnedMap[item.id] ?? 0;
    return Math.max(0, item.quantity - already);
  };

  // The price printed on the tag/barcode (before any discounts)
  const tagUnitPrice = (item: InvoiceItemResponse) => item.unitPrice;

  // The actual amount the customer paid per unit, after BOTH the item-level
  // discount AND a proportional share of the invoice-level discount.
  // This is the correct basis for refunds.
  const actualUnitPrice = (item: InvoiceItemResponse) => {
    if (!returningInvoice || item.quantity === 0) return 0;
    const netLineTotal = item.lineTotal; // qty*price - item discount
    const subtotal = returningInvoice.subtotal;
    const invoiceDiscount = returningInvoice.discountAmount || 0;

    let proportionalDiscount = 0;
    if (subtotal > 0 && invoiceDiscount > 0) {
      proportionalDiscount = (netLineTotal / subtotal) * invoiceDiscount;
    }

    const actualPaidForLine = netLineTotal - proportionalDiscount;
    return actualPaidForLine / item.quantity;
  };

  const updateReturnLine = (itemId: number, patch: Partial<ReturnLineState>) => {
    setReturnLines((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }));
  };

  const setReturnQuantity = (item: InvoiceItemResponse, qty: number) => {
    const max = availableToReturn(item);
    const clamped = Math.min(max, Math.max(0, qty));
    const unitPrice = actualUnitPrice(item);
    updateReturnLine(item.id, {
      quantity: clamped,
      refundAmount: Math.round(clamped * unitPrice * 100) / 100,
    });
  };

  const returnMutation = useMutation({
    mutationFn: (req: ItemReturnRequest) => returnService.create(req),
  });

  const handleProcessReturns = async () => {
    if (!returningInvoice) return;
    const linesToProcess = returningInvoice.items.filter((item) => (returnLines[item.id]?.quantity ?? 0) > 0);

    if (linesToProcess.length === 0) {
      toast.error("Select at least one item to return");
      return;
    }

    try {
      for (const item of linesToProcess) {
        const line = returnLines[item.id];
        await returnMutation.mutateAsync({
          invoiceId: returningInvoice.id,
          invoiceItemId: item.id,
          quantity: line.quantity,
          refundAmount: line.refundAmount,
          reason: line.reason || undefined,
        });
      }
      toast.success("Return processed successfully");
      qc.invalidateQueries({ queryKey: ["returns-by-invoice", returningInvoice.id] });
      qc.invalidateQueries({ queryKey: ["returns"] });
      qc.invalidateQueries({ queryKey: ["all-variants"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      setReturningInvoice(null);
    } catch {
      toast.error("Failed to process return");
    }
  };

  const totalRefund = Object.values(returnLines).reduce((s, l) => s + (l.refundAmount || 0), 0);

  return (
    <div>
      <PageHeader title="Invoices" subtitle={canViewAll ? "All invoices generated in the system" : "Invoices you have created"} />

      <Card>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={invoices as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search by invoice # or customer..."
            emptyMessage="No invoices found."
            columns={[
              {
                key: "invoiceNumber",
                header: "Invoice #",
                sortable: true,
                render: (r) => {
                  const inv = r as unknown as InvoiceResponse;
                  return (
                    <button className="font-mono text-xs text-primary hover:underline" onClick={() => setHistoryInvoice(inv)} title="View customer history">
                      {inv.invoiceNumber}
                    </button>
                  );
                },
              },
              { key: "customerName", header: "Customer", render: (r) => (r as unknown as InvoiceResponse).customerName || "Walk-in" },
              { key: "invoiceDate", header: "Date", sortable: true, render: (r) => formatDateTime((r as unknown as InvoiceResponse).invoiceDate) },
              { key: "items", header: "Items", render: (r) => <Badge variant="muted">{(r as unknown as InvoiceResponse).items?.length ?? 0}</Badge> },
              { key: "grandTotal", header: "Total", sortable: true, render: (r) => <span className="font-semibold text-text-primary">{formatCurrency((r as unknown as InvoiceResponse).grandTotal)}</span> },
              { key: "createdByUsername", header: "Created By", render: (r) => <span className="text-xs text-text-muted">{(r as unknown as InvoiceResponse).createdByUsername}</span> },
            ]}
            actions={(row) => {
              const inv = row as unknown as InvoiceResponse;
              return (
                <>
                  <Button size="icon-sm" variant="ghost" onClick={() => setViewing(inv)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {canReturn && (
                    <Button size="icon-sm" variant="ghost" onClick={() => setReturningInvoice(inv)} title="Return Items">
                      <Undo2 className="h-3.5 w-3.5 text-warning" />
                    </Button>
                  )}
                  <Button size="icon-sm" variant="ghost" onClick={() => handlePrintReceipt(inv)} title="Print Receipt">
                    <Receipt className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => handlePrint(inv.id)} title="Print PDF">
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => handleDownload(inv.id, inv.invoiceNumber)} title="Download">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </>
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {viewing?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <DialogBody>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-text-muted text-xs">Customer</p>
                  <p className="text-text-primary font-medium">{viewing.customerName || "Walk-in Customer"}</p>
                  {viewing.customerMobile && <p className="text-text-muted text-xs">{viewing.customerMobile}</p>}
                </div>
                <div className="text-right">
                  <p className="text-text-muted text-xs">Date</p>
                  <p className="text-text-primary font-medium">{formatDateTime(viewing.invoiceDate)}</p>
                  <p className="text-text-muted text-xs">By {viewing.createdByUsername}</p>
                </div>
              </div>

              <div className="border border-border/30 rounded-lg overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-card/40 border-b border-border/30">
                      <th className="px-3 py-2 text-left text-xs text-text-muted">Item</th>
                      <th className="px-3 py-2 text-right text-xs text-text-muted">Qty</th>
                      <th className="px-3 py-2 text-right text-xs text-text-muted">Price</th>
                      <th className="px-3 py-2 text-right text-xs text-text-muted">Discount</th>
                      <th className="px-3 py-2 text-right text-xs text-text-muted">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewing.items.map((item) => (
                      <tr key={item.id} className="data-table-row">
                        <td className="px-3 py-2">
                          <p className="text-text-primary">{item.designName}</p>
                          <p className="text-xs text-text-muted">{[item.color, item.size, item.productCode].filter(Boolean).join(" · ")}</p>
                        </td>
                        <td className="px-3 py-2 text-right text-text-secondary">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right text-text-secondary">{formatCurrency(item.discountAmount)}</td>
                        <td className="px-3 py-2 text-right text-text-primary font-medium">{formatCurrency(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-56 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Subtotal</span>
                    <span className="text-text-secondary">{formatCurrency(viewing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Discount</span>
                    <span className="text-text-secondary">{formatCurrency(viewing.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Tax</span>
                    <span className="text-text-secondary">{formatCurrency(viewing.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-border/30 pt-1.5">
                    <span className="text-text-primary">Total</span>
                    <span className="text-primary">{formatCurrency(viewing.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {viewing.notes && <p className="mt-4 text-xs text-text-muted border-t border-border/30 pt-3">Notes: {viewing.notes}</p>}

              <div className="flex flex-wrap gap-2 mt-4">
                {canReturn && (
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      setReturningInvoice(viewing);
                      setViewing(null);
                    }}
                  >
                    <Undo2 className="h-4 w-4" />
                    Return Items
                  </Button>
                )}
                <Button className="flex-1" variant="outline" onClick={() => handlePrintReceipt(viewing)}>
                  <Receipt className="h-4 w-4" />
                  Print Receipt
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => handlePrint(viewing.id)}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button className="flex-1" onClick={() => handleDownload(viewing.id, viewing.invoiceNumber)}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Items Dialog */}
      <Dialog open={!!returningInvoice} onOpenChange={(o) => !o && setReturningInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="h-4 w-4 text-warning" />
              Return Items — {returningInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {returningInvoice && (
            <DialogBody>
              {returnsLoading ? (
                <p className="text-sm text-text-muted text-center py-6">Loading return history...</p>
              ) : (
                <div className="space-y-3">
                  {returningInvoice.items.map((item) => {
                    const already = alreadyReturnedMap[item.id] ?? 0;
                    const available = availableToReturn(item);
                    const line = returnLines[item.id] ?? { quantity: 0, refundAmount: 0, reason: "" };

                    return (
                      <div key={item.id} className="p-3 rounded-lg border border-border/30">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{item.designName}</p>
                            <p className="text-xs text-text-muted">
                              {[item.color, item.size, item.productCode].filter(Boolean).join(" · ")} · Purchased: {item.quantity}
                              {already > 0 && <span className="text-warning"> · Already returned: {already}</span>}
                            </p>
                          </div>
                          {canSeeAmounts && (
                            <div className="text-right whitespace-nowrap">
                              {tagUnitPrice(item) !== actualUnitPrice(item) && <p className="text-xs text-text-muted line-through">{formatCurrency(tagUnitPrice(item))} tag</p>}
                              <p className="text-sm font-medium text-text-secondary">{formatCurrency(actualUnitPrice(item))}/unit paid</p>
                            </div>
                          )}
                        </div>

                        {available === 0 ? (
                          <p className="text-xs text-text-muted italic">Fully returned — nothing left to return.</p>
                        ) : (
                          <div className={`grid grid-cols-2 ${canSeeAmounts ? "sm:grid-cols-3" : ""} gap-2`}>
                            <Input label={`Qty to return (max ${available})`} type="number" min={0} max={available} value={line.quantity || ""} onChange={(e) => setReturnQuantity(item, parseInt(e.target.value) || 0)} />
                            {canSeeAmounts && <Input label="Refund amount (₹)" type="number" min={0} step="0.01" value={line.refundAmount || ""} onChange={(e) => updateReturnLine(item.id, { refundAmount: Math.max(0, parseFloat(e.target.value) || 0) })} disabled={line.quantity === 0} />}
                            <Input label="Reason (optional)" placeholder="e.g. Size issue, damaged" value={line.reason} onChange={(e) => updateReturnLine(item.id, { reason: e.target.value })} disabled={line.quantity === 0} className={canSeeAmounts ? "col-span-2 sm:col-span-1" : ""} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-text-secondary">Returned items will be added back to stock automatically. The original invoice total stays unchanged for record-keeping — refunds are tracked separately and subtracted from sales/profit reports.</p>
                  </div>

                  {canSeeAmounts && (
                    <div className="flex justify-between items-center pt-2 border-t border-border/30">
                      <span className="text-sm text-text-muted">Total refund</span>
                      <span className="text-lg font-bold text-warning">{formatCurrency(totalRefund)}</span>
                    </div>
                  )}
                </div>
              )}
            </DialogBody>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturningInvoice(null)}>
              Cancel
            </Button>
            <Button variant="warning" onClick={handleProcessReturns} loading={returnMutation.isPending} disabled={totalRefund === 0}>
              Process Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer History Dialog */}
      <CustomerHistoryDialog open={!!historyInvoice} onClose={() => setHistoryInvoice(null)} customerId={historyInvoice?.customerId} walkInName={historyInvoice?.customerName} walkInMobile={historyInvoice?.customerMobile} />
    </div>
  );
}
