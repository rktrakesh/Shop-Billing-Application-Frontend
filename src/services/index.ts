import axiosInstance from "@/api/axios";
import { ENDPOINTS } from "@/config/api";
import type {
  LoginRequest,
  AuthResponse,
  ApiResponse,
  ProductRequest,
  ProductResponse,
  ProductVariantRequest,
  ProductVariantResponse,
  CustomerRequest,
  CustomerResponse,
  InvoiceRequest,
  InvoiceResponse,
  StockAdjustmentRequest,
  StockMovementResponse,
  DashboardResponse,
  CreateUserRequest,
  UserResponse,
  ResetPasswordRequest,
  ReportRequest,
  ReportHistoryResponse,
  MonthlyProfitRequest,
  MonthlyProfitResponse,
  ProfitSummaryResponse,
  ShopSettingsRequest,
  ShopSettingsResponse,
  AuditLogResponse,
} from "@/types";

// ── Auth ─────────────────────────────────────────────────────
export const authService = {
  login: (data: LoginRequest) => axiosInstance.post<ApiResponse<AuthResponse>>(ENDPOINTS.LOGIN, data),
};

// ── Products ─────────────────────────────────────────────────
export const productService = {
  getAll: () => axiosInstance.get<ApiResponse<ProductResponse[]>>(ENDPOINTS.PRODUCTS),
  getAllIncludingInactive: () => axiosInstance.get<ApiResponse<ProductResponse[]>>(ENDPOINTS.PRODUCTS_ALL),
  getById: (id: number) => axiosInstance.get<ApiResponse<ProductResponse>>(ENDPOINTS.PRODUCT_BY_ID(id)),
  create: (data: ProductRequest) => axiosInstance.post<ApiResponse<ProductResponse>>(ENDPOINTS.PRODUCTS, data),
  update: (id: number, data: ProductRequest) => axiosInstance.put<ApiResponse<ProductResponse>>(ENDPOINTS.PRODUCT_BY_ID(id), data),
  delete: (id: number) => axiosInstance.delete<ApiResponse<void>>(ENDPOINTS.PRODUCT_BY_ID(id)),
};

// ── Variants ─────────────────────────────────────────────────
export const variantService = {
  getById: (id: number) => axiosInstance.get<ApiResponse<ProductVariantResponse>>(ENDPOINTS.VARIANT_BY_ID(id)),
  getByProduct: (productId: number) => axiosInstance.get<ApiResponse<ProductVariantResponse[]>>(ENDPOINTS.VARIANTS_BY_PRODUCT(productId)),
  getByBarcode: (barcode: string) => axiosInstance.get<ApiResponse<ProductVariantResponse>>(ENDPOINTS.VARIANT_BY_BARCODE(barcode)),
  getLowStock: () => axiosInstance.get<ApiResponse<ProductVariantResponse[]>>(ENDPOINTS.VARIANTS_LOW_STOCK),
  search: (q: string) => axiosInstance.get<ApiResponse<ProductVariantResponse[]>>(ENDPOINTS.VARIANTS_SEARCH, { params: { q } }),
  create: (data: ProductVariantRequest) => axiosInstance.post<ApiResponse<ProductVariantResponse>>(ENDPOINTS.VARIANTS, data),
  update: (id: number, data: ProductVariantRequest) => axiosInstance.put<ApiResponse<ProductVariantResponse>>(ENDPOINTS.VARIANT_BY_ID(id), data),
  delete: (id: number) => axiosInstance.delete<ApiResponse<void>>(ENDPOINTS.VARIANT_BY_ID(id)),
};

// ── Barcode ───────────────────────────────────────────────────
export const barcodeService = {
  generate: (variantId: number) => axiosInstance.post<ApiResponse<ProductVariantResponse>>(ENDPOINTS.BARCODE_GENERATE(variantId)),
  regenerate: (variantId: number) => axiosInstance.post<ApiResponse<ProductVariantResponse>>(ENDPOINTS.BARCODE_REGENERATE(variantId)),
  search: (barcode: string) => axiosInstance.get<ApiResponse<ProductVariantResponse>>(ENDPOINTS.BARCODE_SEARCH(barcode)),
  downloadPng: (variantId: number) => axiosInstance.get(ENDPOINTS.BARCODE_DOWNLOAD_PNG(variantId), { responseType: "blob" }),
  downloadPdf: (variantId: number) => axiosInstance.get(ENDPOINTS.BARCODE_DOWNLOAD_PDF(variantId), { responseType: "blob" }),
};

