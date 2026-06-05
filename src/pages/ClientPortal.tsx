import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  DollarSign, 
  Upload, 
  Phone, 
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Folder,
  HelpCircle,
  Building2,
  Receipt,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import ClientWelcomeModal from "@/components/ClientWelcomeModal";

interface ClientSummary {
  totalInvoices: number;
  paidInvoices: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
}

interface RecentInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
}

const ClientPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [summary, setSummary] = useState<ClientSummary>({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingAmount: 0,
    lastPaymentDate: null,
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);

  // Check if this is the user's first visit
  useEffect(() => {
    if (user) {
      const welcomeSeenKey = `majrbooks_welcome_seen_${user.id}`;
      const hasSeenWelcome = localStorage.getItem(welcomeSeenKey);
      
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
        localStorage.setItem(welcomeSeenKey, "true");
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadClientData();
    }
  }, [user]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch invoices for this client (where client_email matches user email)
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount, amount_paid, status, due_date, issue_date")
        .eq("client_email", user?.email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (invoices) {
        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === "paid").length;
        const pendingAmount = invoices
          .filter(inv => inv.status !== "paid")
          .reduce((sum, inv) => sum + (inv.amount - (inv.amount_paid || 0)), 0);
        
        // Find last payment date
        const paidInvoicesList = invoices.filter(inv => inv.status === "paid");
        const lastPaymentDate = paidInvoicesList.length > 0 
          ? paidInvoicesList[0].issue_date 
          : null;

        setSummary({
          totalInvoices,
          paidInvoices,
          pendingAmount,
          lastPaymentDate,
        });

        setRecentInvoices(invoices.slice(0, 5).map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          amount: inv.amount,
          status: inv.status,
          due_date: inv.due_date,
        })));
      }
    } catch (error) {
      console.error("Error loading client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
      case "sent":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
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
      <ClientWelcomeModal open={showWelcomeModal} onOpenChange={setShowWelcomeModal} />
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome to Your Portal</h1>
          <p className="text-muted-foreground mt-1">
            View your invoices, documents, and account information
          </p>
        </div>

        {/* Get Started Section */}
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Get paid or track your work — it starts here!
            </CardTitle>
            <CardDescription className="text-base">
              You're all set to manage your business in one place. Choose what you'd like to do below:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create Invoice Option */}
              <Card 
                className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200"
                onClick={() => navigate("/invoice")}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        📄 Create an Invoice
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Send a professional invoice to your client and get paid faster.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Record Transaction Option */}
              <Card 
                className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200"
                onClick={() => navigate("/bank-transactions")}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/10 p-3 rounded-full group-hover:bg-amber-500/20 transition-colors">
                      <Receipt className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        🧾 Record a Transaction
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Track income or expenses to keep your books accurate and organized.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              👉 Select an option to get started. You can do this anytime — we'll guide you step by step!
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                  <p className="text-2xl font-bold">{summary.totalInvoices}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Invoices</p>
                  <p className="text-2xl font-bold text-green-600">{summary.paidInvoices}</p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.pendingAmount)}</p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Invoices
              </CardTitle>
              <CardDescription>
                Your latest billing statements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentInvoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No invoices found for your account.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(invoice.status)}
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(invoice.due_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.amount)}</p>
                        <Badge 
                          variant={invoice.status === "paid" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate("/client-invoices")}
              >
                View All Invoices
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions & Support */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  onClick={() => navigate("/invoices")}
                >
                  <FileText className="h-4 w-4" />
                  View & Pay Invoices
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  onClick={() => navigate("/bank-transactions")}
                >
                  <Building2 className="h-4 w-4" />
                  Connect Bank Account
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  disabled
                >
                  <Upload className="h-4 w-4" />
                  Upload Documents
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  disabled
                >
                  <Folder className="h-4 w-4" />
                  View My Documents
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </Button>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>
                  Contact your bookkeeper for assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  onClick={() => setShowWelcomeModal(true)}
                >
                  <HelpCircle className="h-4 w-4" />
                  Getting Started Guide
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  asChild
                >
                  <a href="mailto:support@majrtaxsoftware.com">
                    <Mail className="h-4 w-4" />
                    Email Support
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3"
                  asChild
                >
                  <a href="tel:888-575-4776">
                    <Phone className="h-4 w-4" />
                    Call Support: 888-575-4776
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Disclaimer */}
        <Card className="bg-muted/30 border-muted">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground text-center">
              This portal provides access to your account information and invoices. 
              For questions about specific charges, tax implications, or financial advice, 
              please contact your bookkeeper or tax professional directly.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientPortal;
