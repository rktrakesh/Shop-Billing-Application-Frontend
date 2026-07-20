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
  ItemReturnRequest,
  ItemReturnResponse,
  CustomerCreditRequest,
  CustomerCreditResponse,
  CreditPaymentRequest,
  ShopStatusResponse,
  DayReportResponse,
  AllowedIpResponse,
} from "@/types";

// ── Auth ─────────────────────────────────────────────────────
export const authService = {
  login: (data: LoginRequest) => axiosInstance.post<ApiResponse<AuthResponse>>(ENDPOINTS.LOGIN, data),
  refresh: (refreshToken: string) => axiosInstance.post<ApiResponse<AuthResponse>>(ENDPOINTS.REFRESH, { refreshToken }),
  verifyIpOtp: (data: { username: string; emailOtp: string }) => axiosInstance.post<ApiResponse<{ sessionToken: string; ipAddress: string }>>(ENDPOINTS.VERIFY_IP_OTP, data),
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
  getAll: () => axiosInstance.get<ApiResponse<ProductVariantResponse[]>>(ENDPOINTS.VARIANTS),
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
  getByMobile: (mobile: string) => axiosInstance.get<ApiResponse<InvoiceResponse[]>>(ENDPOINTS.INVOICES_BY_MOBILE, { params: { mobile } }),
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
  getLastMonthsSummary: (months = 6) => axiosInstance.get<ApiResponse<ProfitSummaryResponse[]>>(ENDPOINTS.PROFIT_SUMMARY_LAST_MONTHS, { params: { months } }),
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

// ── Returns ───────────────────────────────────────────────────
export const returnService = {
  create: (data: ItemReturnRequest) => axiosInstance.post<ApiResponse<ItemReturnResponse>>(ENDPOINTS.RETURNS, data),
  getAll: () => axiosInstance.get<ApiResponse<ItemReturnResponse[]>>(ENDPOINTS.RETURNS_ALL),
  getByInvoice: (invoiceId: number) => axiosInstance.get<ApiResponse<ItemReturnResponse[]>>(ENDPOINTS.RETURNS_BY_INVOICE(invoiceId)),
};

// ── Customer Credits ──────────────────────────────────────────
export const creditService = {
  create: (data: CustomerCreditRequest) => axiosInstance.post<ApiResponse<CustomerCreditResponse>>(ENDPOINTS.CREDITS, data),
  getAll: () => axiosInstance.get<ApiResponse<CustomerCreditResponse[]>>(ENDPOINTS.CREDITS),
  getPending: () => axiosInstance.get<ApiResponse<CustomerCreditResponse[]>>(ENDPOINTS.CREDITS_PENDING),
  getSummary: () => axiosInstance.get<ApiResponse<{ pendingCount: number; totalOutstanding: number }>>(ENDPOINTS.CREDITS_SUMMARY),
  getByCustomer: (customerId: number) => axiosInstance.get<ApiResponse<CustomerCreditResponse[]>>(ENDPOINTS.CREDITS_BY_CUSTOMER(customerId)),
  getByInvoice: (invoiceId: number) => axiosInstance.get<ApiResponse<CustomerCreditResponse>>(ENDPOINTS.CREDITS_BY_INVOICE(invoiceId)),
  recordPayment: (creditId: number, data: CreditPaymentRequest) => axiosInstance.post<ApiResponse<CustomerCreditResponse>>(ENDPOINTS.CREDIT_PAYMENT(creditId), data),
  checkCustomer: (customerId: number) => axiosInstance.get<ApiResponse<{ hasOutstandingCredit: boolean; outstandingAmount: number }>>(ENDPOINTS.CREDIT_CUSTOMER_CHECK(customerId)),
};

// ── Shop Day Management ───────────────────────────────────────
export const shopDayService = {
  getStatus: () => axiosInstance.get<ApiResponse<ShopStatusResponse>>(ENDPOINTS.SHOP_STATUS),
  openShop: () => axiosInstance.post<ApiResponse<ShopStatusResponse>>(ENDPOINTS.SHOP_OPEN),
  closeShop: () => axiosInstance.post<ApiResponse<ShopStatusResponse>>(ENDPOINTS.SHOP_CLOSE),
  getLogs: () => axiosInstance.get<ApiResponse<ShopStatusResponse[]>>(ENDPOINTS.SHOP_LOGS),
  getReport: (dayLogId: number) => axiosInstance.get<ApiResponse<DayReportResponse>>(ENDPOINTS.SHOP_REPORT(dayLogId)),
  downloadReport: (dayLogId: number) => axiosInstance.get(ENDPOINTS.SHOP_REPORT_DOWNLOAD(dayLogId), { responseType: "blob" }),
};

// ── IP Security ──────────────────────────────────────────────
export const ipSecurityService = {
  verifyOtp: (data: { username: string; emailOtp: string }) => axiosInstance.post<ApiResponse<{ sessionToken: string; ipAddress: string }>>(ENDPOINTS.VERIFY_IP_OTP, data),
  getMyIp: () => axiosInstance.get<ApiResponse<{ ipAddress: string }>>(ENDPOINTS.MY_IP),
  getAllowedIps: () => axiosInstance.get<ApiResponse<AllowedIpResponse[]>>(ENDPOINTS.IP_WHITELIST),
  addAllowedIp: (ipAddress: string, label?: string) => axiosInstance.post<ApiResponse<AllowedIpResponse>>(ENDPOINTS.IP_WHITELIST_ADD, { ipAddress, label }),
  removeAllowedIp: (id: number) => axiosInstance.delete<ApiResponse<void>>(ENDPOINTS.IP_WHITELIST_DELETE(id)),
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

// ── Utility: Print N copies of a barcode label image ───────────
// Opens a print-ready view that repeats the given label image (PNG blob)
// `quantity` times, one per physical label, sized to `widthMm` x `heightMm`.
// Intended for direct thermal label printers (e.g. 60mm x 30mm rolls).
export function printLabels(blob: Blob, quantity: number, widthMm = 60, heightMm = 30) {
  const url = URL.createObjectURL(blob);
  const count = Math.max(1, Math.floor(quantity) || 1);

  const labels = Array.from({ length: count })
    .map(() => `<div class="label"><img src="${url}" alt="Barcode label" /></div>`)
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Print Labels</title>
        <style>
          @page {
            size: ${widthMm}mm ${heightMm}mm;
            margin: 0;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { margin: 0; }
          .label {
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            overflow: hidden;
          }
          .label:last-child { page-break-after: auto; }
          .label img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        ${labels}
      </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(url, "_blank");
    }
  };

  // Wait for the image(s) to load before printing
  const img = doc.querySelector("img");
  if (img && !(img as HTMLImageElement).complete) {
    img.addEventListener("load", triggerPrint, { once: true });
    img.addEventListener("error", triggerPrint, { once: true });
  } else {
    setTimeout(triggerPrint, 200);
  }

  // Clean up after printing
  setTimeout(() => {
    document.body.removeChild(iframe);
    URL.revokeObjectURL(url);
  }, 60_000);
}

// ── Utility: Print a thermal receipt for an invoice ────────────
// Builds a narrow, continuous-roll receipt (default 80mm wide) directly
// from invoice + shop settings data already available on the frontend,
// and opens the browser print dialog. Change RECEIPT_WIDTH_MM below to
// match your thermal receipt roll (e.g. 58mm or 80mm).
export const RECEIPT_WIDTH_MM = 110;

function escapeHtml(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMoney(n: number): string {
  return `Rs. ${n.toFixed(2)}`;
}

function formatReceiptDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function printReceipt(invoice: InvoiceResponse, shop?: ShopSettingsResponse | null, widthMm: number = RECEIPT_WIDTH_MM) {
  const shopName = shop?.shopName || "RKT APPARELS";
  const itemsHtml = invoice.items
    .map((item) => {
      const variant = [item.color, item.size].filter(Boolean).join(" / ");
      return `
      <div class="item">
        <div class="item-name">${escapeHtml(item.designName)}${variant ? ` (${escapeHtml(variant)})` : ""}</div>
        <div class="item-row">
          <span>${item.quantity} x ${formatMoney(item.unitPrice)}</span>
          <span>${formatMoney(item.lineTotal)}</span>
        </div>
        ${item.discountAmount > 0 ? `<div class="item-row discount"><span>Discount</span><span>-${formatMoney(item.discountAmount)}</span></div>` : ""}
      </div>
    `;
    })
    .join("");

  // Payment mode label
  const modeLabel: Record<string, string> = {
    CASH: "💵 Cash",
    UPI: "📱 UPI",
    CARD: "💳 Card",
    OTHER: "🔄 Other",
  };
  const paymentModeLabel = modeLabel[invoice.paymentMode] || invoice.paymentMode || "Cash";

  // Credit / payment details block
  const hasCredit = invoice.hasCredit && (invoice.outstandingAmount ?? 0) > 0;
  const amountPaid = invoice.grandTotal - (invoice.outstandingAmount ?? 0);

  const paymentDetailsHtml = hasCredit
    ? `
    <div class="divider"></div>
    <div class="payment-section">
      <div class="payment-title">PAYMENT DETAILS</div>
      <div class="row"><span>Mode</span><span>${paymentModeLabel}</span></div>
      <div class="row"><span>Invoice Total</span><span>${formatMoney(invoice.grandTotal)}</span></div>
      <div class="row paid-row"><span>Amount Paid</span><span>${formatMoney(amountPaid)}</span></div>
      <div class="row outstanding-row">
        <span>OUTSTANDING</span>
        <span>${formatMoney(invoice.outstandingAmount ?? 0)}</span>
      </div>
      <div class="credit-note">Please clear your balance at the earliest.</div>
      ${shop?.mobileNumber ? `<div class="credit-note">Contact: ${escapeHtml(shop.mobileNumber)}</div>` : ""}
    </div>
  `
    : `
    <div class="divider"></div>
    <div class="payment-section">
      <div class="payment-title">PAYMENT DETAILS</div>
      <div class="row"><span>Mode</span><span>${paymentModeLabel}</span></div>
      <div class="row paid-full"><span>✓ PAID IN FULL</span><span>${formatMoney(invoice.grandTotal)}</span></div>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt ${escapeHtml(invoice.invoiceNumber)}</title>
        <style>
          @page {
            size: ${widthMm}mm auto;
            margin: 0;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Courier New', monospace; }
          body {
            width: ${widthMm}mm;
            padding: 3mm;
            font-size: 11px;
            color: #000;
          }
          .center { text-align: center; }
          .shop-name { font-size: 15px; font-weight: bold; text-transform: uppercase; }
          .muted { font-size: 9px; color: #333; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .row { display: flex; justify-content: space-between; gap: 6px; }
          .item { margin-bottom: 3px; }
          .item-name { font-weight: bold; }
          .item-row { display: flex; justify-content: space-between; font-size: 10px; }
          .item-row.discount { color: #333; }
          .totals .row { font-size: 11px; padding: 1px 0; }
          .grand-total { font-weight: bold; font-size: 13px; border-top: 1px dashed #000; padding-top: 3px; margin-top: 3px; }
          .footer { text-align: center; font-size: 9px; margin-top: 6px; }
          .payment-section { margin: 3px 0; }
          .payment-title { font-weight: bold; font-size: 10px; margin-bottom: 3px; }
          .paid-row { color: #006600; }
          .outstanding-row { font-weight: bold; font-size: 12px; color: #aa2200; margin-top: 3px; }
          .paid-full { font-weight: bold; color: #006600; }
          .credit-note { font-size: 9px; color: #555; margin-top: 3px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="shop-name">${escapeHtml(shopName)}</div>
          ${shop?.shopAddress ? `<div class="muted">${escapeHtml(shop.shopAddress)}</div>` : ""}
          ${shop?.mobileNumber ? `<div class="muted">Ph: ${escapeHtml(shop.mobileNumber)}</div>` : ""}
          ${shop?.gstNumber ? `<div class="muted">GSTIN: ${escapeHtml(shop.gstNumber)}</div>` : ""}
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>Invoice: ${escapeHtml(invoice.invoiceNumber)}</span>
        </div>
        <div class="row">
          <span>${formatReceiptDate(invoice.invoiceDate)}</span>
        </div>
        ${invoice.customerName ? `<div class="row"><span>Customer: ${escapeHtml(invoice.customerName)}</span></div>` : ""}
        ${invoice.customerMobile ? `<div class="row"><span>Mobile: ${escapeHtml(invoice.customerMobile)}</span></div>` : ""}
        <div class="row">
          <span>Served by: ${escapeHtml(invoice.createdByUsername)}</span>
        </div>

        <div class="divider"></div>

        ${itemsHtml}

        <div class="divider"></div>

        <div class="totals">
          <div class="row">
            <span>Subtotal</span>
            <span>${formatMoney(invoice.subtotal)}</span>
          </div>
          ${invoice.discountAmount > 0 ? `<div class="row"><span>Discount</span><span>-${formatMoney(invoice.discountAmount)}</span></div>` : ""}
          ${invoice.taxAmount > 0 ? `<div class="row"><span>Tax</span><span>${formatMoney(invoice.taxAmount)}</span></div>` : ""}
          <div class="row grand-total">
            <span>TOTAL</span>
            <span>${formatMoney(invoice.grandTotal)}</span>
          </div>
        </div>

        ${paymentDetailsHtml}

        ${invoice.notes ? `<div class="divider"></div><div class="muted">Note: ${escapeHtml(invoice.notes)}</div>` : ""}

        <div class="divider"></div>

        <div class="footer">
          ${shop?.footerMessage ? escapeHtml(shop.footerMessage) : "Thank you for shopping with us!"}
        </div>
      </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // no-op
    }
  }, 200);

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 60_000);
}
