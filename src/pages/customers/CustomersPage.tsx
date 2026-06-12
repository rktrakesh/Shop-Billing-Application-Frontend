import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Eye, Users, FileText } from 'lucide-react'
import { customerService } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/index'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader, EmptyState } from '@/components/common'
import { formatCurrency, formatDate } from '@/utils'
import type { CustomerRequest, CustomerResponse } from '@/types'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CustomersPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerResponse | null>(null)
  const [historyCustomer, setHistoryCustomer] = useState<CustomerResponse | null>(null)

  const { data: res, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
  })
  const customers = res?.data?.data ?? []

  const { data: purchasesRes } = useQuery({
    queryKey: ['customer-purchases', historyCustomer?.id],
    queryFn: () => customerService.getPurchaseHistory(historyCustomer!.id),
    enabled: !!historyCustomer,
  })
  const purchases = purchasesRes?.data?.data ?? []

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const openCreate = () => { setEditing(null); reset({}); setFormOpen(true) }
  const openEdit = (c: CustomerResponse) => {
    setEditing(c)
    reset({ name: c.name, mobileNumber: c.mobileNumber, address: c.address })
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing ? customerService.update(editing.id, data as CustomerRequest) : customerService.create(data as CustomerRequest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success(editing ? 'Customer updated' : 'Customer created')
      setFormOpen(false)
    },
  })

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer database"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Customer
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={customers as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search by name or mobile..."
            emptyMessage="No customers found."
            columns={[
              { key: 'name', header: 'Name', sortable: true },
              { key: 'mobileNumber', header: 'Mobile', render: (r) => (r as unknown as CustomerResponse).mobileNumber || '-' },
              { key: 'address', header: 'Address', render: (r) => (r as unknown as CustomerResponse).address || '-' },
              {
                key: 'totalPurchases', header: 'Purchases', sortable: true,
                render: (r) => <Badge variant="primary">{(r as unknown as CustomerResponse).totalPurchases}</Badge>
              },
              { key: 'createdAt', header: 'Customer Since', render: (r) => formatDate((r as unknown as CustomerResponse).createdAt) },
            ]}
            actions={(row) => {
              const c = row as unknown as CustomerResponse
              return (
                <>
                  <Button size="icon-sm" variant="ghost" onClick={() => setHistoryCustomer(c)} title="Purchase History">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(c)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Customer' : 'New Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
            <DialogBody className="space-y-3">
              <Input label="Name *" error={errors.name?.message} {...register('name')} />
              <Input label="Mobile Number" {...register('mobileNumber')} />
              <Input label="Address" {...register('address')} />
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

      {/* Purchase History Dialog */}
      <Dialog open={!!historyCustomer} onOpenChange={(o) => !o && setHistoryCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase History: {historyCustomer?.name}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {purchases.length === 0 ? (
              <EmptyState icon={FileText} title="No purchases yet" />
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {purchases.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                    <div>
                      <p className="text-sm font-mono text-primary">{inv.invoiceNumber}</p>
                      <p className="text-xs text-text-muted">{formatDate(inv.invoiceDate)} · {inv.items.length} items</p>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">{formatCurrency(inv.grandTotal)}</p>
                  </div>
                ))}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}
