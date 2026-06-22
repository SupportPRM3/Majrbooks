import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ClientLayout from "@/components/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  FolderOpen,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  TrendingDown,
} from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  status: string;
  due_date: string;
  issue_date: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  paid:    { label: "Paid",    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",  icon: <Clock className="h-4 w-4 text-amber-500" /> },
  sent:    { label: "Sent",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",     icon: <Clock className="h-4 w-4 text-blue-500" /> },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",        icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
  draft:   { label: "Draft",   color: "bg-gray-100 text-gray-600",                                            icon: <Clock className="h-4 w-4 text-gray-400" /> },
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const ClientPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount, amount_paid, status, due_date, issue_date")
        .or(`client_email.eq.${user?.email},client_user_id.eq.${user?.id}`)
        .order("created_at", { ascending: false })
        .limit(50);
      setInvoices(data || []);
    } finally {
      setLoading(false);
    }
  };

  const totalInvoices = invoices.length;
  const paidCount = invoices.filter(i => i.status === "paid").length;
  const outstanding = invoices
    .filter(i => i.status !== "paid" && i.status !== "draft")
    .reduce((sum, i) => sum + (i.amount - (i.amount_paid || 0)), 0);
  const overdueCount = invoices.filter(i => i.status === "overdue").length;
  const recent = invoices.slice(0, 5);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  return (
    <ClientLayout>
      <div className="space-y-6">

        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {displayName} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
              Here's an overview of your account
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Invoices</p>
                  <p className="text-2xl font-bold mt-0.5">{totalInvoices}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Paid</p>
                  <p className="text-2xl font-bold mt-0.5 text-green-600">{paidCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Outstanding</p>
                  <p className="text-2xl font-bold mt-0.5 text-amber-600">{fmt(outstanding)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Overdue</p>
                  <p className={`text-2xl font-bold mt-0.5 ${overdueCount > 0 ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
                    {overdueCount}
                  </p>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${overdueCount > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                  <TrendingDown className={`h-5 w-5 ${overdueCount > 0 ? "text-red-600" : "text-gray-400"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Invoices */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/client-invoices")} className="text-primary text-xs">
                    View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No invoices yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {recent.map((inv) => {
                      const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
                      const balance = inv.amount - (inv.amount_paid || 0);
                      return (
                        <div
                          key={inv.id}
                          className="flex items-center gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                          onClick={() => navigate("/client-invoices")}
                        >
                          <div className="flex-shrink-0">{cfg.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{inv.invoice_number}</p>
                            <p className="text-xs text-gray-500">Due {format(new Date(inv.due_date), "MMM d, yyyy")}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold">{fmt(inv.amount)}</p>
                            <Badge className={`text-xs border-0 mt-0.5 ${cfg.color}`}>{cfg.label}</Badge>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: FileText, label: "View My Invoices", path: "/client-invoices", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
                  { icon: FolderOpen, label: "My Documents", path: "/client-documents", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
                  { icon: HelpCircle, label: "Get Support", path: "/client-support", color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
                ].map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-300 ml-auto" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Need Help */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <p className="font-semibold text-sm">Need Help?</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your bookkeeper is here for you. Contact us directly anytime.
                </p>
                <div className="space-y-2">
                  <a
                    href="mailto:support@prm3tax.com"
                    className="flex items-center gap-2 text-xs text-primary hover:underline font-medium"
                  >
                    support@prm3tax.com
                  </a>
                  <a
                    href="tel:888-575-4776"
                    className="flex items-center gap-2 text-xs text-primary hover:underline font-medium"
                  >
                    888-575-4776
                  </a>
                </div>
                <Button size="sm" className="w-full" onClick={() => navigate("/client-support")}>
                  Open Support Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientPortal;
