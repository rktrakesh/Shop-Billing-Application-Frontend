import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import type { InvoiceResponse, ShopSettingsResponse } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
  } catch {
    return dateStr;
  }
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    ROLE_ADMIN: "Admin",
    ROLE_MANAGER: "Manager",
    ROLE_USER: "Cashier",
  };
  return map[role] ?? role;
}

export function getRoleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    ROLE_ADMIN: "badge-danger",
    ROLE_MANAGER: "badge-warning",
    ROLE_USER: "badge-primary",
  };
  return map[role] ?? "badge-muted";
}

export function getStockChangeLabel(type: string): string {
  const map: Record<string, string> = {
    ADD_STOCK: "Stock Added",
    SALE: "Sale",
    RETURN: "Return",
    MANUAL_ADJUSTMENT: "Manual Adjustment",
  };
  return map[type] ?? type;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

/**
 * Returns this line's proportional share of an invoice-level amount
 * (e.g. an invoice-wide discount), based on the line's share of the
 * invoice subtotal: (lineAmount / subtotal) * invoiceAmount.
 *
 * Used by:
 *  - BillingPage: to reconcile a manually-typed "custom total" back into
 *    an equivalent discountAmount sent to the backend.
 *  - InvoicesPage: to compute the actual amount a customer paid per unit
 *    of a line item (for return refunds), after both the item-level
 *    discount and a proportional share of the invoice-level discount.
 *
 * Returns 0 if subtotal is 0 or invoiceAmount is 0/negative.
 */
export function proportionalShare(lineAmount: number, subtotal: number, invoiceAmount: number): number {
  if (subtotal <= 0 || invoiceAmount <= 0) return 0;
  return (lineAmount / subtotal) * invoiceAmount;
}

/**
 * The actual amount paid per unit of a line item, after the item-level
 * discount (already baked into lineTotal) AND a proportional share of
 * the invoice-level discount.
 */
export function actualUnitPriceFromLine(lineTotal: number, quantity: number, subtotal: number, invoiceDiscount: number): number {
  if (quantity <= 0) return 0;
  const proportionalDiscount = proportionalShare(lineTotal, subtotal, invoiceDiscount);
  const actualPaidForLine = lineTotal - proportionalDiscount;
  return actualPaidForLine / quantity;
}

// ── WhatsApp Receipt Sharing ─────────────────────────────────────
//
// No API, no account, no cost — this just builds a "Click to Chat" deep link
// (https://wa.me/<number>?text=<message>) which opens WhatsApp (app or web)
// with the message pre-typed. The person still has to hit Send themselves;
// nothing is sent automatically from our servers.

/**
 * Normalizes a raw phone number into WhatsApp's expected format:
 * digits only, with an Indian country code (91) prepended if it looks
 * like a bare 10-digit local number and doesn't already have one.
 */
export function normalizeWhatsAppNumber(rawNumber: string): string {
  const digits = rawNumber.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits; // assume it already includes a country code
}

/**
 * Builds the itemized WhatsApp receipt message text for an invoice.
 */
export function buildWhatsAppReceiptMessage(invoice: InvoiceResponse, shop?: ShopSettingsResponse | null): string {
  const shopName = shop?.shopName || "RKT Apparels";
  const lines: string[] = [];

  lines.push(`*${shopName}*`);
  lines.push(`Invoice: ${invoice.invoiceNumber}`);
  lines.push(`Date: ${formatDateTime(invoice.createdAt)}`);
  if (invoice.customerName) lines.push(`Customer: ${invoice.customerName}`);
  lines.push("");
  lines.push("*Items*");

  for (const item of invoice.items) {
    const variant = [item.color, item.size].filter(Boolean).join("/");
    const name = variant ? `${item.designName} (${variant})` : item.designName;
    lines.push(`${name}`);
    lines.push(`  ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.lineTotal)}`);
  }

  lines.push("");
  lines.push(`Subtotal: ${formatCurrency(invoice.subtotal)}`);
  if (invoice.discountAmount > 0) lines.push(`Discount: -${formatCurrency(invoice.discountAmount)}`);
  if (invoice.taxAmount > 0) lines.push(`Tax: ${formatCurrency(invoice.taxAmount)}`);
  lines.push(`*Total: ${formatCurrency(invoice.grandTotal)}*`);

  if (invoice.hasCredit && (invoice.outstandingAmount ?? 0) > 0) {
    lines.push("");
    lines.push(`Amount Paid: ${formatCurrency(invoice.grandTotal - (invoice.outstandingAmount ?? 0))}`);
    lines.push(`*Outstanding: ${formatCurrency(invoice.outstandingAmount ?? 0)}*`);
  }

  lines.push("");
  lines.push(shop?.footerMessage || "Thank you for shopping with us!");
  if (shop?.mobileNumber) lines.push(`Contact: ${shop.mobileNumber}`);

  return lines.join("\n");
}

/**
 * Opens WhatsApp (app or web) with the given number and message pre-filled.
 * Returns false (and doesn't open anything) if the number is invalid.
 */
export function openWhatsAppShare(rawNumber: string, message: string): boolean {
  const number = normalizeWhatsAppNumber(rawNumber);
  if (number.length < 10) return false;
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
