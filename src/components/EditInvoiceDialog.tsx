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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, FileText, Pencil, Trash2, Download, FileSpreadsheet } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportInvoiceToPDF, exportSingleInvoiceToExcel } from "@/lib/invoiceExport";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  subtotal?: number | null;
  tax?: number | null;
  tax_rate?: number | null;
  tax_rate_id?: string | null;
  tax_name?: string | null;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
  client_name: string;
}

interface EditInvoiceDialogProps {
  invoice: Invoice;
  client?: {
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    business_name: string | null;
    address: string | null;
  };
  onInvoiceUpdated?: () => void;
  onInvoiceDeleted?: () => void;
}

export const EditInvoiceDialog = ({
  invoice,
  client,
  onInvoiceUpdated,
  onInvoiceDeleted,
}: EditInvoiceDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    invoice_number: invoice.invoice_number,
    subtotal: (invoice.subtotal || invoice.amount).toString(),
    tax_rate_id: invoice.tax_rate_id || "",
    tax: invoice.tax || 0,
    amount: invoice.amount,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    status: invoice.status,
    notes: invoice.notes || "",
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

  // Reset form when dialog opens with fresh invoice data
  useEffect(() => {
    if (open) {
      setFormData({
        invoice_number: invoice.invoice_number,
        subtotal: (invoice.subtotal || invoice.amount).toString(),
        tax_rate_id: invoice.tax_rate_id || "",
        tax: invoice.tax || 0,
        amount: invoice.amount,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        status: invoice.status,
        notes: invoice.notes || "",
      });
    }
  }, [open, invoice]);

  const validateForm = () => {
    if (!formData.invoice_number.trim()) {
      toast({
        title: "Validation Error",
        description: "Invoice number is required",
        variant: "destructive",
      });
      return false;
    }

    const subtotal = parseFloat(formData.subtotal);
    if (!subtotal || subtotal <= 0) {
      toast({
        title: "Invalid Subtotal",
        description: "Please enter a valid subtotal greater than 0",
        variant: "destructive",
      });
      return false;
    }

    if (new Date(formData.due_date) < new Date(formData.issue_date)) {
      toast({
        title: "Validation Error",
        description: "Due date cannot be before issue date",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) return;

    setLoading(true);

    try {
      const selectedTaxRate = taxRates?.find(rate => rate.id === formData.tax_rate_id);
      const subtotal = parseFloat(formData.subtotal);
      
      const { error } = await supabase
        .from("invoices")
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Invoice Updated",
        description: `Invoice ${formData.invoice_number} has been updated successfully.`,
      });

      setOpen(false);
      
      if (onInvoiceUpdated) {
        onInvoiceUpdated();
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoice.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Invoice Deleted",
        description: `Invoice ${invoice.invoice_number} has been deleted.`,
      });

      setDeleteDialogOpen(false);
      setOpen(false);
      
      if (onInvoiceDeleted) {
        onInvoiceDeleted();
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportPDF = () => {
    exportInvoiceToPDF(invoice, client ? { ...client, client_name: invoice.client_name } : undefined);
    toast({
      title: "PDF Exported",
      description: `Invoice ${invoice.invoice_number} has been exported as PDF.`,
    });
  };

  const handleExportExcel = () => {
    exportSingleInvoiceToExcel(invoice);
    toast({
      title: "Excel Exported",
      description: `Invoice ${invoice.invoice_number} has been exported as Excel.`,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">Edit Invoice</DialogTitle>
                <DialogDescription>
                  Update invoice details for {invoice.client_name}
                </DialogDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Form Section */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-muted/30 border border-border rounded-lg p-4">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Editing invoice for <span className="font-semibold text-foreground">{invoice.client_name}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_invoice_number">
                      Invoice Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit_invoice_number"
                      value={formData.invoice_number}
                      onChange={(e) =>
                        setFormData({ ...formData, invoice_number: e.target.value })
                      }
                      placeholder="INV-001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_subtotal">
                      Subtotal <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="edit_subtotal"
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
                    <Label htmlFor="edit_tax_rate">Sales Tax</Label>
                    <Select
                      value={formData.tax_rate_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tax_rate_id: value })
                      }
                    >
                      <SelectTrigger id="edit_tax_rate">
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
                    <Label htmlFor="edit_issue_date">
                      Issue Date <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="edit_issue_date"
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
                    <Label htmlFor="edit_due_date">
                      Due Date <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="edit_due_date"
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
                  <Label htmlFor="edit_notes">Notes</Label>
                  <Textarea
                    id="edit_notes"
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
                      <Label htmlFor="edit_status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger id="edit_status">
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
                  </div>
                </div>

                <Separator />

                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Invoice
                </Button>
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
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice <strong>{invoice.invoice_number}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
