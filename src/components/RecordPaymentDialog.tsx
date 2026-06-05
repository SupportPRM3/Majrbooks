import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface RecordPaymentDialogProps {
  invoice: {
    id: string;
    invoice_number: string;
    amount: number;
    amount_paid: number | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RecordPaymentDialog = ({
  invoice,
  open,
  onOpenChange,
  onSuccess,
}: RecordPaymentDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
    payment_method: "cash",
    notes: "",
  });

  const remainingAmount = invoice
    ? invoice.amount - (invoice.amount_paid || 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !invoice) return;

    const paymentAmount = parseFloat(formData.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (paymentAmount > remainingAmount) {
      toast({
        title: "Amount Too Large",
        description: `Payment cannot exceed remaining balance of $${remainingAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: paymentData, error } = await supabase.from("invoice_payments").insert({
        invoice_id: invoice.id,
        user_id: user.id,
        payment_date: formData.payment_date,
        amount: paymentAmount,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
      }).select().single();

      if (error) throw error;

      // Trigger payment received workflows
      if (paymentData) {
        supabase.functions.invoke("trigger-payment-workflow", {
          body: {
            paymentId: paymentData.id,
            invoiceId: invoice.id,
            userId: user.id,
          },
        }).catch((err) => console.error("Error triggering payment workflow:", err));
      }

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      // Reset form
      setFormData({
        payment_date: new Date().toISOString().split("T")[0],
        amount: "",
        payment_method: "cash",
        notes: "",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        {invoice && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Invoice: #{invoice.invoice_number}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total Amount: </span>
                <span className="font-medium">{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Already Paid: </span>
                <span className="font-medium">
                  {formatCurrency(invoice.amount_paid || 0)}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Remaining: </span>
                <span className="font-semibold text-primary">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) =>
                  setFormData({ ...formData, payment_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this payment..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentDialog;
