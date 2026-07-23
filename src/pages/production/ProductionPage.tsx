import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Factory, Sparkles, CheckCircle2 } from "lucide-react";
import { rawMaterialService, productionService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, SelectField, SelectItem, Textarea, Badge } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common";
import { formatCurrency, formatDate, formatDateTime } from "@/utils";
import type { ProductionBatchResponse } from "@/types";
import toast from "react-hot-toast";

const CATEGORIES = ["T-Shirt", "Hoodie", "Sweatshirt", "Polo", "Jacket", "Shorts", "Other"];
const PRINTING_TYPES = ["DTF", "Sublimation", "Stitching", "Other"];

export default function ProductionPage() {
  const qc = useQueryClient();

  const [rawMaterialId, setRawMaterialId] = useState("");
  const [quantityUsed, setQuantityUsed] = useState<number>(1);
  const [designName, setDesignName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("T-Shirt");
  const [printingType, setPrintingType] = useState("DTF");
  const [customPrintingType, setCustomPrintingType] = useState("");
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [minimumStock, setMinimumStock] = useState<number>(5);
  const [printingCostTotal, setPrintingCostTotal] = useState<number>(0);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lastResult, setLastResult] = useState<ProductionBatchResponse | null>(null);

  const { data: rawMaterialsRes } = useQuery({ queryKey: ["raw-materials"], queryFn: () => rawMaterialService.getAll() });
  const rawMaterials = (rawMaterialsRes?.data?.data ?? []).filter((r) => r.stock > 0);
  const selectedRawMaterial = rawMaterials.find((r) => String(r.id) === rawMaterialId);

  const { data: batchesRes, isLoading: batchesLoading } = useQuery({
    queryKey: ["production-batches"],
    queryFn: () => productionService.getAll(),
  });
  const batches = batchesRes?.data?.data ?? [];

  const printingCostPerUnit = quantityUsed > 0 ? printingCostTotal / quantityUsed : 0;
  const estimatedCostPrice = (selectedRawMaterial?.averageCostPrice ?? 0) + printingCostPerUnit;

  const resetForm = () => {
    setRawMaterialId("");
    setQuantityUsed(1);
    setDesignName("");
    setDescription("");
    setCategory("T-Shirt");
    setPrintingType("DTF");
    setCustomPrintingType("");
    setSellingPrice(0);
    setMinimumStock(5);
    setPrintingCostTotal(0);
    setProductionDate(new Date().toISOString().slice(0, 10));
    setNotes("");
  };

  const createMutation = useMutation({
    mutationFn: () =>
      productionService.create({
        rawMaterialId: Number(rawMaterialId),
        quantityUsed,
        designName,
        description: description || undefined,
        category,
        printingType,
        customPrintingType: printingType === "Other" ? customPrintingType : undefined,
        sellingPrice,
        minimumStock,
        printingCostTotal,
        productionDate,
        notes: notes || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["production-batches"] });
      qc.invalidateQueries({ queryKey: ["raw-materials"] });
      qc.invalidateQueries({ queryKey: ["raw-materials-all"] });
      qc.invalidateQueries({ queryKey: ["variants"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      const batch = res.data.data;
      setLastResult(batch);
      toast.success(`"${batch.producedVariant.designName}" created — barcode ${batch.producedVariant.barcode ?? batch.producedVariant.productCode}`);
      resetForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create production batch"),
  });

  const handleSubmit = () => {
    if (!rawMaterialId) return toast.error("Please select a raw material");
    if (!quantityUsed || quantityUsed <= 0) return toast.error("Quantity used must be at least 1");
    if (selectedRawMaterial && quantityUsed > selectedRawMaterial.stock) {
      return toast.error(`Only ${selectedRawMaterial.stock} in stock for this raw material`);
    }
    if (!designName.trim()) return toast.error("Design name is required");
    if (printingType === "Other" && !customPrintingType.trim()) return toast.error("Please specify the printing type");
    if (!sellingPrice || sellingPrice <= 0) return toast.error("Selling price is required");
    createMutation.mutate();
  };

  return (
    <div>
      <PageHeader title="Production" subtitle="Turn blank raw materials into finished, barcoded products" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-4 w-4" /> New Production Batch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SelectField label="Raw Material *" placeholder="Select blank garment to use" value={rawMaterialId} onValueChange={setRawMaterialId}>
              {rawMaterials.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.itemName} — {r.color} / {r.size} (stock: {r.stock}, avg cost: {formatCurrency(r.averageCostPrice)})
                </SelectItem>
              ))}
            </SelectField>
            <Input label={`Quantity Used *${selectedRawMaterial ? ` (available: ${selectedRawMaterial.stock})` : ""}`} type="number" min={1} max={selectedRawMaterial?.stock} value={quantityUsed} onChange={(e) => setQuantityUsed(Number(e.target.value))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Design Name *" placeholder="e.g. Hanuman Warrior" value={designName} onChange={(e) => setDesignName(e.target.value)} />
            <SelectField label="Category *" value={category} onValueChange={setCategory}>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectField>
          </div>

          <Textarea label="Description" placeholder="Optional" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SelectField label="Printing Type *" value={printingType} onValueChange={setPrintingType}>
              {PRINTING_TYPES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectField>
            {printingType === "Other" && <Input label="Specify Printing Type *" placeholder="e.g. Vinyl Print" value={customPrintingType} onChange={(e) => setCustomPrintingType(e.target.value)} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Total Printing Cost (₹) *" type="number" min={0} step="0.01" value={printingCostTotal} onChange={(e) => setPrintingCostTotal(Number(e.target.value))} />
            <Input label="Selling Price (per piece) *" type="number" min={0} step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} />
            <Input label="Minimum Stock Alert" type="number" min={0} value={minimumStock} onChange={(e) => setMinimumStock(Number(e.target.value))} />
          </div>

          <Input label="Production Date" type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} />
          <Textarea label="Notes" placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />

          {selectedRawMaterial && quantityUsed > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Raw material cost/unit</span>
                <span>{formatCurrency(selectedRawMaterial.averageCostPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Printing cost/unit</span>
                <span>{formatCurrency(printingCostPerUnit)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-primary/20 pt-1">
                <span>Estimated cost price</span>
                <span>{formatCurrency(estimatedCostPrice)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} loading={createMutation.isPending}>
              <Sparkles className="h-4 w-4" /> Create Production Batch
            </Button>
          </div>

          {lastResult && (
            <div className="rounded-lg bg-success/5 border border-success/30 p-4 space-y-1">
              <div className="flex items-center gap-2 text-success font-medium text-sm">
                <CheckCircle2 className="h-4 w-4" /> Product created successfully
              </div>
              <p className="text-sm">
                <span className="font-semibold">{lastResult.producedVariant.designName}</span> — {lastResult.producedVariant.color}, {lastResult.producedVariant.size}
              </p>
              <p className="text-xs text-text-muted">
                Code: {lastResult.producedVariant.productCode} · Barcode: {lastResult.producedVariant.barcode || "generating..."} · Stock: {lastResult.producedVariant.stock}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            loading={batchesLoading}
            data={batches as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search production batches..."
            emptyMessage="No production batches yet."
            columns={[
              { key: "rawMaterialName", header: "Raw Material", sortable: true },
              {
                key: "producedVariant",
                header: "Finished Product",
                render: (r) => {
                  const b = r as unknown as ProductionBatchResponse;
                  return (
                    <span className="font-medium">
                      {b.producedVariant.designName}{" "}
                      <span className="text-text-muted text-xs">
                        ({b.producedVariant.color}, {b.producedVariant.size})
                      </span>
                    </span>
                  );
                },
              },
              { key: "quantityUsed", header: "Qty", render: (r) => <Badge variant="muted">{(r as unknown as ProductionBatchResponse).quantityUsed}</Badge> },
              { key: "printingType", header: "Printing" },
              { key: "printingCostTotal", header: "Print Cost", render: (r) => formatCurrency((r as unknown as ProductionBatchResponse).printingCostTotal) },
              { key: "productionDate", header: "Date", render: (r) => formatDate((r as unknown as ProductionBatchResponse).productionDate) },
              { key: "createdByUsername", header: "By", render: (r) => <span className="text-xs text-text-muted">{(r as unknown as ProductionBatchResponse).createdByUsername}</span> },
              { key: "createdAt", header: "Created", render: (r) => <span className="text-xs text-text-muted">{formatDateTime((r as unknown as ProductionBatchResponse).createdAt)}</span> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
