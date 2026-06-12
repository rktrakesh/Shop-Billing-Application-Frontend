import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollText } from 'lucide-react'
import { auditLogService } from '@/services'
import { Card, CardContent, Badge, SelectField, SelectItem } from '@/components/ui/index'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader } from '@/components/common'
import { formatDateTime } from '@/utils'
import type { AuditLogResponse } from '@/types'

const ACTION_COLORS: Record<string, 'success' | 'danger' | 'warning' | 'primary' | 'muted'> = {
  LOGIN: 'success',
  LOGOUT: 'muted',
  USER_CREATED: 'primary',
  USER_UPDATED: 'primary',
  USER_DISABLED: 'danger',
  USER_ENABLED: 'success',
  PASSWORD_RESET: 'warning',
  PRODUCT_CREATED: 'primary',
  PRODUCT_UPDATED: 'primary',
  PRODUCT_DELETED: 'danger',
  VARIANT_CREATED: 'primary',
  VARIANT_UPDATED: 'primary',
  BARCODE_GENERATED: 'primary',
  INVENTORY_UPDATED: 'warning',
  INVOICE_CREATED: 'success',
  INVOICE_UPDATED: 'primary',
  CUSTOMER_CREATED: 'primary',
  CUSTOMER_UPDATED: 'primary',
  REPORT_GENERATED: 'muted',
  BACKUP_CREATED: 'muted',
  BACKUP_RESTORED: 'warning',
  SETTINGS_UPDATED: 'warning',
}

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState<string>('ALL')

  const { data: res, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditLogService.getAll(),
  })
  const logs = res?.data?.data ?? []

  const actions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action))
    return Array.from(set)
  }, [logs])

  const filtered = actionFilter === 'ALL' ? logs : logs.filter((l) => l.action === actionFilter)

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Track all system activity and user actions"
        actions={
          <SelectField value={actionFilter} onValueChange={setActionFilter} placeholder="Filter by action">
            <SelectItem value="ALL">All Actions</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>)}
          </SelectField>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={filtered as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search by user, description..."
            emptyMessage="No audit logs found."
            pageSize={25}
            columns={[
              {
                key: 'action', header: 'Action',
                render: (r) => {
                  const a = (r as unknown as AuditLogResponse).action
                  return <Badge variant={ACTION_COLORS[a] ?? 'muted'}>{a.replace(/_/g, ' ')}</Badge>
                }
              },
              { key: 'description', header: 'Description' },
              { key: 'performedBy', header: 'User', sortable: true },
              { key: 'ipAddress', header: 'IP Address', render: (r) => <span className="font-mono text-xs">{(r as unknown as AuditLogResponse).ipAddress || '-'}</span> },
              { key: 'createdAt', header: 'Timestamp', sortable: true, render: (r) => formatDateTime((r as unknown as AuditLogResponse).createdAt) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
