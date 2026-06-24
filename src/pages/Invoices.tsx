import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Trash2, DollarSign } from "lucide-react";
import RecordPaymentDialog from "@/components/RecordPaymentDialog";

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  amount: number;
  amount_paid: number | null;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
}

const Invoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const statusFilter = new URLSearchParams(location.search).get("status") ?? "all";

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter === "outstanding") return inv.status !== "paid";
    if (statusFilter === "paid") return inv.status === "paid";
    return true;
  });
  const [open, setOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now()}`,
    client_name: "",
    client_email: "",
    amount: "",
    status: "draft",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (data) setInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("invoices").insert({
        user_id: user?.id,
        invoice_number: formData.invoice_number,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        amount: parseFloat(formData.amount),
        status: formData.status,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Invoice created!",
        description: "Your invoice has been created successfully.",
      });

      setOpen(false);
      setFormData({
        invoice_number: `INV-${Date.now()}`,
        client_name: "",
        client_email: "",
        amount: "",
        status: "draft",
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: "",
      });
      fetchInvoices();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Invoice deleted",
        description: "Invoice removed successfully.",
      });

      fetchInvoices();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

const handleRecordPayment = (invoice: Invoice) => {
    toast({ title: `Recording payment for ${invoice.invoice_number}...` });
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Invoices</h1>
            <p className="text-muted-foreground">Create and manage client invoices</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Invoice</DialogTitle>
                <DialogDescription>Create a new invoice for your client</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    placeholder="Acme Corp"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">Client Email (Optional)</Label>
                  <Input
                    id="client_email"
                    type="email"
                    placeholder="client@example.com"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">Issue Date</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional invoice notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Invoice
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { label: "All", value: "all" },
            { label: "Outstanding", value: "outstanding" },
            { label: "Paid", value: "paid" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => navigate(tab.value === "all" ? "/invoices" : `/invoices?status=${tab.value}`)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {statusFilter === "outstanding" ? "Outstanding Invoices" : statusFilter === "paid" ? "Paid Invoices" : "All Invoices"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices yet. Create your first invoice to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const amountPaid = invoice.amount_paid || 0;
                      const remaining = invoice.amount - amountPaid;
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{invoice.client_name}</div>
                              {invoice.client_email && (
                                <div className="text-sm text-muted-foreground">{invoice.client_email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell className="text-success">{formatCurrency(amountPaid)}</TableCell>
                          <TableCell className={remaining > 0 ? "text-destructive" : "text-muted-foreground"}>
                            {formatCurrency(remaining)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {invoice.status !== 'paid' && remaining > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRecordPayment(invoice)}
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Record Payment
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(invoice.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <RecordPaymentDialog
          invoice={selectedInvoice}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onSuccess={fetchInvoices}
        />
      </div>
    </Layout>
  );
};

export default Invoices;
