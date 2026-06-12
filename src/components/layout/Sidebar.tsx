import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Package, Layers, Warehouse, Users,
  BarChart2, TrendingUp, UserCog, Settings, FileText, QrCode,
  ChevronLeft, ChevronRight, Shirt,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn, getRoleLabel, getRoleBadgeClass } from '@/utils'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  roles?: ('ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_USER')[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard', roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
  { label: 'Billing', icon: ShoppingCart, to: '/billing' },
  { label: 'Products', icon: Package, to: '/products', roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
  { label: 'Variants', icon: Layers, to: '/variants', roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
  { label: 'Inventory', icon: Warehouse, to: '/inventory', roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
  { label: 'Barcodes', icon: QrCode, to: '/barcodes', roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
  { label: 'Customers', icon: Users, to: '/customers' },
  { label: 'Invoices', icon: FileText, to: '/invoices' },
  { label: 'Reports', icon: BarChart2, to: '/reports', roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },
  { label: 'Profit', icon: TrendingUp, to: '/profit', roles: ['ROLE_ADMIN'] },
  { label: 'Users', icon: UserCog, to: '/users', roles: ['ROLE_ADMIN'] },
  { label: 'Settings', icon: Settings, to: '/settings', roles: ['ROLE_ADMIN'] },
  { label: 'Audit Logs', icon: FileText, to: '/audit', roles: ['ROLE_ADMIN'] },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(user?.role as 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_USER')
  })

  const roleLabel = getRoleLabel(user?.role ?? '')
  const roleBadge = getRoleBadgeClass(user?.role ?? '')

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-border/30', collapsed && 'justify-center px-3')}>
        <div className="flex-shrink-0 w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
          <Shirt className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary leading-tight">RKT APPARELS</p>
            <p className="text-[10px] text-text-muted leading-tight truncate">Billing System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'nav-item',
                isActive && 'nav-item-active',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {!collapsed && (
        <div className="p-3 border-t border-border/30">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-card/40">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-primary truncate">{user?.fullName || user?.username}</p>
              <span className={cn('text-[10px]', roleBadge, 'px-1.5 py-0 mt-0.5 inline-block')}>{roleLabel}</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle (desktop) */}
      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center py-3 border-t border-border/30 text-text-muted hover:text-text-primary transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r border-border/30 z-30 transition-all duration-200',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {navContent}
      </aside>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border/30 z-50 transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>
    </>
  )
}
