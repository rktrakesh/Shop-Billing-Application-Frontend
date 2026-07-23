import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Boxes, Settings2, History, AlertTriangle } from "lucide-react";
import { rawMaterialService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, Textarea } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common";
import { formatCurrency, formatDateTime } from "@/utils";
import type { RawMaterialResponse } from "@/types";
import toast from "react-hot-toast";

const adjustSchema = z.object({
  newStock: z.coerce.number().min(0, "Stock cannot be negative"),
  reason: z.string().optional(),
});
type AdjustFormData = z.infer<typeof adjustSchema>;

export default function RawMaterialsPage() {
  const qc = useQueryClient();
  const [adjusting, setAdjusting] = useState<RawMaterialResponse | null>(null);
  const [historyFor, setHistoryFor] = useState<RawMaterialResponse | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ["raw-materials-all"],
    queryFn: () => rawMaterialService.getAllIncludingInactive(),
  });
  const rawMaterials = res?.data?.data ?? [];

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ["raw-material-movements", historyFor?.id],
    queryFn: () => rawMaterialService.getMovements(historyFor!.id),
    enabled: !!historyFor,
  });
  const movements = historyRes?.data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema),
  });

  const openAdjust = (rm: RawMaterialResponse) => {
    setAdjusting(rm);
    reset({ newStock: rm.stock, reason: "" });
  };

  const adjustMutation = useMutation({
    mutationFn: (data: AdjustFormData) => rawMaterialService.adjustStock({ rawMaterialId: adjusting!.id, newStock: data.newStock, reason: data.reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["raw-materials-all"] });
      qc.invalidateQueries({ queryKey: ["raw-materials"] });
      toast.success("Stock adjusted");
      setAdjusting(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to adjust stock"),
  });

  return (
    <div>
      <PageHeader title="Raw Materials" subtitle="Blank garment stock — bought from suppliers, consumed during production" />

      <Card>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={rawMaterials as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search raw materials..."
            emptyMessage="No raw materials yet. Record a supplier purchase to add stock."
            columns={[
              {
                key: "itemName",
                header: "Item",
                sortable: true,
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <Boxes className="h-3.5 w-3.5 text-text-muted" />
                    <span className="font-medium">{(r as unknown as RawMaterialResponse).itemName}</span>
                  </div>
                ),
              },
              { key: "color", header: "Color", render: (r) => <span className="text-text-muted text-xs">{(r as unknown as RawMaterialResponse).color || "-"}</span> },
              { key: "size", header: "Size", render: (r) => <span className="text-text-muted text-xs">{(r as unknown as RawMaterialResponse).size || "-"}</span> },
              {
                key: "stock",
                header: "Stock",
                sortable: true,
                render: (r) => {
                  const rm = r as unknown as RawMaterialResponse;
                  return (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{rm.stock}</span>
                      {rm.lowStock && (
                        <span title="Low stock">
                          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        </span>
                      )}
                    </div>
                  );
                },
              },
              { key: "averageCostPrice", header: "Avg Cost/Unit", render: (r) => <span>{formatCurrency((r as unknown as RawMaterialResponse).averageCostPrice)}</span> },
              {
                key: "active",
                header: "Status",
                render: (r) => ((r as unknown as RawMaterialResponse).active ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>),
              },
              { key: "updatedAt", header: "Last Updated", render: (r) => <span className="text-xs text-text-muted">{formatDateTime((r as unknown as RawMaterialResponse).updatedAt)}</span> },
            ]}
            actions={(row) => {
              const rm = row as unknown as RawMaterialResponse;
              return (
                <>
                  <Button size="icon-sm" variant="ghost" title="Adjust stock" onClick={() => openAdjust(rm)}>
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" title="Movement history" onClick={() => setHistoryFor(rm)}>
                    <History className="h-3.5 w-3.5" />
                  </Button>
                </>
              );
            }}
          />
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={!!adjusting} onOpenChange={(o) => !o && setAdjusting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Adjust Stock — {adjusting?.itemName} ({adjusting?.color}, {adjusting?.size})
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => adjustMutation.mutate(d))}>
            <DialogBody className="space-y-3">
              <p className="text-xs text-text-muted">
                Current stock: <span className="font-semibold text-text-primary">{adjusting?.stock}</span>. Use this only for corrections (e.g. damaged goods, stock count fix) — normal usage is tracked automatically via purchases and production.
              </p>
              <Input label="New Stock Quantity *" type="number" min={0} error={errors.newStock?.message} {...register("newStock")} />
              <Textarea label="Reason" placeholder="e.g. Damaged in storage" {...register("reason")} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjusting(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={adjustMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Movement History Dialog */}
      <Dialog open={!!historyFor} onOpenChange={(o) => !o && setHistoryFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Stock History — {historyFor?.itemName} ({historyFor?.color}, {historyFor?.size})
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {historyLoading ? (
              <p className="text-sm text-text-muted">Loading...</p>
            ) : movements.length === 0 ? (
              <p className="text-sm text-text-muted">No movements recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-card/40 border border-border/30 text-sm">
                    <div>
                      <Badge variant={m.changeType === "PURCHASE" ? "success" : m.changeType === "PRODUCTION_USE" ? "warning" : "muted"}>{m.changeType.replace("_", " ")}</Badge>
                      {m.reason && <p className="text-xs text-text-muted mt-1">{m.reason}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {m.stockBefore} → {m.stockAfter}
                      </p>
                      <p className="text-xs text-text-muted">{formatDateTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryFor(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
