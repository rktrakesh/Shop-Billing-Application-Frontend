import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Download, Trash2, FileBarChart, FileText, History } from 'lucide-react'
import { reportService, downloadBlob } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/index'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader, ConfirmDialog } from '@/components/common'
import { formatDate } from '@/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { ReportHistoryResponse, ReportRequest } from '@/types'
import toast from 'react-hot-toast'

const schema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
})
type FormData = z.infer<typeof schema>

export default function ReportsPage() {
  const qc = useQueryClient()
  const { isAdmin } = useAuth()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { data: historyRes, isLoading } = useQuery({
    queryKey: ['report-history'],
    queryFn: () => reportService.getHistory(),
  })
  const history = historyRes?.data?.data ?? []

  const downloadAndSave = (blob: Blob, filename: string) => {
    downloadBlob(blob, filename)
    toast.success('Report downloaded')
  }

  const dailyMutation = useMutation({
    mutationFn: () => reportService.daily(),
    onSuccess: (res) => {
      downloadAndSave(res.data, `daily_report_${new Date().toISOString().slice(0, 10)}.pdf`)
      qc.invalidateQueries({ queryKey: ['report-history'] })
    },
  })
  const monthlyMutation = useMutation({
    mutationFn: () => reportService.monthly(),
    onSuccess: (res) => {
      downloadAndSave(res.data, `monthly_report_${new Date().toISOString().slice(0, 7)}.pdf`)
      qc.invalidateQueries({ queryKey: ['report-history'] })
    },
  })
  const yearlyMutation = useMutation({
    mutationFn: () => reportService.yearly(),
    onSuccess: (res) => {
      downloadAndSave(res.data, `yearly_report_${new Date().getFullYear()}.pdf`)
      qc.invalidateQueries({ queryKey: ['report-history'] })
    },
  })
  const customMutation = useMutation({
    mutationFn: (data: ReportRequest) => reportService.custom(data),
    onSuccess: (res, vars) => {
      downloadAndSave(res.data, `custom_report_${vars.startDate}_${vars.endDate}.pdf`)
      qc.invalidateQueries({ queryKey: ['report-history'] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => reportService.deleteHistory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-history'] })
      toast.success('Report deleted')
      setDeleteId(null)
    },
  })

  const handleHistoryDownload = async (id: number) => {
    try {
      const res = await reportService.downloadHistory(id)
      downloadBlob(res.data, `report_${id}.pdf`)
    } catch { toast.error('Failed to download') }
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and download sales reports" />

      {/* Quick reports */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex flex-col items-center text-center gap-3 py-6">
            <div className="p-3 rounded-full bg-primary/10">
              <FileBarChart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Daily Report</p>
              <p className="text-xs text-text-muted">Today's sales summary</p>
            </div>
            <Button onClick={() => dailyMutation.mutate()} loading={dailyMutation.isPending} className="w-full">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center text-center gap-3 py-6">
            <div className="p-3 rounded-full bg-success/10">
              <FileBarChart className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Monthly Report</p>
              <p className="text-xs text-text-muted">This month's sales summary</p>
            </div>
            <Button onClick={() => monthlyMutation.mutate()} loading={monthlyMutation.isPending} className="w-full" variant="success">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center text-center gap-3 py-6">
            <div className="p-3 rounded-full bg-warning/10">
              <FileBarChart className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Yearly Report</p>
              <p className="text-xs text-text-muted">This year's sales summary</p>
            </div>
            <Button onClick={() => yearlyMutation.mutate()} loading={yearlyMutation.isPending} className="w-full" variant="warning">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Custom report */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Custom Date Range Report
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => customMutation.mutate(d))} className="flex flex-col sm:flex-row items-end gap-3">
            <Input label="Start Date *" type="date" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="End Date *" type="date" error={errors.endDate?.message} {...register('endDate')} />
            <Button type="submit" loading={customMutation.isPending}>
              <Download className="h-4 w-4" />
              Generate Report
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Report History
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={history as unknown as Record<string, unknown>[]}
            searchable={false}
            emptyMessage="No reports generated yet."
            columns={[
              { key: 'reportType', header: 'Type', render: (r) => <span className="capitalize">{(r as unknown as ReportHistoryResponse).reportType?.toLowerCase()}</span> },
              { key: 'startDate', header: 'Start Date', render: (r) => formatDate((r as unknown as ReportHistoryResponse).startDate) },
              { key: 'endDate', header: 'End Date', render: (r) => formatDate((r as unknown as ReportHistoryResponse).endDate) },
              { key: 'generatedBy', header: 'Generated By' },
              { key: 'createdAt', header: 'Generated On', render: (r) => formatDate((r as unknown as ReportHistoryResponse).createdAt) },
            ]}
            actions={(row) => {
              const r = row as unknown as ReportHistoryResponse
              return (
                <>
                  <Button size="icon-sm" variant="ghost" onClick={() => handleHistoryDownload(r.id)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {isAdmin && (
                    <Button size="icon-sm" variant="ghost" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  )}
                </>
              )
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Report"
        description="This will permanently remove this report from history."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
