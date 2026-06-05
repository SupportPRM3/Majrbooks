import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
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
  ArrowLeft
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/dashboard")}
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
                              disabled
                              title="Download coming soon"
                            >
                              <Download className="h-4 w-4" />
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
    </Layout>
  );
};

export default ClientInvoices;
