import { useEffect, useState } from "react";
import { Download, FileWarning, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/index";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/services";

interface PdfViewDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  // Called once when the dialog opens, should resolve to a PDF Blob
  fetchPdf: () => Promise<Blob>;
  filename: string;
}

export function PdfViewDialog({ open, onClose, title, fetchPdf, filename }: PdfViewDialogProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) {
      // Clean up when closed
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      setBlob(null);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchPdf()
      .then((b) => {
        if (cancelled) return;
        const url = URL.createObjectURL(b);
        setBlob(b);
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDownload = () => {
    if (blob) downloadBlob(blob, filename);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <div className="flex items-center justify-between w-full pr-8">
            <DialogTitle>{title}</DialogTitle>
            {blob && (
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            )}
          </div>
        </DialogHeader>
        <DialogBody className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-text-muted">Loading report...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-6">
              <FileWarning className="h-8 w-8 text-danger" />
              <p className="text-sm text-text-secondary">Could not load this report for preview.</p>
              <p className="text-xs text-text-muted">You can still try downloading it directly using the button below.</p>
              {blob && (
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download instead
                </Button>
              )}
            </div>
          ) : blobUrl ? (
            <div className="flex flex-col">
              <iframe src={blobUrl} title={title} className="w-full rounded-b-xl" style={{ height: "75vh", border: "none", background: "#fff" }} />
              <div className="px-4 py-2.5 border-t border-border/30 text-center">
                <p className="text-xs text-text-muted">
                  Preview not showing correctly, or want to keep a copy?{" "}
                  <button onClick={handleDownload} className="text-primary hover:underline">
                    Download this report
                  </button>{" "}
                  for the full, formatted PDF.
                </p>
              </div>
            </div>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
