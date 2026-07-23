import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, Textarea } from "@/components/ui/index";
import { buildWhatsAppReceiptMessage, openWhatsAppShare } from "@/utils";
import type { InvoiceResponse, ShopSettingsResponse } from "@/types";
import toast from "react-hot-toast";

interface WhatsAppShareDialogProps {
  invoice: InvoiceResponse | null;
  shop?: ShopSettingsResponse | null;
  onClose: () => void;
}

/**
 * Lets the cashier confirm/edit the customer's number before opening
 * WhatsApp with the receipt text pre-filled. Nothing is sent from our
 * servers — this only builds a wa.me link and opens it in a new tab.
 */
export function WhatsAppShareDialog({ invoice, shop, onClose }: WhatsAppShareDialogProps) {
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (invoice) {
      setMobile(invoice.customerMobile || "");
      setMessage(buildWhatsAppReceiptMessage(invoice, shop));
    }
  }, [invoice, shop]);

  const handleSend = () => {
    if (!mobile.trim()) {
      toast.error("Please enter a mobile number");
      return;
    }
    const opened = openWhatsAppShare(mobile, message);
    if (!opened) {
      toast.error("That doesn't look like a valid mobile number");
      return;
    }
    onClose();
  };

  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-success" />
            Share Receipt via WhatsApp
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <Input label="Customer's Mobile Number" placeholder="e.g. 9876543210" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <Textarea label="Message Preview (editable)" value={message} onChange={(e) => setMessage(e.target.value)} rows={10} className="font-mono text-xs" />
          <p className="text-xs text-text-muted">This opens WhatsApp with the message pre-filled — you (or the customer) still need to hit Send.</p>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSend}>
            <MessageCircle className="h-4 w-4" />
            Open WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