// ── Customers ─────────────────────────────────────────────────
export const customerService = {
  getAll: () => axiosInstance.get<ApiResponse<CustomerResponse[]>>(ENDPOINTS.CUSTOMERS),
  getById: (id: number) => axiosInstance.get<ApiResponse<CustomerResponse>>(ENDPOINTS.CUSTOMER_BY_ID(id)),
  search: (q: string) => axiosInstance.get<ApiResponse<CustomerResponse[]>>(ENDPOINTS.CUSTOMERS_SEARCH, { params: { q } }),
  create: (data: CustomerRequest) => axiosInstance.post<ApiResponse<CustomerResponse>>(ENDPOINTS.CUSTOMERS, data),
  update: (id: number, data: CustomerRequest) => axiosInstance.put<ApiResponse<CustomerResponse>>(ENDPOINTS.CUSTOMER_BY_ID(id), data),
  getPurchaseHistory: (id: number) => axiosInstance.get<ApiResponse<InvoiceResponse[]>>(ENDPOINTS.CUSTOMER_PURCHASES(id)),
};

// ── Invoices ─────────────────────────────────────────────────
export const invoiceService = {
  getAll: () => axiosInstance.get<ApiResponse<InvoiceResponse[]>>(ENDPOINTS.INVOICES),
  getMy: () => axiosInstance.get<ApiResponse<InvoiceResponse[]>>(ENDPOINTS.INVOICES_MY),
  getById: (id: number) => axiosInstance.get<ApiResponse<InvoiceResponse>>(ENDPOINTS.INVOICE_BY_ID(id)),
  create: (data: InvoiceRequest) => axiosInstance.post<ApiResponse<InvoiceResponse>>(ENDPOINTS.INVOICES, data),
  downloadPdf: (id: number) => axiosInstance.get(ENDPOINTS.INVOICE_PDF(id), { responseType: "blob" }),
};

