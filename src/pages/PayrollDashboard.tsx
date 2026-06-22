import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, FileText, AlertCircle, Users, ChevronRight } from "lucide-react";

interface Client {
  id: string;
  client_name: string;
  contact_name?: string | null;
  status: string;
  lead_accountant?: string | null;
}

const PayrollDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalClients, setTotalClients] = useState(0);

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
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { label: "Payroll Setup", path: "/payroll-setup", desc: "Configure pay schedules and employees" },
    { label: "Run Payroll", path: "/payroll-runs", desc: "Process pending payroll runs" },
    { label: "Timesheets", path: "/timesheets", desc: "Review employee time entries" },
    { label: "1099 History", path: "/1099-history", desc: "Contractor payment records" },
    { label: "PTO Management", path: "/pto-management", desc: "Track paid time off balances" },
    { label: "Time Dashboard", path: "/time-tracking-dashboard", desc: "Time tracking overview" },
    { label: "Billable Forecast", path: "/billable-forecast", desc: "Revenue forecast from hours" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
            <p className="text-muted-foreground mt-1">Manage payroll schedules, employees and tax filings for all clients</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/payroll-runs")}>Run Payroll</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => navigate("/payroll-setup")}>
              + Setup Payroll
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold mt-1">0</p>
                  <p className="text-xs text-muted-foreground mt-1">Across all clients</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Next Pay Date</p>
                  <p className="text-2xl font-bold mt-1">Jun 30</p>
                  <p className="text-xs text-muted-foreground mt-1">End of month</p>
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
                  <p className="text-sm text-muted-foreground">Pending Setup</p>
                  <p className="text-2xl font-bold mt-1">{totalClients}</p>
                  <p className="text-xs text-amber-500 mt-1">Needs configuration</p>
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
                  <p className="text-sm text-muted-foreground">YTD Payroll</p>
                  <p className="text-2xl font-bold mt-1">$0</p>
                  <p className="text-xs text-muted-foreground mt-1">Total processed</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Payroll Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Client Payroll Schedule</CardTitle>
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
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Employees</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Pay Frequency</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Next Pay Date</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Setup Status</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Tax Filings</th>
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
                        {searchQuery ? "No clients match your search." : "No clients yet. Add a client to manage payroll."}
                      </td>
                    </tr>
                  ) : clients.map((client) => (
                    <tr key={client.id} className="border-b border-border hover:bg-accent/50">
                      <td className="p-3">
                        <div className="font-medium text-sm">{client.client_name}</div>
                        {client.contact_name && <div className="text-xs text-muted-foreground">{client.contact_name}</div>}
                      </td>
                      <td className="p-3"><span className="text-sm text-muted-foreground">0</span></td>
                      <td className="p-3"><span className="text-sm text-muted-foreground">Not set</span></td>
                      <td className="p-3"><span className="text-sm text-muted-foreground">—</span></td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">
                          Setup required
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs">
                          No filings
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/payroll-setup")}>Configure</Button>
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
            <CardHeader><CardTitle className="text-base">Upcoming Payroll Runs</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No payroll runs scheduled</p>
                <Button className="mt-4" variant="outline" onClick={() => navigate("/payroll-setup")}>
                  Set Up Payroll
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Payroll Quick Links</CardTitle></CardHeader>
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
    </Layout>
  );
};

export default PayrollDashboard;
