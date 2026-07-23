import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, ShoppingBag, Package, Layers, Warehouse, Users, BarChart2, TrendingUp, UserCog, Settings, FileText, QrCode, Undo2, CreditCard, ChevronLeft, ChevronRight, ChevronDown, Shirt, Moon, Truck, Boxes, Receipt, Factory, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn, getRoleLabel, getRoleBadgeClass } from "@/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shopDayService, downloadBlob } from "@/services";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/index";
import toast from "react-hot-toast";

type Role = "ROLE_ADMIN" | "ROLE_MANAGER" | "ROLE_USER";

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  roles?: Role[];
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

// Two quick-access items stay outside any group; everything else is bucketed
// into collapsible sections so the sidebar doesn't turn into a long flat list.
const TOP_LEVEL_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
  { label: "Billing", icon: ShoppingCart, to: "/billing" },
];

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Catalog",
    icon: Package,
    items: [
      { label: "Products", icon: Package, to: "/products", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      { label: "Variants", icon: Layers, to: "/variants", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      { label: "Barcodes", icon: QrCode, to: "/barcodes", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
    ],
  },
  {
    label: "Inventory & Supply Chain",
    icon: Warehouse,
    items: [
      { label: "Inventory", icon: Warehouse, to: "/inventory", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      { label: "Suppliers", icon: Truck, to: "/suppliers", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      { label: "Raw Materials", icon: Boxes, to: "/raw-materials", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      { label: "Purchases", icon: Receipt, to: "/purchases", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      { label: "Production", icon: Factory, to: "/production", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
    ],
  },
  {
    label: "Sales",
    icon: ShoppingBag,
    items: [
      { label: "Customers", icon: Users, to: "/customers" },
      { label: "Invoices", icon: FileText, to: "/invoices" },
      { label: "Returns", icon: Undo2, to: "/returns" },
      { label: "Credits", icon: CreditCard, to: "/credits" },
    ],
  },
  {
    label: "Reports & Finance",
    icon: BarChart2,
    items: [
      { label: "Reports", icon: BarChart2, to: "/reports", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      { label: "Expenses", icon: Wallet, to: "/expenses", roles: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      { label: "Profit", icon: TrendingUp, to: "/profit", roles: ["ROLE_ADMIN"] },
      { label: "Day Report", icon: Moon, to: "/dayreport", roles: ["ROLE_ADMIN"] },
    ],
  },
  {
    label: "Administration",
    icon: UserCog,
    items: [
      { label: "Users", icon: UserCog, to: "/users", roles: ["ROLE_ADMIN"] },
      { label: "Settings", icon: Settings, to: "/settings", roles: ["ROLE_ADMIN"] },
      { label: "Audit Logs", icon: FileText, to: "/audit", roles: ["ROLE_ADMIN"] },
    ],
  },
];

const OPEN_GROUPS_STORAGE_KEY = "sidebar-open-groups";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const { data: statusRes } = useQuery({
    queryKey: ["shop-status"],
    queryFn: () => shopDayService.getStatus(),
    refetchInterval: 60_000,
    enabled: isAdmin,
  });
  const shopStatus = statusRes?.data?.data;

  const closeMutation = useMutation({
    mutationFn: () => shopDayService.closeShop(),
    onSuccess: (res) => {
      const dayLogId = res.data?.data?.dayLogId;
      toast.success("Shop closed. End-of-day report generated.");
      setShowCloseConfirm(false);
      qc.invalidateQueries({ queryKey: ["shop-status"] });
      qc.invalidateQueries({ queryKey: ["shop-logs"] });
      // Auto-download the report
      if (dayLogId) {
        shopDayService
          .downloadReport(dayLogId)
          .then((r) => {
            downloadBlob(r.data, `day-report-${dayLogId}.pdf`);
          })
          .catch(() => {});
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to close shop"),
  });
  const location = useLocation();

  const userRole = user?.role as Role | undefined;
  const canSee = (roles?: Role[]) => !roles || (userRole && roles.includes(userRole));

  const visibleTopLevel = TOP_LEVEL_ITEMS.filter((item) => canSee(item.roles));
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canSee(item.roles)),
  })).filter((group) => group.items.length > 0);

  // Which group (if any) contains the page currently being viewed
  const activeGroupLabel = visibleGroups.find((group) => group.items.some((item) => location.pathname.startsWith(item.to)))?.label;

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(OPEN_GROUPS_STORAGE_KEY);
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      return new Set(parsed);
    } catch {
      return new Set();
    }
  });

  // Make sure whichever group holds the current page is expanded, even if
  // the saved preference had it closed (so you're never "hiding" your own page).
  useEffect(() => {
    if (activeGroupLabel && !openGroups.has(activeGroupLabel)) {
      setOpenGroups((prev) => new Set(prev).add(activeGroupLabel));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupLabel]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      localStorage.setItem(OPEN_GROUPS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const roleLabel = getRoleLabel(user?.role ?? "");
  const roleBadge = getRoleBadgeClass(user?.role ?? "");

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-border/30", collapsed && "justify-center px-3")}>
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
        {/* Quick-access items, always visible */}
        {visibleTopLevel.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={onMobileClose} className={({ isActive }) => cn("nav-item", isActive && "nav-item-active", collapsed && "justify-center px-2")} title={collapsed ? item.label : undefined}>
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {/* When the rail is collapsed to icons-only, skip group headers —
            just show every item flat since there's no room for labels anyway. */}
        {collapsed ? (
          <>
            <div className="my-2 border-t border-border/30" />
            {visibleGroups
              .flatMap((group) => group.items)
              .map((item) => (
                <NavLink key={item.to} to={item.to} onClick={onMobileClose} className={({ isActive }) => cn("nav-item justify-center px-2", isActive && "nav-item-active")} title={item.label}>
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                </NavLink>
              ))}
          </>
        ) : (
          visibleGroups.map((group) => {
            const isOpen = openGroups.has(group.label);
            const hasActiveItem = group.label === activeGroupLabel;
            return (
              <div key={group.label} className="pt-2">
                <button onClick={() => toggleGroup(group.label)} className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors", hasActiveItem ? "text-primary" : "text-text-muted hover:text-text-primary")}>
                  <group.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => (
                      <NavLink key={item.to} to={item.to} onClick={onMobileClose} className={({ isActive }) => cn("nav-item pl-8", isActive && "nav-item-active")}>
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Close Day button — Admin only, visible when shop is open */}
      {isAdmin && !collapsed && shopStatus?.isOpen && (
        <div className="px-3 pb-2">
          <button onClick={() => setShowCloseConfirm(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs font-medium hover:bg-danger/20 transition-colors">
            <Moon className="h-3.5 w-3.5" />
            Close Day
          </button>
        </div>
      )}

      {/* Shop status indicator */}
      {isAdmin && !collapsed && (
        <div className="px-3 pb-1">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${shopStatus?.isOpen ? "bg-success/10 text-success" : "bg-text-muted/10 text-text-muted"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${shopStatus?.isOpen ? "bg-success" : "bg-text-muted"}`} />
            Shop {shopStatus?.isOpen ? "Open" : "Closed"}
          </div>
        </div>
      )}

      {/* User info */}
      {!collapsed && (
        <div className="p-3 border-t border-border/30">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-card/40">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{(user?.fullName || user?.username || "U")[0].toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-primary truncate">{user?.fullName || user?.username}</p>
              <span className={cn("text-[10px]", roleBadge, "px-1.5 py-0 mt-0.5 inline-block")}>{roleLabel}</span>
            </div>
          </div>
        </div>
      )}

      {/* Close Day Confirmation Dialog */}
      <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger">
              <Moon className="h-5 w-5" />
              Close the Shop for Today?
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3 text-sm text-text-secondary">
              <p>This will:</p>
              <ul className="space-y-1 pl-4 list-disc text-text-muted">
                <li>Record the shop closing time</li>
                <li>Generate the end-of-day collection report</li>
                <li>Automatically download the PDF report</li>
              </ul>
              <p className="text-text-muted">
                The shop will <span className="font-medium text-text-primary">auto-open tomorrow at 7:00 AM</span>. No action needed.
              </p>
              {shopStatus?.openTime && <div className="bg-card/40 border border-border/30 rounded-lg p-2 text-xs text-text-muted">Open since: {new Date(shopStatus.openTime).toLocaleString()}</div>}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
              Yes, Close Shop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collapse toggle (desktop) */}
      <button onClick={onToggle} className="hidden lg:flex items-center justify-center py-3 border-t border-border/30 text-text-muted hover:text-text-primary transition-colors">
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn("hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r border-border/30 z-30 transition-all duration-200", collapsed ? "w-16" : "w-56")}>{navContent}</aside>

      {/* Mobile overlay + drawer */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onMobileClose} />}
      <aside className={cn("fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border/30 z-50 transition-transform duration-200 lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")}>{navContent}</aside>
    </>
  );
}
