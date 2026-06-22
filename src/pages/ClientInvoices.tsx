import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import ClientLayout from "@/components/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Search,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface ClientInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  amount_paid: number | null;
  status: string;
  issue_date: string;
  due_date: string;
}

const ClientInvoices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch invoices for this client using BOTH client_user_id AND client_email
      // This ensures we show all invoices - both new ones linked by ID and legacy ones linked by email
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount, amount_paid, status, issue_date, due_date")
        .or(`client_user_id.eq.${user?.id},client_email.eq.${user?.email}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Deduplicate in case there are any overlaps
        const uniqueInvoices = data.filter((invoice, index, self) =>
          index === self.findIndex((i) => i.id === invoice.id)
        );
        setInvoices(uniqueInvoices);
      }
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const downloadInvoicePDF = (invoice: ClientInvoice) => {
    setDownloadingId(invoice.id);
    try {
      const doc = new jsPDF();
      const amountPaid = invoice.amount_paid || 0;
      const balance = invoice.amount - amountPaid;
      const statusLabel = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);

      // Header bar
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("MajrBooks", 14, 14);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("by PRM3 Tax · support@prm3tax.com · 888-575-4776", 14, 23);

      // Invoice title & number
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 14, 50);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(invoice.invoice_number, 14, 59);

      // Status badge
      const statusColors: Record<string, [number, number, number]> = {
        paid:    [22, 163, 74],
        pending: [217, 119, 6],
        sent:    [37, 99, 235],
        overdue: [220, 38, 38],
      };
      const [r, g, b] = statusColors[invoice.status] || [100, 100, 100];
      doc.setFillColor(r, g, b);
      doc.roundedRect(155, 44, 40, 10, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(statusLabel, 175, 50.5, { align: "center" });

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.4);
      doc.line(14, 66, 196, 66);

      // Dates section
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("ISSUE DATE", 14, 76);
      doc.text("DUE DATE", 80, 76);
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(format(new Date(invoice.issue_date), "MMMM d, yyyy"), 14, 84);
      doc.text(format(new Date(invoice.due_date), "MMMM d, yyyy"), 80, 84);

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 90, 196, 90);

      // Table header
      doc.setFillColor(245, 245, 250);
      doc.rect(14, 94, 182, 9, "F");
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("DESCRIPTION", 18, 100);
      doc.text("AMOUNT", 178, 100, { align: "right" });

      // Table row
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(10);
      doc.text(`Professional Services — ${invoice.invoice_number}`, 18, 112);
      doc.text(formatCurrency(invoice.amount), 178, 112, { align: "right" });

      // Summary box
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 122, 196, 122);
      const summaryX = 120;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Subtotal", summaryX, 132);
      doc.text("Amount Paid", summaryX, 142);
      doc.setTextColor(30, 30, 30);
      doc.text(formatCurrency(invoice.amount), 196, 132, { align: "right" });
      doc.setTextColor(22, 163, 74);
      doc.text(`− ${formatCurrency(amountPaid)}`, 196, 142, { align: "right" });

      // Balance due
      doc.setFillColor(balance > 0 ? 255 : 240, balance > 0 ? 247 : 253, balance > 0 ? 237 : 246);
      doc.rect(summaryX - 6, 148, 202 - summaryX, 12, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Balance Due", summaryX, 156);
      doc.setTextColor(balance > 0 ? 217 : 22, balance > 0 ? 119 : 163, balance > 0 ? 6 : 74);
      doc.text(formatCurrency(balance), 196, 156, { align: "right" });

      // Footer
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 275, 196, 275);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for your business! Questions? Contact support@prm3tax.com or call 888-575-4776.", 105, 281, { align: "center" });

      doc.save(`${invoice.invoice_number}.pdf`);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
      case "sent":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="capitalize">
            {status}
          </Badge>
        );
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalOutstanding = invoices
    .filter(inv => inv.status !== "paid")
    .reduce((sum, inv) => sum + (inv.amount - (inv.amount_paid || 0)), 0);

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/client-portal")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">My Invoices</h1>
              <p className="text-muted-foreground mt-1">
                View and manage your billing statements
              </p>
            </div>
          </div>
          {totalOutstanding > 0 && (
            <Card className="bg-amber-500/5 border-amber-200">
              <CardContent className="py-3 px-4">
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice History
            </CardTitle>
            <CardDescription>
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {searchQuery || statusFilter !== "all" 
                    ? "No invoices match your filters." 
                    : "No invoices found for your account."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const amountPaid = invoice.amount_paid || 0;
                      const balance = invoice.amount - amountPaid;
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.issue_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.due_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(invoice.amount)}
                          </TableCell>
                          <TableCell className="text-green-600">
                            {formatCurrency(amountPaid)}
                          </TableCell>
                          <TableCell className={balance > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                            {formatCurrency(balance)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadInvoicePDF(invoice)}
                              disabled={downloadingId === invoice.id}
                              title="Download PDF"
                            >
                              {downloadingId === invoice.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Download className="h-4 w-4" />}
                            </Button>
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

        {/* Help Section */}
        <Card className="bg-muted/30">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Have questions about an invoice? Contact your bookkeeper for assistance.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="link" asChild>
                  <a href="mailto:support@majrtaxsoftware.com">Email Support</a>
                </Button>
                <span className="text-muted-foreground">|</span>
                <Button variant="link" asChild>
                  <a href="tel:888-575-4776">Call: 888-575-4776</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default ClientInvoices;
