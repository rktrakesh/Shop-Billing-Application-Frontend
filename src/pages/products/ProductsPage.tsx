import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, Package } from 'lucide-react'
import { productService } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/index'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader, ConfirmDialog } from '@/components/common'
import { formatDateTime } from '@/utils'
import type { ProductRequest, ProductResponse } from '@/types'
import toast from 'react-hot-toast'

const schema = z.object({
  designName: z.string().min(1, 'Design name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  printType: z.string().min(1, 'Print type is required'),
  active: z.boolean().default(true),
})
type FormData = z.infer<typeof schema>

const CATEGORIES = ['T-Shirt', 'Hoodie', 'Sweatshirt', 'Polo', 'Jacket', 'Shorts', 'Other']
const PRINT_TYPES = ['Screen Print', 'DTF', 'Embroidery', 'Sublimation', 'Heat Transfer', 'Other']

export default function ProductsPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<ProductResponse | null>(null)

  const { data: res, isLoading } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productService.getAllIncludingInactive(),
  })
  const products = res?.data?.data ?? []

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { active: true },
  })

  const openCreate = () => { setEditing(null); reset({ active: true }); setFormOpen(true) }
  const openEdit = (p: ProductResponse) => {
    setEditing(p)
    reset({ designName: p.designName, description: p.description, category: p.category, printType: p.printType, active: p.active })
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing ? productService.update(editing.id, data as ProductRequest) : productService.create(data as ProductRequest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products-all'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success(editing ? 'Product updated' : 'Product created')
      setFormOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products-all'] })
      toast.success('Product deactivated')
      setDeleteId(null)
    },
  })

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalogue"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={products as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search products..."
            emptyMessage="No products found. Create your first product."
            columns={[
              { key: 'designName', header: 'Design Name', sortable: true },
              { key: 'category', header: 'Category', sortable: true, render: (r) => <Badge variant="muted">{(r as unknown as ProductResponse).category}</Badge> },
              { key: 'printType', header: 'Print Type', render: (r) => <span className="text-text-muted text-xs">{(r as unknown as ProductResponse).printType}</span> },
              {
                key: 'active', header: 'Status',
                render: (r) => (r as unknown as ProductResponse).active
                  ? <Badge variant="success">Active</Badge>
                  : <Badge variant="danger">Inactive</Badge>
              },
              { key: 'createdAt', header: 'Created', render: (r) => <span className="text-xs text-text-muted">{formatDateTime((r as unknown as ProductResponse).createdAt)}</span> },
            ]}
            actions={(row) => {
              const p = row as unknown as ProductResponse
              return (
                <>
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(p)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setDeleteId(p.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
            <DialogBody className="space-y-3">
              <Input label="Design Name *" error={errors.designName?.message} {...register('designName')} />
              <Input label="Description" {...register('description')} />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Category *</label>
                  <select
                    className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    {...register('category')}
                  >
                    <option value="">Select...</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="text-xs text-danger">{errors.category.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Print Type *</label>
                  <select
                    className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    {...register('printType')}
                  >
                    <option value="">Select...</option>
                    {PRINT_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.printType && <p className="text-xs text-danger">{errors.printType.message}</p>}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('active')} className="rounded" />
                <span className="text-sm text-text-secondary">Active</span>
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saveMutation.isPending}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Deactivate Product"
        description="This product will be deactivated and hidden from billing. Existing records are preserved."
        confirmLabel="Deactivate"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