// ── Inventory ─────────────────────────────────────────────────
export const inventoryService = {
  adjust: (data: StockAdjustmentRequest) => axiosInstance.post<ApiResponse<ProductVariantResponse>>(ENDPOINTS.INVENTORY_ADJUST, data),
  getMovements: (variantId: number) => axiosInstance.get<ApiResponse<StockMovementResponse[]>>(ENDPOINTS.INVENTORY_MOVEMENTS(variantId)),
  getLowStock: () => axiosInstance.get<ApiResponse<ProductVariantResponse[]>>(ENDPOINTS.INVENTORY_LOW_STOCK),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardService = {
  get: () => axiosInstance.get<ApiResponse<DashboardResponse>>(ENDPOINTS.DASHBOARD),
};

// ── Reports ───────────────────────────────────────────────────
export const reportService = {
  daily: () => axiosInstance.get(ENDPOINTS.REPORT_DAILY, { responseType: "blob" }),
  monthly: () => axiosInstance.get(ENDPOINTS.REPORT_MONTHLY, { responseType: "blob" }),
  yearly: () => axiosInstance.get(ENDPOINTS.REPORT_YEARLY, { responseType: "blob" }),
  custom: (data: ReportRequest) => axiosInstance.post(ENDPOINTS.REPORT_CUSTOM, data, { responseType: "blob" }),
  getHistory: () => axiosInstance.get<ApiResponse<ReportHistoryResponse[]>>(ENDPOINTS.REPORT_HISTORY),
  downloadHistory: (id: number) => axiosInstance.get(ENDPOINTS.REPORT_HISTORY_DOWNLOAD(id), { responseType: "blob" }),
  deleteHistory: (id: number) => axiosInstance.delete<ApiResponse<void>>(ENDPOINTS.REPORT_HISTORY_DELETE(id)),
};

// ── Profit ────────────────────────────────────────────────────
export const profitService = {
  getAll: () => axiosInstance.get<ApiResponse<MonthlyProfitResponse[]>>(ENDPOINTS.PROFIT),
  getByYear: (year: number) => axiosInstance.get<ApiResponse<MonthlyProfitResponse[]>>(ENDPOINTS.PROFIT_BY_YEAR(year)),
  getByMonth: (year: number, month: number) => axiosInstance.get<ApiResponse<MonthlyProfitResponse>>(ENDPOINTS.PROFIT_BY_MONTH(year, month)),
  createOrUpdate: (data: MonthlyProfitRequest) => axiosInstance.post<ApiResponse<MonthlyProfitResponse>>(ENDPOINTS.PROFIT_CREATE, data),

  // Auto-calculated profit summaries (from invoices)
  getDailySummary: (date?: string) => axiosInstance.get<ApiResponse<ProfitSummaryResponse>>(ENDPOINTS.PROFIT_SUMMARY_DAILY, { params: date ? { date } : {} }),
  getMonthlySummary: (year: number, month: number) => axiosInstance.get<ApiResponse<ProfitSummaryResponse>>(ENDPOINTS.PROFIT_SUMMARY_MONTHLY, { params: { year, month } }),
  getYearlySummary: (year: number) => axiosInstance.get<ApiResponse<ProfitSummaryResponse>>(ENDPOINTS.PROFIT_SUMMARY_YEARLY, { params: { year } }),
  downloadSummary: (params: { period: "daily" | "monthly" | "yearly"; date?: string; year?: number; month?: number }) => axiosInstance.get(ENDPOINTS.PROFIT_SUMMARY_DOWNLOAD, { params, responseType: "blob" }),
};

// ── Users ─────────────────────────────────────────────────────
export const userService = {
  getAll: () => axiosInstance.get<ApiResponse<UserResponse[]>>(ENDPOINTS.USERS),
  getById: (id: number) => axiosInstance.get<ApiResponse<UserResponse>>(ENDPOINTS.USER_BY_ID(id)),
  create: (data: CreateUserRequest) => axiosInstance.post<ApiResponse<UserResponse>>(ENDPOINTS.USERS, data),
  update: (id: number, data: CreateUserRequest) => axiosInstance.put<ApiResponse<UserResponse>>(ENDPOINTS.USER_BY_ID(id), data),
  disable: (id: number) => axiosInstance.patch<ApiResponse<void>>(ENDPOINTS.USER_DISABLE(id)),
  enable: (id: number) => axiosInstance.patch<ApiResponse<void>>(ENDPOINTS.USER_ENABLE(id)),
  resetPassword: (id: number, data: ResetPasswordRequest) => axiosInstance.patch<ApiResponse<void>>(ENDPOINTS.USER_RESET_PASSWORD(id), data),
};

// ── Shop Settings ─────────────────────────────────────────────
export const settingsService = {
  get: () => axiosInstance.get<ApiResponse<ShopSettingsResponse>>(ENDPOINTS.SHOP_SETTINGS),
  update: (data: ShopSettingsRequest) => axiosInstance.put<ApiResponse<ShopSettingsResponse>>(ENDPOINTS.SHOP_SETTINGS, data),
};

// ── Audit Logs ────────────────────────────────────────────────
export const auditLogService = {
  getAll: () => axiosInstance.get<ApiResponse<AuditLogResponse[]>>(ENDPOINTS.AUDIT_LOGS),
  getRecent: (limit = 50) => axiosInstance.get<ApiResponse<AuditLogResponse[]>>(ENDPOINTS.AUDIT_LOGS_RECENT, { params: { limit } }),
};

// ── Utility: Download blob as file ────────────────────────────
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Utility: Print a PDF blob via a hidden iframe ──────────────
// Opens the browser's native print dialog for the given PDF without
// navigating away from the app or downloading the file.
export function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Fallback: open in a new tab if printing from iframe is blocked
      window.open(url, "_blank");
    }
  };

  // Clean up after printing (give the print dialog time to open)
  const cleanup = () => {
    document.body.removeChild(iframe);
    URL.revokeObjectURL(url);
  };
  setTimeout(cleanup, 60_000);
}
