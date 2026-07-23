// ============================================================
// API Configuration
// Change only API_BASE_URL to switch environments.
// ============================================================

export const API_BASE_URL = "http://localhost:8080";

export const ENDPOINTS = {
  // ── Authentication ──────────────────────────────────────
  // POST { username, password } → { token, username, role, fullName }
  LOGIN: "/api/auth/login",
  // POST { refreshToken } → AuthResponse (new access + refresh tokens)
  REFRESH: "/api/auth/refresh",

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
  // GET ?months=6 → ProfitSummaryResponse[] (oldest first, for dashboard trend charts)
  PROFIT_SUMMARY_LAST_MONTHS: "/api/profit/summary/last-months",

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

  // ── Returns (all roles) ───────────────────────────────────
  RETURNS: "/api/returns",
  RETURNS_ALL: "/api/returns",
  RETURNS_BY_INVOICE: (invoiceId: number | string) => `/api/returns/invoice/${invoiceId}`,

  // ── Customer Credits / Outstanding ────────────────────────
  CREDITS: "/api/credits",
  CREDITS_PENDING: "/api/credits/pending",
  CREDITS_SUMMARY: "/api/credits/summary",
  CREDITS_BY_CUSTOMER: (customerId: number | string) => `/api/credits/customer/${customerId}`,
  CREDITS_BY_INVOICE: (invoiceId: number | string) => `/api/credits/invoice/${invoiceId}`,
  CREDIT_PAYMENT: (creditId: number | string) => `/api/credits/${creditId}/payment`,
  CREDIT_CUSTOMER_CHECK: (customerId: number | string) => `/api/credits/customer/${customerId}/check`,

  // ── Shop Day Management ───────────────────────────────────
  SHOP_STATUS: "/api/shop/status",
  SHOP_OPEN: "/api/shop/open",
  SHOP_CLOSE: "/api/shop/close",
  SHOP_LOGS: "/api/shop/logs",
  SHOP_REPORT: (dayLogId: number | string) => `/api/shop/report/${dayLogId}`,
  SHOP_REPORT_DOWNLOAD: (dayLogId: number | string) => `/api/shop/report/${dayLogId}/download`,

  // ── IP Security ───────────────────────────────────────────
  // ── IP Security ──────────────────────────────────────────
  // POST { username, emailOtp } → { sessionToken, ipAddress }
  VERIFY_IP_OTP: "/api/auth/verify-ip-otp",
  // GET  → AllowedIpResponse[]
  IP_WHITELIST: "/api/admin/ip-whitelist",
  // POST { ipAddress, label } → AllowedIpResponse
  IP_WHITELIST_ADD: "/api/admin/ip-whitelist",
  // DELETE → void
  IP_WHITELIST_DELETE: (id: number | string) => `/api/admin/ip-whitelist/${id}`,
  // GET  → { ipAddress: string }
  MY_IP: "/api/admin/ip-whitelist/my-ip",

  // ── Suppliers ─────────────────────────────────────────────
  // GET → SupplierResponse[] (active) | POST { name, mobileNumber, address, notes } → SupplierResponse
  SUPPLIERS: "/api/suppliers",
  // GET → SupplierResponse[] (includes inactive)
  SUPPLIERS_ALL: "/api/suppliers/all",
  // GET/PUT/DELETE /api/suppliers/:id
  SUPPLIER_BY_ID: (id: number | string) => `/api/suppliers/${id}`,

  // ── Raw Materials ─────────────────────────────────────────
  // GET → RawMaterialResponse[] (active)
  RAW_MATERIALS: "/api/raw-materials",
  // GET → RawMaterialResponse[] (includes inactive)
  RAW_MATERIALS_ALL: "/api/raw-materials/all",
  // GET /api/raw-materials/:id
  RAW_MATERIAL_BY_ID: (id: number | string) => `/api/raw-materials/${id}`,
  // GET → RawMaterialResponse[]
  RAW_MATERIALS_LOW_STOCK: "/api/raw-materials/low-stock",
  // GET → string[] (distinct item names, for autocomplete)
  RAW_MATERIALS_ITEM_NAMES: "/api/raw-materials/item-names",
  // POST { rawMaterialId, newStock, reason } → RawMaterialResponse
  RAW_MATERIALS_ADJUST: "/api/raw-materials/adjust",
  // GET → RawMaterialMovementResponse[]
  RAW_MATERIAL_MOVEMENTS: (id: number | string) => `/api/raw-materials/${id}/movements`,

  // ── Supplier Purchases ────────────────────────────────────
  // GET → SupplierPurchaseResponse[] | POST { supplierId, billNumber, purchaseDate, items[] } → SupplierPurchaseResponse
  SUPPLIER_PURCHASES: "/api/supplier-purchases",
  // GET /api/supplier-purchases/:id
  SUPPLIER_PURCHASE_BY_ID: (id: number | string) => `/api/supplier-purchases/${id}`,
  // GET → SupplierPurchaseResponse[]
  SUPPLIER_PURCHASES_BY_SUPPLIER: (supplierId: number | string) => `/api/supplier-purchases/supplier/${supplierId}`,

  // ── Production ────────────────────────────────────────────
  // GET → ProductionBatchResponse[] | POST { rawMaterialId, quantityUsed, designName, ... } → ProductionBatchResponse
  PRODUCTION: "/api/production",
  // GET /api/production/:id
  PRODUCTION_BY_ID: (id: number | string) => `/api/production/${id}`,
  // GET → ProductionBatchResponse[]
  PRODUCTION_BY_RAW_MATERIAL: (rawMaterialId: number | string) => `/api/production/raw-material/${rawMaterialId}`,
};
