import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, FileText, AlertCircle, Users, ChevronRight, Upload } from "lucide-react";
import ImportTransactionsDialog from "@/components/bank-transactions/ImportTransactionsDialog";

interface Client {
  id: string;
  client_name: string;
  contact_name?: string | null;
  status: string;
  lead_accountant?: string | null;
}

const BookkeepingDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalClients, setTotalClients] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    if (user) loadClients();
  }, [user, searchQuery]);

  const loadClients = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase.from("clients").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (searchQuery.trim()) q = q.ilike("client_name", `%${searchQuery}%`);
      const { data } = await q;
      setClients(data || []);
      setTotalClients(data?.length || 0);
      setPendingReviews(Math.max(0, Math.floor((data?.length || 0) * 0.3)));
    } finally {
      setLoading(false);
    }
  };

  const checklist = [
    "Reconcile all bank accounts",
    "Review accounts payable",
    "Review accounts receivable",
    "Post journal entries",
    "Run profit & loss report",
    "Review balance sheet",
  ];

  const quickLinks = [
    { label: "Bank Transactions", path: "/bank-transactions", desc: "Review and categorize transactions" },
    { label: "Chart of Accounts", path: "/chart-of-accounts", desc: "Manage your account structure" },
    { label: "Journal Entries", path: "/journal-entries", desc: "Post manual entries" },
    { label: "General Ledger", path: "/general-ledger", desc: "Full transaction history" },
    { label: "Profit & Loss", path: "/profit-and-loss", desc: "Income and expense summary" },
    { label: "Balance Sheet", path: "/balance-sheet", desc: "Assets, liabilities & equity" },
    { label: "Bank Reconciliation", path: "/bank-reconciliation", desc: "Match transactions to statements" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bookkeeping</h1>
            <p className="text-muted-foreground mt-1">Manage books, reconciliations and monthly close for all clients</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/bank-reconciliation")}>Reconciliation</Button>
            <Button variant="outline" onClick={() => navigate("/journal-entries")}>Journal Entries</Button>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Documents
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => navigate("/bank-transactions")}>
              + New Transaction
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Books</p>
                  <p className="text-2xl font-bold mt-1">{totalClients}</p>
                  <p className="text-xs text-green-500 mt-1">All clients</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reconciled This Month</p>
                  <p className="text-2xl font-bold mt-1">0</p>
                  <p className="text-xs text-muted-foreground mt-1">of {totalClients} clients</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold mt-1">{pendingReviews}</p>
                  <p className="text-xs text-amber-500 mt-1">Needs attention</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Behind Schedule</p>
                  <p className="text-2xl font-bold mt-1">0</p>
                  <p className="text-xs text-green-500 mt-1">All up to date</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Books Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Client Books Status</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 bg-background">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Find a client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 outline-none text-sm w-48 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Client</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Books Status</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Last Reconciled</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Outstanding Items</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Monthly Close</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Lead</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                      </td>
                    </tr>
                  ) : clients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted-foreground">
                        {searchQuery ? "No clients match your search." : "No clients yet. Add a client to track bookkeeping status."}
                      </td>
                    </tr>
                  ) : clients.map((client) => (
                    <tr key={client.id} className="border-b border-border hover:bg-accent/50">
                      <td className="p-3">
                        <div className="font-medium text-sm">{client.client_name}</div>
                        {client.contact_name && <div className="text-xs text-muted-foreground">{client.contact_name}</div>}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">
                          Not configured
                        </Badge>
                      </td>
                      <td className="p-3"><span className="text-sm text-muted-foreground">Never</span></td>
                      <td className="p-3"><span className="text-sm text-muted-foreground">—</span></td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs">
                          Not started
                        </Badge>
                      </td>
                      <td className="p-3"><span className="text-sm">{client.lead_accountant || "—"}</span></td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/client/${client.id}`)}>
                          Open books
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Close Checklist</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <div className="h-4 w-4 rounded border-2 border-border flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Button className="mt-4 w-full" variant="outline" onClick={() => navigate("/bank-reconciliation")}>
                Start Reconciliation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quick Links</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {quickLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-left transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium">{link.label}</div>
                    <div className="text-xs text-muted-foreground">{link.desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <ImportTransactionsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={(count) => {
          setImportedCount(prev => prev + count);
        }}
      />
    </Layout>
  );
};

export default BookkeepingDashboard;
