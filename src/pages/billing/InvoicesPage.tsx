import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Eye, Printer } from "lucide-react";
import { invoiceService, downloadBlob, printBlob } from "@/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common";
import { formatCurrency, formatDateTime } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { InvoiceResponse } from "@/types";
import toast from "react-hot-toast";

export default function InvoicesPage() {
  const { isAdmin, isManager } = useAuth();
  const [viewing, setViewing] = useState<InvoiceResponse | null>(null);

  const canViewAll = isAdmin || isManager;

  const { data: res, isLoading } = useQuery({
    queryKey: ["invoices", canViewAll],
    queryFn: () => (canViewAll ? invoiceService.getAll() : invoiceService.getMy()),
  });
  const invoices = res?.data?.data ?? [];

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
              { key: "invoiceNumber", header: "Invoice #", sortable: true, render: (r) => <span className="font-mono text-xs text-primary">{(r as unknown as InvoiceResponse).invoiceNumber}</span> },
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
                  <Button size="icon-sm" variant="ghost" onClick={() => handlePrint(inv.id)} title="Print">
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

              <div className="flex gap-2 mt-4">
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
    </div>
  );
}
