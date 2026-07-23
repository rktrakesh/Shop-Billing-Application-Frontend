import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Receipt, Repeat, AlertCircle } from "lucide-react";
import { expenseService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, SelectField, SelectItem, Textarea } from "@/components/ui/index";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader, ConfirmDialog } from "@/components/common";
import { formatCurrency, formatDate, formatDateTime } from "@/utils";
import type { ExpenseRequest, ExpenseResponse } from "@/types";
import toast from "react-hot-toast";

const DEFAULT_CATEGORIES = ["Rent", "Electricity", "Staff Salary", "Transport", "Packaging", "Maintenance", "Other"];

const emptyForm = (): ExpenseRequest => ({
  expenseDate: new Date().toISOString().slice(0, 10),
  category: "Rent",
  customCategory: "",
  amount: 0,
  notes: "",
  receiptImagePath: "",
  recurring: false,
});

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseResponse | null>(null);
  const [form, setForm] = useState<ExpenseRequest>(emptyForm());

  const { data: categoriesRes } = useQuery({ queryKey: ["expense-categories"], queryFn: () => expenseService.getCategories() });
  const categories = Array.from(new Set([...(categoriesRes?.data?.data ?? []), ...DEFAULT_CATEGORIES]));

  const { data: expensesRes, isLoading } = useQuery({ queryKey: ["expenses"], queryFn: () => expenseService.getAll() });
  const expenses = expensesRes?.data?.data ?? [];

  const totalThisMonth = expenses.filter((e) => e.expenseDate.slice(0, 7) === new Date().toISOString().slice(0, 7)).reduce((sum, e) => sum + e.amount, 0);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };
  const openEdit = (e: ExpenseResponse) => {
    setEditing(e);
    setForm({
      expenseDate: e.expenseDate,
      category: DEFAULT_CATEGORIES.includes(e.category) ? e.category : "Other",
      customCategory: DEFAULT_CATEGORIES.includes(e.category) ? "" : e.category,
      amount: e.amount,
      notes: e.notes ?? "",
      receiptImagePath: e.receiptImagePath ?? "",
      recurring: e.recurring,
    });
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => (editing ? expenseService.update(editing.id, form) : expenseService.create(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success(editing ? "Expense updated" : "Expense recorded");
      setFormOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to save expense"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expenseService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete expense");
      setDeleteTarget(null);
    },
  });

  const handleSubmit = () => {
    if (!form.expenseDate) return toast.error("Please select a date");
    if (form.category === "Other" && !form.customCategory?.trim()) return toast.error("Please specify the expense category");
    if (!form.amount || form.amount <= 0) return toast.error("Amount must be greater than 0");
    saveMutation.mutate();
  };

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Track monthly business expenses — feeds directly into your Profit Summary"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Expense
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-text-muted">This Month's Expenses</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalThisMonth)}</p>
          </div>
          <Receipt className="h-8 w-8 text-primary/40" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={expenses as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search expenses..."
            emptyMessage="No expenses recorded yet."
            columns={[
              { key: "expenseDate", header: "Date", sortable: true, render: (r) => formatDate((r as unknown as ExpenseResponse).expenseDate) },
              {
                key: "category",
                header: "Category",
                render: (r) => {
                  const e = r as unknown as ExpenseResponse;
                  return (
                    <div className="flex items-center gap-1.5">
                      <span>{e.category}</span>
                      {e.recurring && (
                        <span title="Recurring monthly">
                          <Repeat className="h-3.5 w-3.5 text-primary" />
                        </span>
                      )}
                      {e.recurringSourceId && <Badge variant="muted">Auto</Badge>}
                    </div>
                  );
                },
              },
              { key: "amount", header: "Amount", sortable: true, render: (r) => <span className="font-semibold">{formatCurrency((r as unknown as ExpenseResponse).amount)}</span> },
              { key: "notes", header: "Notes", render: (r) => <span className="text-text-muted text-xs">{(r as unknown as ExpenseResponse).notes || "-"}</span> },
              { key: "createdByUsername", header: "Recorded By", render: (r) => <span className="text-xs text-text-muted">{(r as unknown as ExpenseResponse).createdByUsername}</span> },
              { key: "createdAt", header: "Created", render: (r) => <span className="text-xs text-text-muted">{formatDateTime((r as unknown as ExpenseResponse).createdAt)}</span> },
            ]}
            actions={(row) => {
              const e = row as unknown as ExpenseResponse;
              return (
                <>
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(e)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" title={e.deletable ? "Delete" : "Only deletable on the day it was created"} onClick={() => setDeleteTarget(e)}>
                    <Trash2 className={`h-3.5 w-3.5 ${e.deletable ? "text-danger" : "text-text-muted/40"}`} />
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
            <DialogTitle>{editing ? "Edit Expense" : "New Expense"}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Date *" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
              <SelectField label="Category *" value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectField>
            </div>

            {form.category === "Other" && <Input label="Specify Category *" placeholder="e.g. Equipment Repair" value={form.customCategory} onChange={(e) => setForm({ ...form, customCategory: e.target.value })} />}

            <Input label="Amount (₹) *" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            <Textarea label="Notes" placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Input label="Receipt Image URL (optional)" placeholder="Paste a link to the bill/receipt image" value={form.receiptImagePath} onChange={(e) => setForm({ ...form, receiptImagePath: e.target.value })} />

            <label className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border/30 cursor-pointer">
              <div>
                <p className="text-sm font-medium">Repeat monthly</p>
                <p className="text-xs text-text-muted">Auto-creates this expense again next month (e.g. rent, salary)</p>
              </div>
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} />
            </label>

            {editing && !editing.deletable && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/30 text-xs text-text-muted">
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span>This entry is from a previous day. It can still be edited, but the change will be recorded in the audit log, and it can no longer be deleted.</span>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saveMutation.isPending}>
              {editing ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteTarget.deletable && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Expense"
        description={deleteTarget && !deleteTarget.deletable ? "This expense was recorded on a previous day and can no longer be deleted — it's kept for audit purposes. You can still edit it if needed." : "Are you sure you want to delete this expense?"}
        confirmLabel={deleteTarget?.deletable ? "Delete" : "OK"}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
