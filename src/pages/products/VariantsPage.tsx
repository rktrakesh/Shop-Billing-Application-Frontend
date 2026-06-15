import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, QrCode, Download, FileDown } from "lucide-react";
import { variantService, productService, barcodeService, downloadBlob } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, SelectField, SelectItem } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader, ConfirmDialog } from "@/components/common";
import { formatCurrency } from "@/utils";
import type { ProductVariantRequest, ProductVariantResponse } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

const schema = z.object({
  productId: z.coerce.number().min(1, "Product is required"),
  productCode: z.string().min(1, "Product code is required"),
  color: z.string().min(1, "Color is required"),
  size: z.string().min(1, "Size is required"),
  sellingPrice: z.coerce.number().min(0.01, "Must be greater than 0"),
  costPrice: z.coerce.number().min(0.01, "Must be greater than 0"),
  stock: z.coerce.number().min(0).default(0),
  minimumStock: z.coerce.number().min(0).default(5),
  imageUrl: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export default function VariantsPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<ProductVariantResponse | null>(null);

  const { data: productsRes } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => productService.getAllIncludingInactive(),
  });
  const products = productsRes?.data?.data ?? [];

  // Fetch all variants in a single call (avoids N+1 per-product requests)
  const { data: variantsRes, isLoading } = useQuery({
    queryKey: ["all-variants"],
    queryFn: () => variantService.getAll(),
  });
  const variants = variantsRes?.data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { stock: 0, minimumStock: 5 },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ stock: 0, minimumStock: 5 });
    setFormOpen(true);
  };
  const openEdit = (v: ProductVariantResponse) => {
    setEditing(v);
    reset({
      productId: v.productId,
      productCode: v.productCode,
      color: v.color,
      size: v.size,
      sellingPrice: v.sellingPrice,
      costPrice: v.costPrice ?? 0,
      stock: v.stock,
      minimumStock: v.minimumStock,
      imageUrl: v.imageUrl,
    });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => (editing ? variantService.update(editing.id, data as ProductVariantRequest) : variantService.create(data as ProductVariantRequest)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-variants"] });
      toast.success(editing ? "Variant updated" : "Variant created");
      setFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => variantService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-variants"] });
      toast.success("Variant deactivated");
      setDeleteId(null);
    },
  });

  const generateBarcodeMutation = useMutation({
    mutationFn: (variantId: number) => barcodeService.generate(variantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-variants"] });
      toast.success("Barcode generated");
    },
  });

  const handleDownloadPng = async (id: number, code: string) => {
    try {
      const res = await barcodeService.downloadPng(id);
      downloadBlob(res.data, `barcode_${code}.png`);
    } catch {
      toast.error("Failed to download");
    }
  };

  const handleDownloadPdf = async (id: number, code: string) => {
    try {
      const res = await barcodeService.downloadPdf(id);
      downloadBlob(res.data, `barcode_${code}.pdf`);
    } catch {
      toast.error("Failed to download");
    }
  };

  return (
    <div>
      <PageHeader
        title="Product Variants"
        subtitle="Manage colors, sizes, pricing, and stock per variant"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Variant
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={variants as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search by code, color, design..."
            emptyMessage="No variants found."
            columns={[
              { key: "designName", header: "Design", sortable: true },
              { key: "productCode", header: "Code", render: (r) => <span className="font-mono text-xs">{(r as unknown as ProductVariantResponse).productCode}</span> },
              { key: "color", header: "Color" },
              { key: "size", header: "Size" },
              {
                key: "barcode",
                header: "Barcode",
                render: (r) => {
                  const v = r as unknown as ProductVariantResponse;
                  return v.barcode ? <span className="font-mono text-xs text-primary">{v.barcode}</span> : <Badge variant="muted">None</Badge>;
                },
              },
              { key: "sellingPrice", header: "Price", sortable: true, render: (r) => formatCurrency((r as unknown as ProductVariantResponse).sellingPrice) },
              ...(isAdmin ? [{ key: "costPrice", header: "Cost", render: (r: Record<string, unknown>) => formatCurrency((r as unknown as ProductVariantResponse).costPrice) }] : []),
              {
                key: "stock",
                header: "Stock",
                sortable: true,
                render: (r) => {
                  const v = r as unknown as ProductVariantResponse;
                  return v.lowStock ? <Badge variant="danger">{v.stock}</Badge> : <span className="text-text-secondary">{v.stock}</span>;
                },
              },
            ]}
            actions={(row) => {
              const v = row as unknown as ProductVariantResponse;
              return (
                <>
                  {!v.barcode ? (
                    <Button size="sm" variant="outline" onClick={() => generateBarcodeMutation.mutate(v.id)} loading={generateBarcodeMutation.isPending}>
                      <QrCode className="h-3 w-3" />
                      Generate
                    </Button>
                  ) : (
                    <>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleDownloadPng(v.id, v.productCode)} title="Download PNG">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleDownloadPdf(v.id, v.productCode)} title="Download PDF">
                        <FileDown className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(v)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setDeleteId(v.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </>
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Variant" : "New Variant"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
            <DialogBody className="space-y-3">
              <Controller
                control={control}
                name="productId"
                render={({ field }) => (
                  <SelectField label="Product *" placeholder="Select product" value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))} error={errors.productId?.message}>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.designName}
                      </SelectItem>
                    ))}
                  </SelectField>
                )}
              />
              <Input label="Product Code *" placeholder="e.g. HW-BLK-XL" error={errors.productCode?.message} {...register("productCode")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Color *" placeholder="e.g. Black" error={errors.color?.message} {...register("color")} />
                <Controller
                  control={control}
                  name="size"
                  render={({ field }) => (
                    <SelectField label="Size *" placeholder="Select size" value={field.value} onValueChange={field.onChange} error={errors.size?.message}>
                      {SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectField>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Selling Price (₹) *" type="number" step="0.01" error={errors.sellingPrice?.message} {...register("sellingPrice")} />
                <Input label="Cost Price (₹) *" type="number" step="0.01" error={errors.costPrice?.message} {...register("costPrice")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Stock" type="number" error={errors.stock?.message} {...register("stock")} />
                <Input label="Minimum Stock" type="number" error={errors.minimumStock?.message} {...register("minimumStock")} />
              </div>
              <Input label="Image URL" placeholder="Optional" {...register("imageUrl")} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saveMutation.isPending}>
                {editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Deactivate Variant"
        description="This variant will be deactivated and hidden from billing."
        confirmLabel="Deactivate"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
