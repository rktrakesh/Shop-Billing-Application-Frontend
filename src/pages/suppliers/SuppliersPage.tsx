import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Truck } from "lucide-react";
import { supplierService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, Textarea } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader, ConfirmDialog } from "@/components/common";
import { formatDateTime } from "@/utils";
import type { SupplierRequest, SupplierResponse } from "@/types";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function SuppliersPage() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<SupplierResponse | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ["suppliers-all"],
    queryFn: () => supplierService.getAllIncludingInactive(),
  });
  const suppliers = res?.data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    setEditing(null);
    reset({});
    setFormOpen(true);
  };
  const openEdit = (s: SupplierResponse) => {
    setEditing(s);
    reset({ name: s.name, mobileNumber: s.mobileNumber, address: s.address, notes: s.notes });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => (editing ? supplierService.update(editing.id, data as SupplierRequest) : supplierService.create(data as SupplierRequest)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers-all"] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(editing ? "Supplier updated" : "Supplier added");
      setFormOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save supplier"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => supplierService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers-all"] });
      toast.success("Supplier deactivated");
      setDeleteId(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Manage the suppliers you buy raw materials from"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Supplier
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={suppliers as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search suppliers..."
            emptyMessage="No suppliers yet. Add your first supplier."
            columns={[
              {
                key: "name",
                header: "Name",
                sortable: true,
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-text-muted" />
                    <span className="font-medium">{(r as unknown as SupplierResponse).name}</span>
                  </div>
                ),
              },
              { key: "mobileNumber", header: "Mobile", render: (r) => <span className="text-text-muted text-xs">{(r as unknown as SupplierResponse).mobileNumber || "-"}</span> },
              { key: "address", header: "Address", render: (r) => <span className="text-text-muted text-xs">{(r as unknown as SupplierResponse).address || "-"}</span> },
              {
                key: "active",
                header: "Status",
                render: (r) => ((r as unknown as SupplierResponse).active ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>),
              },
              { key: "createdAt", header: "Added", render: (r) => <span className="text-xs text-text-muted">{formatDateTime((r as unknown as SupplierResponse).createdAt)}</span> },
            ]}
            actions={(row) => {
              const s = row as unknown as SupplierResponse;
              return (
                <>
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(s)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setDeleteId(s.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </>
              );
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Supplier" : "New Supplier"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
            <DialogBody className="space-y-3">
              <Input label="Supplier Name *" error={errors.name?.message} {...register("name")} />
              <Input label="Mobile Number" {...register("mobileNumber")} />
              <Input label="Address" {...register("address")} />
              <Textarea label="Notes" {...register("notes")} />
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
        title="Deactivate Supplier"
        description="This supplier will be hidden from new purchases. Existing purchase records are preserved."
        confirmLabel="Deactivate"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
