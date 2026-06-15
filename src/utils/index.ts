import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

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
