import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface LineItem {
  id: string;
  description: string;
  rate: number;
  quantity: number;
}

interface RecurringInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientEmail: string;
}

export const RecurringInvoiceDialog = ({
  open,
  onOpenChange,
  clientName,
  clientEmail,
}: RecurringInvoiceDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    invoice_number_prefix: "INV",
    frequency: "monthly",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    notes: "",
    terms: "",
    auto_send: false,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", rate: 0, quantity: 1 },
  ]);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: crypto.randomUUID(), description: "", rate: 0, quantity: 1 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.rate * item.quantity, 0);
  };

  const calculateNextRunDate = () => {
    const startDate = new Date(formData.start_date);
    switch (formData.frequency) {
      case "weekly":
        return startDate;
      case "monthly":
        return startDate;
      case "quarterly":
        return startDate;
      case "yearly":
        return startDate;
      default:
        return startDate;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    const subtotal = calculateSubtotal();
    if (subtotal <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Invoice total must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const nextRunDate = calculateNextRunDate();
      
      const recurringInvoiceData = {
        user_id: user.id,
        client_name: clientName,
        client_email: clientEmail || null,
        invoice_number_prefix: formData.invoice_number_prefix,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        next_run_date: format(nextRunDate, "yyyy-MM-dd"),
        status: "active",
        notes: formData.notes || null,
        terms: formData.terms || null,
        amount: subtotal,
        subtotal: subtotal,
        tax: 0,
        auto_send: formData.auto_send,
      };

      const { data: recurringInvoice, error: recurringError } = await supabase
        .from("recurring_invoices")
        .insert(recurringInvoiceData)
        .select()
        .single();

      if (recurringError) throw recurringError;

      const lineItemsData = lineItems.map((item) => ({
        recurring_invoice_id: recurringInvoice.id,
        description: item.description,
        rate: item.rate,
        quantity: item.quantity,
      }));

      const { error: lineItemsError } = await supabase
        .from("recurring_invoice_line_items")
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      toast({
        title: "Success",
        description: "Recurring invoice created successfully",
      });

      onOpenChange(false);
      
      // Reset form
      setFormData({
        invoice_number_prefix: "INV",
        frequency: "monthly",
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: "",
        notes: "",
        terms: "",
        auto_send: false,
      });
      setLineItems([{ id: crypto.randomUUID(), description: "", rate: 0, quantity: 1 }]);
    } catch (error) {
      console.error("Error creating recurring invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create recurring invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Recurring Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Invoice Number Prefix</Label>
              <Input
                value={formData.invoice_number_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_number_prefix: e.target.value })}
              />
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date (Optional)</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-6">Description</div>
              <div className="col-span-2">Rate</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {lineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-6">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={item.rate || ""}
                    onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity || ""}
                    onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-1 text-right pt-2">${(item.rate * item.quantity).toFixed(2)}</div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(item.id)}
                    disabled={lineItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addLineItem} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          </div>

          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">${subtotal.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Terms</Label>
            <Textarea
              placeholder="Payment terms..."
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.auto_send}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_send: checked })}
            />
            <Label>Automatically send invoices to client</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              Create Recurring Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
