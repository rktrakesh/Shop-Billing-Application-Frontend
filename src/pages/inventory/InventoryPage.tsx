import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Warehouse, AlertTriangle, History, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { variantService, productService, inventoryService } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card, CardHeader, CardTitle, CardContent, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
  SelectField, SelectItem,
} from '@/components/ui/index'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader, EmptyState } from '@/components/common'
import { formatDateTime, getStockChangeLabel } from '@/utils'
import type { ProductVariantResponse, StockAdjustmentRequest, StockChangeType } from '@/types'
import toast from 'react-hot-toast'

const schema = z.object({
  productVariantId: z.coerce.number(),
  changeType: z.enum(['ADD', 'REDUCE', 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGED']),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const CHANGE_TYPES: StockChangeType[] = ['ADD', 'REDUCE', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'DAMAGED']

export default function InventoryPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'all' | 'low'>('all')
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [historyVariant, setHistoryVariant] = useState<ProductVariantResponse | null>(null)

  const { data: productsRes } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productService.getAllIncludingInactive(),
  })
  const products = productsRes?.data?.data ?? []

  const { data: allVariantsRes, isLoading: allLoading } = useQuery({
    queryKey: ['all-variants', products.map(p => p.id)],
    queryFn: async () => {
      const all = await Promise.all(products.map((p) => variantService.getByProduct(p.id)))
      return all.flatMap((r) => r.data.data ?? [])
    },
    enabled: products.length > 0,
  })
  const allVariants = allVariantsRes ?? []

  const { data: lowStockRes, isLoading: lowLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryService.getLowStock(),
  })
  const lowStock = lowStockRes?.data?.data ?? []

  const { data: movementsRes } = useQuery({
    queryKey: ['movements', historyVariant?.id],
    queryFn: () => inventoryService.getMovements(historyVariant!.id),
    enabled: !!historyVariant,
  })
  const movements = movementsRes?.data?.data ?? []

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const adjustMutation = useMutation({
    mutationFn: (data: FormData) => inventoryService.adjust(data as StockAdjustmentRequest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-variants'] })
      qc.invalidateQueries({ queryKey: ['low-stock'] })
      toast.success('Stock adjusted')
      setAdjustOpen(false)
      reset()
    },
  })

  const dataset = tab === 'all' ? allVariants : lowStock
  const loading = tab === 'all' ? allLoading : lowLoading

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels and adjustments"
        actions={
          <Button onClick={() => { reset(); setAdjustOpen(true) }}>
            <Warehouse className="h-4 w-4" />
            Adjust Stock
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'all' ? 'bg-primary text-white' : 'bg-card text-text-secondary hover:bg-card-hover'}`}
        >
          All Stock
        </button>
        <button
          onClick={() => setTab('low')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${tab === 'low' ? 'bg-danger text-white' : 'bg-card text-text-secondary hover:bg-card-hover'}`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Low Stock {lowStock.length > 0 && `(${lowStock.length})`}
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            loading={loading}
            data={dataset as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search by product, code, color..."
            emptyMessage={tab === 'low' ? 'No low-stock items 🎉' : 'No inventory found.'}
            columns={[
              { key: 'designName', header: 'Product', sortable: true },
              { key: 'productCode', header: 'Code', render: (r) => <span className="font-mono text-xs">{(r as unknown as ProductVariantResponse).productCode}</span> },
              { key: 'color', header: 'Color' },
              { key: 'size', header: 'Size' },
              {
                key: 'stock', header: 'Current Stock', sortable: true,
                render: (r) => {
                  const v = r as unknown as ProductVariantResponse
                  return v.lowStock ? <Badge variant="danger">{v.stock}</Badge> : <Badge variant="success">{v.stock}</Badge>
                }
              },
              { key: 'minimumStock', header: 'Min Stock' },
            ]}
            actions={(row) => {
              const v = row as unknown as ProductVariantResponse
              return (
                <Button size="sm" variant="outline" onClick={() => setHistoryVariant(v)}>
                  <History className="h-3.5 w-3.5" />
                  History
                </Button>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustOpen} onOpenChange={(o) => !o && setAdjustOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => adjustMutation.mutate(d))}>
            <DialogBody className="space-y-3">
              <Controller
                control={control}
                name="productVariantId"
                render={({ field }) => (
                  <SelectField
                    label="Product Variant *"
                    placeholder="Select variant"
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                    error={errors.productVariantId?.message}
                  >
                    {allVariants.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.designName} — {v.color}/{v.size} ({v.productCode}) · Stock: {v.stock}
                      </SelectItem>
                    ))}
                  </SelectField>
                )}
              />
              <Controller
                control={control}
                name="changeType"
                render={({ field }) => (
                  <SelectField label="Change Type *" placeholder="Select type" value={field.value} onValueChange={field.onChange} error={errors.changeType?.message}>
                    {CHANGE_TYPES.map((t) => <SelectItem key={t} value={t}>{getStockChangeLabel(t)}</SelectItem>)}
                  </SelectField>
                )}
              />
              <Input label="Quantity *" type="number" min={1} error={errors.quantity?.message} {...register('quantity')} />
              <Input label="Reason" placeholder="e.g. New stock arrival, damaged in transit" {...register('reason')} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
              <Button type="submit" loading={adjustMutation.isPending}>Save Adjustment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={!!historyVariant} onOpenChange={(o) => !o && setHistoryVariant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Stock History: {historyVariant?.designName} ({historyVariant?.color}/{historyVariant?.size})
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {movements.length === 0 ? (
              <EmptyState icon={History} title="No stock movements yet" />
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                    <div className="flex items-center gap-3">
                      {['ADD', 'PURCHASE', 'RETURN'].includes(m.changeType) ? (
                        <ArrowUpCircle className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-danger" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-text-primary">{getStockChangeLabel(m.changeType)}</p>
                        <p className="text-xs text-text-muted">{m.reason || 'No reason given'} · by {m.createdBy}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text-primary">
                        {m.stockBefore} → {m.stockAfter}
                      </p>
                      <p className="text-xs text-text-muted">{formatDateTime(m.createdAt)}</p>
                    </div>
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
