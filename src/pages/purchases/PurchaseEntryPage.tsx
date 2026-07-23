import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ShoppingBag, Receipt } from "lucide-react";
import { supplierService, rawMaterialService, supplierPurchaseService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, SelectField, SelectItem, Textarea, Badge } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common";
import { formatCurrency, formatDate, formatDateTime } from "@/utils";
import type { SupplierPurchaseItemRequest, SupplierPurchaseResponse } from "@/types";
import toast from "react-hot-toast";

interface DraftItem extends SupplierPurchaseItemRequest {
  _id: string;
}

const emptyItem = (): DraftItem => ({ _id: Math.random().toString(36).slice(2), itemName: "", color: "", size: "", quantity: 1, purchasePrice: 0 });

export default function PurchaseEntryPage() {
  const qc = useQueryClient();
  const [supplierId, setSupplierId] = useState<string>("");
  const [billNumber, setBillNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);

  const { data: suppliersRes } = useQuery({ queryKey: ["suppliers"], queryFn: () => supplierService.getAll() });
  const suppliers = suppliersRes?.data?.data ?? [];

  const { data: rawMaterialsRes } = useQuery({ queryKey: ["raw-materials"], queryFn: () => rawMaterialService.getAll() });
  const rawMaterials = rawMaterialsRes?.data?.data ?? [];

  const { data: purchasesRes, isLoading: purchasesLoading } = useQuery({
    queryKey: ["supplier-purchases"],
    queryFn: () => supplierPurchaseService.getAll(),
  });
  const purchases = purchasesRes?.data?.data ?? [];

  const updateItem = (id: string, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (id: string) => setItems((prev) => (prev.length > 1 ? prev.filter((it) => it._id !== id) : prev));

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.purchasePrice) || 0), 0);

  const resetForm = () => {
    setSupplierId("");
    setBillNumber("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setItems([emptyItem()]);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      supplierPurchaseService.create({
        supplierId: Number(supplierId),
        billNumber: billNumber || undefined,
        purchaseDate,
        notes: notes || undefined,
        items: items.map(({ _id, ...rest }) => rest),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-purchases"] });
      qc.invalidateQueries({ queryKey: ["raw-materials"] });
      qc.invalidateQueries({ queryKey: ["raw-materials-all"] });
      toast.success("Purchase recorded — raw material stock updated");
      resetForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to record purchase"),
  });

  const handleSubmit = () => {
    if (!supplierId) return toast.error("Please select a supplier");
    if (!purchaseDate) return toast.error("Please select a purchase date");
    const invalid = items.some((it) => !it.itemName?.trim() || !it.quantity || it.quantity <= 0 || !it.purchasePrice || it.purchasePrice <= 0);
    if (invalid) return toast.error("Every item needs a name, quantity, and purchase price");
    createMutation.mutate();
  };

  return (
    <div>
      <PageHeader title="Purchase Entry" subtitle="Record raw material (blank garment) purchases from suppliers" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> New Purchase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SelectField label="Supplier *" placeholder="Select supplier" value={supplierId} onValueChange={setSupplierId}>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectField>
            <Input label="Bill / Invoice Number" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="e.g. TT-4521" />
            <Input label="Purchase Date *" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-secondary">Items *</label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item._id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-end p-3 rounded-lg bg-card/40 border border-border/30">
                  <Input label="Item Name" placeholder="e.g. Plain Tshirt" list="raw-material-names" value={item.itemName} onChange={(e) => updateItem(item._id, { itemName: e.target.value, rawMaterialId: undefined })} />
                  <Input label="Color" placeholder="e.g. Black" value={item.color} onChange={(e) => updateItem(item._id, { color: e.target.value, rawMaterialId: undefined })} />
                  <Input label="Size" placeholder="e.g. S" value={item.size} onChange={(e) => updateItem(item._id, { size: e.target.value, rawMaterialId: undefined })} />
                  <Input label="Quantity" type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item._id, { quantity: Number(e.target.value) })} />
                  <Input label="Price/Unit" type="number" min={0} step="0.01" value={item.purchasePrice} onChange={(e) => updateItem(item._id, { purchasePrice: Number(e.target.value) })} />
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => removeItem(item._id)}>
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </div>
              ))}
            </div>
            <datalist id="raw-material-names">
              {Array.from(new Set(rawMaterials.map((r) => r.itemName))).map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes about this purchase" />

          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <p className="text-sm text-text-muted">Total Cost</p>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(total)}</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} loading={createMutation.isPending}>
              <Receipt className="h-4 w-4" /> Record Purchase
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            loading={purchasesLoading}
            data={purchases as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search purchases..."
            emptyMessage="No purchases recorded yet."
            columns={[
              { key: "supplierName", header: "Supplier", sortable: true },
              { key: "billNumber", header: "Bill #", render: (r) => <span className="text-text-muted text-xs">{(r as unknown as SupplierPurchaseResponse).billNumber || "-"}</span> },
              { key: "purchaseDate", header: "Date", render: (r) => formatDate((r as unknown as SupplierPurchaseResponse).purchaseDate) },
              { key: "items", header: "Items", render: (r) => <Badge variant="muted">{(r as unknown as SupplierPurchaseResponse).items.length} item(s)</Badge> },
              { key: "totalCost", header: "Total", render: (r) => <span className="font-semibold">{formatCurrency((r as unknown as SupplierPurchaseResponse).totalCost)}</span> },
              { key: "createdByUsername", header: "Recorded By", render: (r) => <span className="text-xs text-text-muted">{(r as unknown as SupplierPurchaseResponse).createdByUsername}</span> },
              { key: "createdAt", header: "Created", render: (r) => <span className="text-xs text-text-muted">{formatDateTime((r as unknown as SupplierPurchaseResponse).createdAt)}</span> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
