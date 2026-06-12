import { LucideIcon } from 'lucide-react'
import { cn, formatCurrency } from '@/utils'
import { Skeleton } from '@/components/ui/index'
import { TrendingUp, TrendingDown } from 'lucide-react'

// ── Stat Card ─────────────────────────────────────────────────
interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  prefix?: string
  suffix?: string
  trend?: number
  loading?: boolean
  isCurrency?: boolean
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  trend,
  loading,
  isCurrency,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="flex items-start justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <Skeleton className="mt-4 h-7 w-24 rounded" />
        <Skeleton className="mt-1 h-4 w-20 rounded" />
      </div>
    )
  }

  const displayValue = isCurrency
    ? formatCurrency(Number(value))
    : value

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-lg', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-success' : 'text-danger')}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-text-primary">{displayValue}</p>
      <p className="mt-0.5 text-sm text-text-muted">{title}</p>
    </div>
  )
}

// ── Page Header ───────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="p-4 rounded-full bg-card">
        <Icon className="h-8 w-8 text-text-muted" />
      </div>
      <h3 className="text-base font-medium text-text-secondary">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-sm">{description}</p>}
      {action}
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from '@/components/ui/index'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  variant?: 'danger' | 'warning'
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', loading, variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', variant === 'danger' ? 'bg-danger/20' : 'bg-warning/20')}>
              <AlertTriangle className={cn('h-5 w-5', variant === 'danger' ? 'text-danger' : 'text-warning')} />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-text-secondary">{description}</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={variant === 'danger' ? 'destructive' : 'warning'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
