import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '-'
  try {
    return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a')
  } catch {
    return dateStr
  }
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    ROLE_ADMIN: 'Admin',
    ROLE_MANAGER: 'Manager',
    ROLE_USER: 'Cashier',
  }
  return map[role] ?? role
}

export function getRoleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    ROLE_ADMIN: 'badge-danger',
    ROLE_MANAGER: 'badge-warning',
    ROLE_USER: 'badge-primary',
  }
  return map[role] ?? 'badge-muted'
}

export function getStockChangeLabel(type: string): string {
  const map: Record<string, string> = {
    ADD: 'Stock Added',
    REDUCE: 'Stock Reduced',
    PURCHASE: 'Purchase',
    SALE: 'Sale',
    RETURN: 'Return',
    ADJUSTMENT: 'Adjustment',
    DAMAGED: 'Damaged',
  }
  return map[type] ?? type
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str
}
