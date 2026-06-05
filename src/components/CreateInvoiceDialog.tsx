import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Calendar, DollarSign, FileText, Mail } from "lucide-react";
import { format } from "date-fns";

interface CreateInvoiceDialogProps {
  clientName: string;
  clientEmail?: string;
  clientUserId?: string; // Secure link to client's auth account
  onInvoiceCreated?: () => void;
}

export const CreateInvoiceDialog = ({
  clientName,
  clientEmail,
  clientUserId,
  onInvoiceCreated,
}: CreateInvoiceDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now()}`,
    subtotal: "",
    tax_rate_id: "",
    tax: 0,
    amount: 0,
    issue_date: format(new Date(), "yyyy-MM-dd"),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    status: "draft",
    notes: "",
  });

  const { data: taxRates } = useQuery({
    queryKey: ["tax_rates", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("tax_rates")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate tax and total amount when subtotal or tax rate changes
  useEffect(() => {
    const subtotal = parseFloat(formData.subtotal) || 0;
    const selectedTaxRate = taxRates?.find(rate => rate.id === formData.tax_rate_id);
    const taxRate = selectedTaxRate ? parseFloat(selectedTaxRate.rate.toString()) : 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      tax: taxAmount,
      amount: totalAmount,
    }));
  }, [formData.subtotal, formData.tax_rate_id, taxRates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    const subtotal = parseFloat(formData.subtotal);
    if (!subtotal || subtotal <= 0) {
      toast({
        title: "Invalid Subtotal",
        description: "Please enter a valid subtotal greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const selectedTaxRate = taxRates?.find(rate => rate.id === formData.tax_rate_id);
      
      const { error } = await supabase.from("invoices").insert({
        user_id: user.id,
        client_name: clientName,
        client_email: clientEmail || null,
        client_user_id: clientUserId || null, // Secure link to client's auth account
        invoice_number: formData.invoice_number,
        subtotal: subtotal,
        tax: formData.tax,
        tax_rate: selectedTaxRate ? parseFloat(selectedTaxRate.rate.toString()) : 0,
        tax_rate_id: formData.tax_rate_id || null,
        tax_name: selectedTaxRate?.name || null,
        amount: formData.amount,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        status: formData.status,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Invoice Created",
        description: `Invoice ${formData.invoice_number} has been created successfully.`,
      });

      setOpen(false);
      setFormData({
        invoice_number: `INV-${Date.now()}`,
        subtotal: "",
        tax_rate_id: "",
        tax: 0,
        amount: 0,
        issue_date: format(new Date(), "yyyy-MM-dd"),
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        status: "draft",
        notes: "",
      });
      
      if (onInvoiceCreated) {
        onInvoiceCreated();
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">New Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for {clientName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Form Section */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Invoice will be created for <span className="font-semibold text-foreground">{clientName}</span>
                    {clientEmail && (
                      <span className="block mt-1">
                        <Mail className="h-3 w-3 inline mr-1" />
                        {clientEmail}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">
                    Invoice Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_number: e.target.value })
                    }
                    placeholder="INV-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtotal">
                    Subtotal <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="subtotal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.subtotal}
                      onChange={(e) =>
                        setFormData({ ...formData, subtotal: e.target.value })
                      }
                      placeholder="0.00"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Sales Tax</Label>
                  <Select
                    value={formData.tax_rate_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tax_rate_id: value })
                    }
                  >
                    <SelectTrigger id="tax_rate">
                      <SelectValue placeholder="No tax" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No tax</SelectItem>
                      {taxRates?.map((rate) => (
                        <SelectItem key={rate.id} value={rate.id}>
                          {rate.name} ({rate.rate}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tax Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.tax.toFixed(2)}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    ${formData.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issue_date">
                    Issue Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="issue_date"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) =>
                        setFormData({ ...formData, issue_date: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">
                    Due Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any additional notes or payment terms..."
                  rows={4}
                />
              </div>
            </div>

            {/* Invoice Settings Panel */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-4">Invoice Settings</h3>
                <Separator className="mb-4" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Payment Terms</span>
                      <span className="font-medium">Net 30</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Currency</span>
                      <span className="font-medium">USD</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">
                      Invoice will be automatically saved as {formData.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Creating..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
