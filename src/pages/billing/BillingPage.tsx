import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QrCode, Search, Plus, Minus, Trash2, ShoppingCart, UserPlus, Download, X, Check, User, Printer } from "lucide-react";
import { barcodeService, customerService, invoiceService, variantService, downloadBlob, printBlob } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/index";
import { formatCurrency } from "@/utils";
import type { CartItem, CustomerResponse, InvoiceRequest, ProductVariantResponse } from "@/types";
import toast from "react-hot-toast";

// Simple id generator for cart items
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// Compute discount amount based on type, percent/flat value, qty and unit price
function calcDiscount(type: "flat" | "percent", percent: number, flat: number, quantity: number, unitPrice: number): number {
  if (type === "percent") {
    return Math.round((percent / 100) * quantity * unitPrice * 100) / 100;
  }
  return flat;
}

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;

export default function BillingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<"flat" | "percent">("flat");
  const [invoiceDiscountPercent, setInvoiceDiscountPercent] = useState(0);
  const [customTotal, setCustomTotal] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [searchedVariants, setSearchedVariants] = useState<ProductVariantResponse[]>([]);
  const [lastInvoice, setLastInvoice] = useState<{ id: number; number: string } | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Customer search
  const { data: customerRes, isLoading: cLoading } = useQuery({
    queryKey: ["customers-search", customerSearch],
    queryFn: () => customerService.search(customerSearch),
    enabled: customerSearch.length >= 2,
  });
  const customers = customerRes?.data?.data ?? [];

  // New customer form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const createCustomerMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: (res) => {
      setSelectedCustomer(res.data.data);
      setShowCustomerDialog(false);
      reset();
      toast.success("Customer created");
    },
  });

  // Barcode scan
  const handleBarcodeScan = async () => {
    if (!barcodeInput.trim()) return;
    try {
      const res = await barcodeService.search(barcodeInput.trim());
      const variant = res.data.data;
      addVariantToCart(variant);
      setBarcodeInput("");
      barcodeRef.current?.focus();
    } catch {
      toast.error(`Barcode "${barcodeInput}" not found`);
      setBarcodeInput("");
    }
  };

  const addVariantToCart = (variant: ProductVariantResponse) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.barcode === variant.barcode && item.productVariantId === variant.id);
      if (existing) {
        return prev.map((item) => {
          if (item.id !== existing.id) return item;
          const newQty = item.quantity + 1;
          const discountAmount = calcDiscount(item.discountType, item.discountPercent, item.discountAmount, newQty, item.unitPrice);
          return { ...item, quantity: newQty, discountAmount, lineTotal: newQty * item.unitPrice - discountAmount };
        });
      }
      const newItem: CartItem = {
        id: uid(),
        barcode: variant.barcode,
        designName: variant.designName,
        productCode: variant.productCode,
        color: variant.color,
        size: variant.size,
        unitPrice: variant.sellingPrice,
        quantity: 1,
        discountAmount: 0,
        discountPercent: 0,
        discountType: "flat",
        lineTotal: variant.sellingPrice,
        productVariantId: variant.id,
      };
      return [...prev, newItem];
    });
    toast.success(`Added: ${variant.designName} (${variant.color} / ${variant.size})`, { duration: 2000 });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(1, item.quantity + delta);
        const discountAmount = calcDiscount(item.discountType, item.discountPercent, item.discountAmount, newQty, item.unitPrice);
        return { ...item, quantity: newQty, discountAmount, lineTotal: newQty * item.unitPrice - discountAmount };
      }),
    );
  };

  // Switch between flat ₹ and % discount for an item
  const setDiscountType = (id: string, type: "flat" | "percent") => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const discountAmount = calcDiscount(type, item.discountPercent, item.discountAmount, item.quantity, item.unitPrice);
        return { ...item, discountType: type, discountAmount, lineTotal: item.quantity * item.unitPrice - discountAmount };
      }),
    );
  };

  // Update discount value (flat ₹ amount or % depending on current type)
  const updateDiscount = (id: string, value: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.discountType === "percent") {
          const clamped = Math.min(100, Math.max(0, value));
          const discountAmount = calcDiscount("percent", clamped, item.discountAmount, item.quantity, item.unitPrice);
          return { ...item, discountPercent: clamped, discountAmount, lineTotal: item.quantity * item.unitPrice - discountAmount };
        }
        const discountAmount = Math.max(0, value);
        return { ...item, discountAmount, lineTotal: item.quantity * item.unitPrice - discountAmount };
      }),
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // If a custom total is entered, that becomes the final amount charged.
  // Otherwise, fall back to the auto-calculated grandTotal.
  const finalTotal = customTotal !== "" ? Math.max(0, customTotal) : grandTotal;

  // The backend computes grandTotal = subtotal - discountAmount + taxAmount.
  // To make a custom total "stick" on the backend invoice as well, we send
  // an effective discount that reconciles subtotal -> finalTotal.
  const effectiveDiscountAmount = customTotal !== "" ? Math.max(0, subtotal - finalTotal) : discountAmount;

  // Keep ₹ discount in sync with % when cart subtotal changes
  useEffect(() => {
    if (invoiceDiscountType === "percent") {
      setDiscountAmount(Math.round((invoiceDiscountPercent / 100) * subtotal * 100) / 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  // Update invoice-level discount value (flat ₹ or %)
  const handleInvoiceDiscountChange = (value: number) => {
    if (invoiceDiscountType === "percent") {
      const clamped = Math.min(100, Math.max(0, value));
      setInvoiceDiscountPercent(clamped);
      setDiscountAmount(Math.round((clamped / 100) * subtotal * 100) / 100);
    } else {
      setDiscountAmount(Math.max(0, value));
    }
  };

  const handleInvoiceDiscountTypeChange = (type: "flat" | "percent") => {
    setInvoiceDiscountType(type);
    if (type === "percent") {
      setDiscountAmount(Math.round((invoiceDiscountPercent / 100) * subtotal * 100) / 100);
    }
  };

  // Product variant search
  const handleProductSearch = async () => {
    if (!productSearch.trim()) return;
    try {
      const res = await variantService.search(productSearch);
      setSearchedVariants(res.data.data ?? []);
      setShowVariantDialog(true);
    } catch {
      toast.error("Search failed");
    }
  };

  // Create invoice
  const createInvoiceMutation = useMutation({
    mutationFn: (req: InvoiceRequest) => invoiceService.create(req),
    onSuccess: (res) => {
      const inv = res.data.data;
      setLastInvoice({ id: inv.id, number: inv.invoiceNumber });
      toast.success(`Invoice ${inv.invoiceNumber} created!`);
      setCart([]);
      setSelectedCustomer(null);
      setDiscountAmount(0);
      setInvoiceDiscountType("flat");
      setInvoiceDiscountPercent(0);
      setCustomTotal("");
      setNotes("");
    },
  });

  const handleGenerateInvoice = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    const req: InvoiceRequest = {
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerMobile: selectedCustomer?.mobileNumber,
      items: cart.map((item) => ({
        barcode: item.barcode,
        designName: item.designName,
        productCode: item.productCode,
        color: item.color,
        size: item.size,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discountAmount: item.discountAmount,
      })),
      discountAmount: effectiveDiscountAmount,
      notes,
    };
    createInvoiceMutation.mutate(req);
  };

  const [printing, setPrinting] = useState(false);

  const handleDownloadPdf = async () => {
    if (!lastInvoice) return;
    try {
      const res = await invoiceService.downloadPdf(lastInvoice.id);
      downloadBlob(res.data, `${lastInvoice.number}.pdf`);
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  const handlePrintPdf = async () => {
    if (!lastInvoice) return;
    setPrinting(true);
    try {
      const res = await invoiceService.downloadPdf(lastInvoice.id);
      printBlob(res.data);
    } catch {
      toast.error("Failed to open print preview");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT: Search + Product Scan */}
      <div className="flex-1 space-y-4">
        {/* Barcode Scanner */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                Barcode Scanner
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input ref={barcodeRef} placeholder="Scan or type barcode, press Enter..." value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleBarcodeScan()} autoFocus className="font-mono" />
              <Button onClick={handleBarcodeScan} disabled={!barcodeInput}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Search */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Manual Product Search
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="Search by product name or code..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleProductSearch()} />
              <Button variant="secondary" onClick={handleProductSearch}>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customer */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Customer
                </span>
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowCustomerDialog(true)}>
                <UserPlus className="h-3.5 w-3.5" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-success/10 border border-success/20 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-text-primary">{selectedCustomer.name}</p>
                  <p className="text-xs text-text-muted">{selectedCustomer.mobileNumber || "No mobile"}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-text-muted hover:text-danger">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input placeholder="Search customer by name or mobile..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
                {customerSearch.length >= 2 && (
                  <div className="border border-border/30 rounded-lg overflow-hidden max-h-40 overflow-y-auto bg-card">
                    {cLoading ? (
                      <p className="p-3 text-sm text-text-muted">Searching...</p>
                    ) : customers.length === 0 ? (
                      <p className="p-3 text-sm text-text-muted">No customers found. Create one?</p>
                    ) : (
                      customers.map((c) => (
                        <button
                          key={c.id}
                          className="w-full px-3 py-2.5 text-left hover:bg-card-hover flex items-center justify-between"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch("");
                          }}
                        >
                          <div>
                            <p className="text-sm text-text-primary">{c.name}</p>
                            <p className="text-xs text-text-muted">{c.mobileNumber}</p>
                          </div>
                          <Badge variant="muted">{c.totalPurchases} orders</Badge>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <p className="text-xs text-text-muted">Leave empty for walk-in customer</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success banner */}
        {lastInvoice && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-success">Invoice Generated!</p>
                <p className="text-xs text-text-muted">{lastInvoice.number}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrintPdf} loading={printing}>
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadPdf}>
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setLastInvoice(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Cart */}
      <div className="w-full lg:w-[400px] flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Cart
                  {cart.length > 0 && <Badge variant="primary">{cart.length} items</Badge>}
                </span>
              </CardTitle>
              {cart.length > 0 && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    setCart([]);
                    setCustomTotal("");
                    setDiscountAmount(0);
                    setInvoiceDiscountPercent(0);
                    setInvoiceDiscountType("flat");
                  }}
                  title="Clear cart"
                >
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-10 w-10 text-text-muted mb-3 opacity-40" />
                <p className="text-sm text-text-muted">Cart is empty</p>
                <p className="text-xs text-text-muted mt-1">Scan a barcode or search for products</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="px-4 py-3 border-b border-border/20 hover:bg-card/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{item.designName}</p>
                        <p className="text-xs text-text-muted">{[item.color, item.size, item.productCode].filter(Boolean).join(" · ")}</p>
                        {item.barcode && <p className="text-[10px] font-mono text-text-muted mt-0.5">{item.barcode}</p>}
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-text-muted hover:text-danger mt-0.5">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 gap-2">
                      {/* Quantity */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-card flex items-center justify-center hover:bg-card-hover text-text-secondary">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-medium text-text-primary">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-card flex items-center justify-center hover:bg-card-hover text-text-secondary">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price info */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(item.lineTotal)}</p>
                        <p className="text-xs text-text-muted">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                    </div>

                    {/* Item discount */}
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-text-muted">Discount:</label>
                      <input
                        type="number"
                        min={0}
                        max={item.discountType === "percent" ? 100 : undefined}
                        step={item.discountType === "percent" ? 1 : 0.01}
                        value={item.discountType === "percent" ? item.discountPercent || "" : item.discountAmount || ""}
                        onChange={(e) => updateDiscount(item.id, parseFloat(e.target.value) || 0)}
                        placeholder={item.discountType === "percent" ? "0" : "₹0"}
                        className="w-20 text-xs bg-card border border-border/40 rounded px-2 py-1 text-text-secondary focus:outline-none focus:border-primary/60"
                      />
                      {/* Flat / Percent toggle */}
                      <div className="flex items-center rounded border border-border/40 overflow-hidden text-xs">
                        <button type="button" onClick={() => setDiscountType(item.id, "flat")} className={`px-2 py-1 transition-colors ${item.discountType === "flat" ? "bg-primary text-white" : "bg-card text-text-muted hover:text-text-secondary"}`}>
                          ₹
                        </button>
                        <button type="button" onClick={() => setDiscountType(item.id, "percent")} className={`px-2 py-1 transition-colors ${item.discountType === "percent" ? "bg-primary text-white" : "bg-card text-text-muted hover:text-text-secondary"}`}>
                          %
                        </button>
                      </div>
                      {item.discountAmount > 0 && <span className="text-xs text-success">-{formatCurrency(item.discountAmount)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-border/30 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Subtotal</span>
                    <span className="text-text-secondary">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-text-muted">Invoice Discount</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={invoiceDiscountType === "percent" ? 100 : undefined}
                        step={invoiceDiscountType === "percent" ? 1 : 0.01}
                        value={invoiceDiscountType === "percent" ? invoiceDiscountPercent || "" : discountAmount || ""}
                        onChange={(e) => handleInvoiceDiscountChange(parseFloat(e.target.value) || 0)}
                        placeholder={invoiceDiscountType === "percent" ? "0" : "₹0"}
                        className="w-20 text-right text-sm bg-card border border-border/40 rounded px-2 py-1 text-text-secondary focus:outline-none focus:border-primary/60"
                      />
                      <div className="flex items-center rounded border border-border/40 overflow-hidden text-xs">
                        <button type="button" onClick={() => handleInvoiceDiscountTypeChange("flat")} className={`px-2 py-1 transition-colors ${invoiceDiscountType === "flat" ? "bg-primary text-white" : "bg-card text-text-muted hover:text-text-secondary"}`}>
                          ₹
                        </button>
                        <button type="button" onClick={() => handleInvoiceDiscountTypeChange("percent")} className={`px-2 py-1 transition-colors ${invoiceDiscountType === "percent" ? "bg-primary text-white" : "bg-card text-text-muted hover:text-text-secondary"}`}>
                          %
                        </button>
                      </div>
                    </div>
                  </div>
                  {discountAmount > 0 && <div className="flex justify-end text-xs text-success">-{formatCurrency(discountAmount)} discount applied</div>}
                  <div className="flex justify-between text-base font-bold border-t border-border/30 pt-2">
                    <span className="text-text-primary">Total</span>
                    <span className="text-primary">{formatCurrency(grandTotal)}</span>
                  </div>

                  {/* Manual total override */}
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-text-muted">Custom Total (optional)</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={customTotal}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomTotal(val === "" ? "" : Math.max(0, parseFloat(val) || 0));
                      }}
                      placeholder={formatCurrency(grandTotal)}
                      className="w-28 text-right text-sm bg-card border border-border/40 rounded px-2 py-1 text-text-secondary focus:outline-none focus:border-primary/60"
                    />
                  </div>

                  {customTotal !== "" && (
                    <div className="flex justify-between text-base font-bold border-t border-border/30 pt-2">
                      <span className="text-text-primary">Payable</span>
                      <span className="text-success">{formatCurrency(finalTotal)}</span>
                    </div>
                  )}
                </div>

                <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-sm bg-card border border-border/40 rounded-lg px-3 py-2 text-text-secondary placeholder:text-text-muted focus:outline-none focus:border-primary/60" />

                <Button className="w-full" size="lg" onClick={handleGenerateInvoice} loading={createInvoiceMutation.isPending}>
                  Generate Invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Variant Search Dialog */}
      <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Product Variant</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {searchedVariants.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No variants found</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {searchedVariants.map((v) => (
                  <button
                    key={v.id}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border/30 hover:border-primary/40 hover:bg-card/40 text-left"
                    onClick={() => {
                      addVariantToCart(v);
                      setShowVariantDialog(false);
                      setProductSearch("");
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{v.designName}</p>
                      <p className="text-xs text-text-muted">
                        {v.color} / {v.size} · {v.productCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">{formatCurrency(v.sellingPrice)}</p>
                      <p className="text-xs text-text-muted">Stock: {v.stock}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => createCustomerMutation.mutate(data))}>
            <DialogBody className="space-y-3">
              <Input label="Name *" error={errors.name?.message} {...register("name")} />
              <Input label="Mobile Number" {...register("mobileNumber")} />
              <Input label="Address" {...register("address")} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCustomerDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createCustomerMutation.isPending}>
                Create Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
