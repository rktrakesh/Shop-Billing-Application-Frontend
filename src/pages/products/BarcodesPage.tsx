import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QrCode, Search, Download, FileDown, RefreshCw, Printer } from "lucide-react";
import { variantService, barcodeService, settingsService, downloadBlob, printLabels } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui/index";
import { PageHeader, EmptyState, ConfirmDialog } from "@/components/common";
import { formatCurrency } from "@/utils";
import type { ProductVariantResponse } from "@/types";
import toast from "react-hot-toast";

export default function BarcodesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ProductVariantResponse | null>(null);
  const [printQty, setPrintQty] = useState(1);
  const [printing, setPrinting] = useState(false);
  const [confirmLargePrint, setConfirmLargePrint] = useState(false);

  // Soft cap — printing more than this many labels at once is almost
  // certainly a typo, so confirm before sending it to the printer.
  const LARGE_PRINT_THRESHOLD = 100;

  // GET /api/settings is available to all authenticated roles.
  const { data: settingsRes } = useQuery({
    queryKey: ["shop-settings"],
    queryFn: () => settingsService.get(),
  });
  const shopName = settingsRes?.data?.data?.shopName || "RKT APPARELS";

  const { data: variantsRes, isLoading } = useQuery({
    queryKey: ["all-variants"],
    queryFn: () => variantService.getAll(),
  });
  const variants = variantsRes?.data?.data ?? [];

  const filtered = variants.filter((v) => !search || v.designName.toLowerCase().includes(search.toLowerCase()) || v.productCode.toLowerCase().includes(search.toLowerCase()) || v.barcode?.includes(search));

  const generateMutation = useMutation({
    mutationFn: (variantId: number) => barcodeService.generate(variantId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["all-variants"] });
      setSelected(res.data.data);
      toast.success("Barcode generated");
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (variantId: number) => barcodeService.regenerate(variantId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["all-variants"] });
      setSelected(res.data.data);
      toast.success("Barcode regenerated");
    },
  });

  const handleDownloadPng = async (id: number, code: string) => {
    try {
      const res = await barcodeService.downloadPng(id);
      downloadBlob(res.data, `barcode_${code}.png`);
    } catch {
      toast.error("Failed to download");
    }
  };

  const handleDownloadPdf = async (id: number, code: string) => {
    try {
      const res = await barcodeService.downloadPdf(id);
      downloadBlob(res.data, `barcode_${code}.pdf`);
    } catch {
      toast.error("Failed to download");
    }
  };

  const handlePrintLabels = async (id: number) => {
    setPrinting(true);
    try {
      const res = await barcodeService.downloadPng(id);
      printLabels(res.data, printQty, 60, 30);
    } catch {
      toast.error("Failed to open print preview");
    } finally {
      setPrinting(false);
    }
  };

  // Entry point from the "Print N Labels" button — confirms first if the
  // quantity looks unintentionally large.
  const handlePrintClick = (id: number) => {
    if (printQty > LARGE_PRINT_THRESHOLD) {
      setConfirmLargePrint(true);
      return;
    }
    handlePrintLabels(id);
  };

  return (
    <div>
      <PageHeader title="Barcode Management" subtitle="Generate, preview and download barcode labels" />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Variant list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  Product Variants
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="Search by name, code or barcode..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} className="mb-3" />
              {isLoading ? (
                <p className="text-sm text-text-muted py-4 text-center">Loading...</p>
              ) : filtered.length === 0 ? (
                <EmptyState icon={QrCode} title="No variants found" />
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {filtered.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelected(v);
                        setPrintQty(1);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${selected?.id === v.id ? "border-primary/60 bg-primary/10" : "border-border/30 hover:border-primary/30 hover:bg-card/30"}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{v.designName}</p>
                        <p className="text-xs text-text-muted">
                          {v.color} · {v.size} · {v.productCode}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">{v.barcode ? <span className="font-mono text-xs text-primary">{v.barcode}</span> : <Badge variant="muted">No barcode</Badge>}</div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Label Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Label Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {!selected ? (
                <EmptyState icon={QrCode} title="No variant selected" description="Choose a variant to preview its barcode label" />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {/* Label mockup */}
                  <div className="w-full bg-white text-black rounded-lg p-4 text-center border-2 border-dashed border-border/40">
                    <p className="text-xs font-bold uppercase tracking-wide">{shopName}</p>
                    <p className="text-sm font-semibold mt-1">{selected.designName}</p>
                    <p className="text-xs text-gray-600">
                      {selected.color} | {selected.size}
                    </p>
                    <p className="text-sm font-bold mt-1">MRP {formatCurrency(selected.sellingPrice)}</p>
                    <p className="text-xs text-gray-600 mt-1">Code: {selected.productCode}</p>
                    {selected.barcode ? (
                      <div className="mt-2 flex flex-col items-center">
                        <div className="w-full h-12 bg-[repeating-linear-gradient(90deg,#000_0px,#000_2px,transparent_2px,transparent_4px)]" />
                        <p className="text-xs font-mono mt-1 tracking-widest">{selected.barcode}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2 italic">No barcode generated yet</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-full space-y-2">
                    {!selected.barcode ? (
                      <Button className="w-full" onClick={() => generateMutation.mutate(selected.id)} loading={generateMutation.isPending}>
                        <QrCode className="h-4 w-4" />
                        Generate Barcode
                      </Button>
                    ) : (
                      <>
                        {/* <Button className="w-full" variant="outline" onClick={() => regenerateMutation.mutate(selected.id)} loading={regenerateMutation.isPending}>
                          <RefreshCw className="h-4 w-4" />
                          Regenerate Barcode
                        </Button> */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="secondary" onClick={() => handleDownloadPng(selected.id, selected.productCode)}>
                            <Download className="h-4 w-4" />
                            PNG
                          </Button>
                          <Button variant="secondary" onClick={() => handleDownloadPdf(selected.id, selected.productCode)}>
                            <FileDown className="h-4 w-4" />
                            PDF
                          </Button>
                        </div>

                        {/* Print labels (thermal label printer, 60mm x 30mm) */}
                        <div className="pt-2 border-t border-border/30 space-y-2">
                          <label className="text-xs text-text-muted">Number of labels to print</label>
                          <div className="flex items-center gap-2">
                            <Input type="number" min={1} value={printQty} onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-24" />
                            {selected.stock > 0 && (
                              <button type="button" onClick={() => setPrintQty(selected.stock)} className="text-xs text-primary hover:underline">
                                Use stock ({selected.stock})
                              </button>
                            )}
                          </div>
                          <Button className="w-full" onClick={() => handlePrintClick(selected.id)} loading={printing}>
                            <Printer className="h-4 w-4" />
                            Print {printQty} Label{printQty > 1 ? "s" : ""}
                          </Button>
                          <p className="text-xs text-text-muted">Label size: 60mm × 30mm. Select your thermal label printer in the print dialog.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLargePrint}
        onClose={() => setConfirmLargePrint(false)}
        onConfirm={() => {
          setConfirmLargePrint(false);
          if (selected) handlePrintLabels(selected.id);
        }}
        title="Print a large batch?"
        description={`You're about to print ${printQty} labels. This will send ${printQty} pages to your printer — double-check this is the quantity you intended.`}
        confirmLabel={`Print ${printQty} Labels`}
        variant="warning"
      />
    </div>
  );
}
