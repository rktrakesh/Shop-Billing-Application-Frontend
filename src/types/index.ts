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
  sessionToken?: string; // provided after OTP verification for unknown IPs
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
  paymentMode: PaymentMode;
  createdByUsername: string;
  notes?: string;
  items: InvoiceItemResponse[];
  createdAt: string;
  hasCredit?: boolean;
  outstandingAmount?: number;
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

export type PaymentMode = "CASH" | "UPI" | "CARD" | "OTHER";
export type CreditStatus = "PENDING" | "PARTIAL" | "CLEARED";

export interface ShopStatusResponse {
  dayLogId?: number;
  status: "OPEN" | "CLOSED";
  openTime?: string;
  closeTime?: string;
  closedBy?: string;
  isOpen: boolean;
}

export interface ReturnDetailItem {
  invoiceNumber: string;
  customerName?: string;
  customerMobile?: string;
  itemName: string;
  color?: string;
  size?: string;
  quantity: number;
  refundAmount: number;
  returnedAt: string;
}

export interface CreditDetailItem {
  invoiceNumber: string;
  customerName: string;
  customerMobile?: string;
  invoiceTotal: number;
  amountPaid: number;
  outstandingAmount: number;
  status: string;
  createdAt: string;
}

export interface DayReportResponse {
  openTime: string;
  closeTime?: string;
  closedBy: string;
  invoiceCount: number;
  totalSales: number;
  totalDiscount: number;
  salesByPaymentMode: Record<string, number>;
  totalReturns: number;
  returnCount: number;
  returnDetails: ReturnDetailItem[];
  totalCreditGiven: number;
  totalCreditCollected: number;
  creditCount: number;
  creditDetails: CreditDetailItem[];
  netCollection: number;
}

export interface CreditPaymentResponse {
  id: number;
  amount: number;
  paymentMode: PaymentMode;
  notes?: string;
  recordedByUsername: string;
  createdAt: string;
}

export interface CustomerCreditResponse {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  customerId?: number;
  customerName: string;
  customerMobile?: string;
  totalAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  status: CreditStatus;
  notes?: string;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
  payments: CreditPaymentResponse[];
}

export interface CustomerCreditRequest {
  invoiceId: number;
  amountPaid: number;
  notes?: string;
}

export interface CreditPaymentRequest {
  amount: number;
  paymentMode: PaymentMode;
  notes?: string;
}

export interface AllowedIpResponse {
  id: number;
  ipAddress: string;
  label?: string;
  addedByUsername: string;
  createdAt: string;
}

// ── Suppliers ────────────────────────────────────────────────

export interface SupplierRequest {
  name: string;
  mobileNumber?: string;
  address?: string;
  notes?: string;
}

export interface SupplierResponse {
  id: number;
  name: string;
  mobileNumber?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Raw Materials ────────────────────────────────────────────

export type RawMaterialChangeType = "PURCHASE" | "PRODUCTION_USE" | "MANUAL_ADJUSTMENT";

export interface RawMaterialResponse {
  id: number;
  itemName: string;
  color?: string;
  size?: string;
  stock: number;
  averageCostPrice: number;
  minimumStock: number;
  active: boolean;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawMaterialAdjustmentRequest {
  rawMaterialId: number;
  newStock: number;
  reason?: string;
}

export interface RawMaterialMovementResponse {
  id: number;
  rawMaterialId: number;
  itemName: string;
  color?: string;
  size?: string;
  changeType: RawMaterialChangeType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

// ── Supplier Purchases ───────────────────────────────────────

export interface SupplierPurchaseItemRequest {
  rawMaterialId?: number;
  itemName?: string;
  color?: string;
  size?: string;
  quantity: number;
  purchasePrice: number;
}

export interface SupplierPurchaseRequest {
  supplierId: number;
  billNumber?: string;
  purchaseDate: string; // yyyy-MM-dd
  notes?: string;
  items: SupplierPurchaseItemRequest[];
}

export interface SupplierPurchaseItemResponse {
  id: number;
  rawMaterialId: number;
  itemName: string;
  color?: string;
  size?: string;
  quantity: number;
  purchasePrice: number;
  lineTotal: number;
}

export interface SupplierPurchaseResponse {
  id: number;
  supplierId: number;
  supplierName: string;
  billNumber?: string;
  purchaseDate: string;
  totalCost: number;
  notes?: string;
  createdByUsername: string;
  items: SupplierPurchaseItemResponse[];
  createdAt: string;
}

// ── Production ───────────────────────────────────────────────

export interface ProductionBatchRequest {
  rawMaterialId: number;
  quantityUsed: number;
  designName: string;
  description?: string;
  category: string;
  printingType: string; // "DTF" | "Sublimation" | "Stitching" | "Other"
  customPrintingType?: string;
  sellingPrice: number;
  minimumStock?: number;
  printingCostTotal: number;
  productionDate?: string; // yyyy-MM-dd
  notes?: string;
}

export interface ProductionBatchResponse {
  id: number;
  rawMaterialId: number;
  rawMaterialName: string;
  quantityUsed: number;
  printingType: string;
  printingCostTotal: number;
  printingCostPerUnit: number;
  rawMaterialCostPerUnit: number;
  productionDate: string;
  notes?: string;
  createdByUsername: string;
  createdAt: string;
  producedVariant: ProductVariantResponse;
}

export interface AuthUser {
  token: string;
  refreshToken: string;
  username: string;
  role: Role;
  fullName?: string;
}
