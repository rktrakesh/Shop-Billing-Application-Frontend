import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings, Save, Store } from 'lucide-react'
import { settingsService } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, Textarea } from '@/components/ui/index'
import { PageHeader } from '@/components/common'
import type { ShopSettingsRequest } from '@/types'
import toast from 'react-hot-toast'

const schema = z.object({
  shopName: z.string().min(1, 'Shop name is required'),
  shopAddress: z.string().optional(),
  mobileNumber: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gstNumber: z.string().optional(),
  footerMessage: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function SettingsPage() {
  const qc = useQueryClient()

  const { data: res, isLoading } = useQuery({
    queryKey: ['shop-settings'],
    queryFn: () => settingsService.get(),
  })
  const settings = res?.data?.data

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (settings) {
      reset({
        shopName: settings.shopName,
        shopAddress: settings.shopAddress,
        mobileNumber: settings.mobileNumber,
        email: settings.email,
        gstNumber: settings.gstNumber,
        footerMessage: settings.footerMessage,
      })
    }
  }, [settings, reset])

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => settingsService.update(data as ShopSettingsRequest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-settings'] })
      toast.success('Shop settings updated')
    },
  })

  return (
    <div>
      <PageHeader title="Shop Settings" subtitle="Configure shop information used on invoices and receipts" />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Shop Information
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-text-muted">Loading...</p>
            ) : (
              <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
                <Input label="Shop Name *" error={errors.shopName?.message} {...register('shopName')} />
                <Textarea label="Shop Address" rows={2} {...register('shopAddress')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Mobile Number" {...register('mobileNumber')} />
                  <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
                </div>
                <Input label="GST Number" {...register('gstNumber')} />
                <Textarea label="Invoice Footer Message" rows={2} placeholder="Thank you for shopping with us!" {...register('footerMessage')} />

                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saveMutation.isPending}>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
