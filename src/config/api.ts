// ============================================================
// API Configuration
// Change only API_BASE_URL to switch environments.
// ============================================================

export const API_BASE_URL = "http://localhost:8080";

export const ENDPOINTS = {
  // ── Authentication ──────────────────────────────────────
  // POST { username, password } → { token, username, role, fullName }
  LOGIN: "/api/auth/login",

  // ── Products ─────────────────────────────────────────────
  // GET  → ProductResponse[]
  // POST { designName, description, category, printType } → ProductResponse
  PRODUCTS: "/api/products",
  // GET  → ProductResponse[] (includes inactive)
  PRODUCTS_ALL: "/api/products/all",
  // GET/PUT/DELETE /api/products/:id
  PRODUCT_BY_ID: (id: number | string) => `/api/products/${id}`,

  // ── Product Variants ─────────────────────────────────────
  // GET → ProductVariantResponse[] (all active variants, avoids N+1 per-product calls)
  // POST { productId, productCode, color, size, sellingPrice, costPrice, stock } → ProductVariantResponse
  VARIANTS: "/api/products/variants",
  // GET/PUT/DELETE /api/products/variants/:id
  VARIANT_BY_ID: (id: number | string) => `/api/products/variants/${id}`,
  // GET → ProductVariantResponse[]
  VARIANTS_BY_PRODUCT: (productId: number | string) => `/api/products/${productId}/variants`,
  // GET → ProductVariantResponse
  VARIANT_BY_BARCODE: (barcode: string) => `/api/products/variants/barcode/${barcode}`,
  // GET → ProductVariantResponse[]
  VARIANTS_LOW_STOCK: "/api/products/variants/low-stock",
  // GET ?q=searchTerm → ProductVariantResponse[]
  VARIANTS_SEARCH: "/api/products/variants/search",

  // ── Barcode ───────────────────────────────────────────────
  // POST → ProductVariantResponse (generates barcode for variant)
  BARCODE_GENERATE: (variantId: number | string) => `/api/barcodes/generate/${variantId}`,
  // POST → ProductVariantResponse (regenerates barcode)
  BARCODE_REGENERATE: (variantId: number | string) => `/api/barcodes/regenerate/${variantId}`,
  // GET → PNG bytes
  BARCODE_DOWNLOAD_PNG: (variantId: number | string) => `/api/barcodes/download/png/${variantId}`,
  // GET → PDF bytes
  BARCODE_DOWNLOAD_PDF: (variantId: number | string) => `/api/barcodes/download/pdf/${variantId}`,
  // GET → ProductVariantResponse (lookup by barcode string)
  BARCODE_SEARCH: (barcode: string) => `/api/barcodes/search/${barcode}`,

  // ── Customers ─────────────────────────────────────────────
  // GET → CustomerResponse[] | POST { name, mobileNumber, address } → CustomerResponse
  CUSTOMERS: "/api/customers",
  // GET/PUT /api/customers/:id
  CUSTOMER_BY_ID: (id: number | string) => `/api/customers/${id}`,
  // GET ?q=searchTerm → CustomerResponse[]
  CUSTOMERS_SEARCH: "/api/customers/search",
  // GET → InvoiceResponse[]
  CUSTOMER_PURCHASES: (id: number | string) => `/api/customers/${id}/purchases`,

  // ── Invoices ─────────────────────────────────────────────
  // GET → InvoiceResponse[] (admin/manager only)
  INVOICES: "/api/invoices",
  // GET → InvoiceResponse[] (current user's invoices)
  INVOICES_MY: "/api/invoices/my",
  // GET /api/invoices/:id
  INVOICE_BY_ID: (id: number | string) => `/api/invoices/${id}`,
  // GET /api/invoices/:id/pdf → PDF bytes
  INVOICE_PDF: (id: number | string) => `/api/invoices/${id}/pdf`,
  // GET ?mobile=9876543210 → InvoiceResponse[] (all invoices with this customer mobile, walk-in or registered)
  INVOICES_BY_MOBILE: "/api/invoices/by-mobile",

  // ── Inventory ─────────────────────────────────────────────
  // POST { productVariantId, changeType, quantity, reason } → ProductVariantResponse
  INVENTORY_ADJUST: "/api/inventory/adjust",
  // GET → StockMovementResponse[]
  INVENTORY_MOVEMENTS: (variantId: number | string) => `/api/inventory/movements/${variantId}`,
  // GET → ProductVariantResponse[]
  INVENTORY_LOW_STOCK: "/api/inventory/low-stock",

  // ── Reports ───────────────────────────────────────────────
  // GET → PDF bytes
  REPORT_DAILY: "/api/reports/daily",
  REPORT_MONTHLY: "/api/reports/monthly",
  REPORT_YEARLY: "/api/reports/yearly",
  // POST { startDate, endDate } → PDF bytes
  REPORT_CUSTOM: "/api/reports/custom",
  // GET → ReportHistoryResponse[]
  REPORT_HISTORY: "/api/reports/history",
  // GET → PDF bytes
  REPORT_HISTORY_DOWNLOAD: (id: number | string) => `/api/reports/history/${id}/download`,
  // DELETE
  REPORT_HISTORY_DELETE: (id: number | string) => `/api/reports/history/${id}`,

  // ── Profit (ADMIN only) ───────────────────────────────────
  // GET → MonthlyProfitResponse[]
  PROFIT: "/api/profit",
  // POST { month, year, totalSales, productionCost, otherExpenses } → MonthlyProfitResponse
  PROFIT_CREATE: "/api/profit",
  // GET → MonthlyProfitResponse[]
  PROFIT_BY_YEAR: (year: number) => `/api/profit/year/${year}`,
  // GET → MonthlyProfitResponse
  PROFIT_BY_MONTH: (year: number, month: number) => `/api/profit/${year}/${month}`,

  // ── Profit Summary (auto-calculated from invoices, ADMIN only) ──
  // GET ?date=YYYY-MM-DD (optional, defaults to today) → ProfitSummaryResponse
  PROFIT_SUMMARY_DAILY: "/api/profit/summary/daily",
  // GET ?year=2026&month=6 → ProfitSummaryResponse
  PROFIT_SUMMARY_MONTHLY: "/api/profit/summary/monthly",
  // GET ?year=2026 → ProfitSummaryResponse
  PROFIT_SUMMARY_YEARLY: "/api/profit/summary/yearly",
  // GET ?period=daily|monthly|yearly&date=...&year=...&month=... → PDF bytes
  PROFIT_SUMMARY_DOWNLOAD: "/api/profit/summary/download",

  // ── Dashboard ─────────────────────────────────────────────
  // GET → DashboardResponse (role-adaptive)
  DASHBOARD: "/api/dashboard",

  // ── Users (ADMIN only) ────────────────────────────────────
  // GET → UserResponse[] | POST { username, password, role, fullName } → UserResponse
  USERS: "/api/admin/users",
  // GET/PUT /api/admin/users/:id
  USER_BY_ID: (id: number | string) => `/api/admin/users/${id}`,
  // PATCH → enable/disable
  USER_DISABLE: (id: number | string) => `/api/admin/users/${id}/disable`,
  USER_ENABLE: (id: number | string) => `/api/admin/users/${id}/enable`,
  // PATCH { newPassword } → reset
  USER_RESET_PASSWORD: (id: number | string) => `/api/admin/users/${id}/reset-password`,

  // ── Shop Settings ─────────────────────────────────────────
  // GET → ShopSettingsResponse | PUT → ShopSettingsResponse (ADMIN only)
  SHOP_SETTINGS: "/api/settings",

  // ── Audit Logs (ADMIN only) ───────────────────────────────
  // GET → AuditLogResponse[]
  AUDIT_LOGS: "/api/audit-logs",
  // GET ?limit=50 → AuditLogResponse[]
  AUDIT_LOGS_RECENT: "/api/audit-logs/recent",

  // ── Returns (ADMIN/MANAGER only) ──────────────────────────
  // POST { invoiceId, invoiceItemId, quantity, refundAmount, reason } → ItemReturnResponse
  RETURNS: "/api/returns",
  // GET → ItemReturnResponse[]
  RETURNS_ALL: "/api/returns",
  // GET → ItemReturnResponse[]
  RETURNS_BY_INVOICE: (invoiceId: number | string) => `/api/returns/invoice/${invoiceId}`,
};
