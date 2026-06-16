// ============================================================
// TypeScript interfaces generated from Spring Boot DTOs
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type Role = "ROLE_ADMIN" | "ROLE_MANAGER" | "ROLE_USER";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DISABLED"
  | "USER_ENABLED"
  | "PASSWORD_RESET"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DELETED"
  | "VARIANT_CREATED"
  | "VARIANT_UPDATED"
  | "BARCODE_GENERATED"
  | "INVENTORY_UPDATED"
  | "INVOICE_CREATED"
  | "INVOICE_UPDATED"
  | "CUSTOMER_CREATED"
  | "CUSTOMER_UPDATED"
  | "REPORT_GENERATED"
  | "BACKUP_CREATED"
  | "BACKUP_RESTORED"
  | "SETTINGS_UPDATED";

export type StockChangeType = "ADD_STOCK" | "SALE" | "RETURN" | "MANUAL_ADJUSTMENT";

export type ReportType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";

// ── Auth ─────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  username: string;
  role: Role;
  fullName: string;
}

// ── API Wrapper ───────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ── Products ─────────────────────────────────────────────────

export interface ProductRequest {
  designName: string;
  description?: string;
  category: string;
  printType: string;
  active?: boolean;
}

export interface ProductResponse {
  id: number;
  designName: string;
  description?: string;
  category: string;
  printType: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariantResponse[];
}

// ── Product Variants ─────────────────────────────────────────

export interface ProductVariantRequest {
  productId: number;
  productCode: string;
  color: string;
  size: string;
  sellingPrice: number;
  costPrice: number;
  stock?: number;
  minimumStock?: number;
  imageUrl?: string;
}

export interface ProductVariantResponse {
  id: number;
  productId: number;
  designName: string;
  productCode: string;
  color: string;
  size: string;
  barcode?: string;
  sellingPrice: number;
  costPrice?: number;
  stock: number;
  minimumStock: number;
  imageUrl?: string;
  barcodeImagePath?: string;
  active: boolean;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Customers ────────────────────────────────────────────────

export interface CustomerRequest {
  name: string;
  mobileNumber?: string;
  address?: string;
}

export interface CustomerResponse {
  id: number;
  name: string;
  mobileNumber?: string;
  address?: string;
  createdAt: string;
  totalPurchases: number;
}

// ── Invoices ─────────────────────────────────────────────────

export interface InvoiceItemRequest {
  barcode?: string;
  designName: string;
  productCode?: string;
  color?: string;
  size?: string;
  printType?: string;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
}

export interface InvoiceRequest {
  customerId?: number;
  customerName?: string;
  customerMobile?: string;
  items: InvoiceItemRequest[];
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface InvoiceItemResponse {
  id: number;
  productVariantId?: number;
  barcode?: string;
  designName: string;
  productCode?: string;
  color?: string;
  size?: string;
  printType?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
}

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerId?: number;
  customerName?: string;
  customerMobile?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  createdByUsername: string;
  notes?: string;
  items: InvoiceItemResponse[];
  createdAt: string;
}

// ── Inventory ─────────────────────────────────────────────────

export interface StockAdjustmentRequest {
  productVariantId: number;
  changeType: StockChangeType;
  quantity: number;
  reason?: string;
}

export interface StockMovementResponse {
  id: number;
  productVariantId: number;
  productCode: string;
  designName: string;
  changeType: StockChangeType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

// ── Dashboard ─────────────────────────────────────────────────

export interface DashboardResponse {
  todaySales?: number;
  weeklySales?: number;
  monthlySales?: number;
  yearlySales?: number;
  monthlyProfit?: number;
  yearlyProfit?: number;
  totalCustomers?: number;
  totalProducts?: number;
  lowStockCount?: number;
  todayInvoiceCount?: number;
  monthlyInvoiceCount?: number;
  recentInvoices?: InvoiceResponse[];
  lowStockProducts?: ProductVariantResponse[];
}

// ── Users ─────────────────────────────────────────────────────

export interface CreateUserRequest {
  username: string;
  password: string;
  role: Role;
  fullName?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface UserResponse {
  id: number;
  username: string;
  role: Role;
  active: boolean;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Reports ───────────────────────────────────────────────────

export interface ReportRequest {
  startDate: string;
  endDate: string;
}

export interface ReportHistoryResponse {
  id: number;
  reportType: ReportType;
  startDate: string;
  endDate: string;
  generatedBy: string;
  generatedAt: string;
  fileName?: string;
}

// ── Profit ────────────────────────────────────────────────────

export interface MonthlyProfitRequest {
  month: number;
  year: number;
  totalSales: number;
  productionCost: number;
  otherExpenses: number;
  notes?: string;
}

export interface MonthlyProfitResponse {
  id: number;
  month: number;
  year: number;
  monthName: string;
  totalSales: number;
  productionCost: number;
  otherExpenses: number;
  netProfit: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Profit Summary (auto-calculated from invoices) ────────────

export interface ProfitSummaryResponse {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  productionCost: number;
  netProfit: number;
  marginPercent: number;
  invoiceCount: number;
}

// ── Shop Settings ─────────────────────────────────────────────

export interface ShopSettingsRequest {
  shopName: string;
  shopAddress?: string;
  mobileNumber?: string;
  email?: string;
  gstNumber?: string;
  footerMessage?: string;
}

export interface ShopSettingsResponse {
  id: number;
  shopName: string;
  shopAddress?: string;
  mobileNumber?: string;
  email?: string;
  gstNumber?: string;
  footerMessage?: string;
  logoPath?: string;
  updatedAt: string;
}

// ── Audit Logs ────────────────────────────────────────────────

export interface AuditLogResponse {
  id: number;
  action: AuditAction;
  entityType?: string;
  entityId?: number;
  description: string;
  performedBy: string;
  ipAddress?: string;
  createdAt: string;
}

// ── Returns ───────────────────────────────────────────────────

export interface ItemReturnRequest {
  invoiceId: number;
  invoiceItemId: number;
  quantity: number;
  refundAmount: number;
  reason?: string;
}

export interface ItemReturnResponse {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  invoiceItemId: number;
  designName: string;
  color?: string;
  size?: string;
  productCode?: string;
  quantity: number;
  refundAmount: number;
  reason?: string;
  returnedByUsername: string;
  createdAt: string;
}

// ── UI / Cart (frontend-only) ─────────────────────────────────

export interface CartItem {
  id: string;
  barcode?: string;
  designName: string;
  productCode?: string;
  color?: string;
  size?: string;
  printType?: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  discountPercent: number;
  discountType: "flat" | "percent";
  lineTotal: number;
  productVariantId?: number;
}

export interface AuthUser {
  token: string;
  refreshToken: string;
  username: string;
  role: Role;
  fullName?: string;
}
