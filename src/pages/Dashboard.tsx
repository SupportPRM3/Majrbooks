import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, ChevronDown, Upload, Settings, Info, Users, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { ChatWidget } from "@/components/ChatWidget";
import { AddClientDialog } from "@/components/AddClientDialog";
import { DashboardCharts } from "@/components/DashboardCharts";
import { UpcomingRecurringInvoices } from "@/components/UpcomingRecurringInvoices";
import { UpgradePlansSection } from "@/components/dashboard/UpgradePlansSection";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

// Combined client type that includes both actual clients and pending invitations
interface CombinedClient {
  id: string;
  client_name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  lead_accountant?: string | null;
  created_at: string;
  isInvitation?: boolean;
  invitation_status?: string;
}

const Dashboard = () => {
  const { user, loading: authLoading, isTrial, trialDaysRemaining, subscribed, checkSubscription, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const VALID_TABS = ["overview", "bookkeeping", "payroll", "multi-entity"];
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get("tab");
    return VALID_TABS.includes(t ?? "") ? t! : "overview";
  });

  // Keep tab in sync when sidebar links change the URL
  useEffect(() => {
    const t = searchParams.get("tab");
    const resolved = VALID_TABS.includes(t ?? "") ? t! : "overview";
    setActiveTab(resolved);
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clients, setClients] = useState<CombinedClient[]>([]);
  const [showUpgradeSection, setShowUpgradeSection] = useState(false);
  const [stats, setStats] = useState({ totalClients: 0, activeReturns: 0, pendingReviews: 0, monthlyRevenue: 0, pendingDocs: 0, activeSubscriptions: 0 });
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [pipelineData, setPipelineData] = useState<{ stage: string; count: number }[]>([]);

  // Show upgrade section for trial users or when they click upgrade
  const shouldShowUpgrade = isTrial || showUpgradeSection;

  const loadStats = async () => {
    if (!user) return;
    try {
      const [clientsRes, returnsRes, pendingReviewsRes, invoicesRes, subsRes, documentsRes, invitedRes, inactiveRes, archivedRes] = await Promise.all([
        isStaff
          ? supabase.from("clients").select("id", { count: "exact" }).eq("status", "active")
          : supabase.from("clients").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "active"),
        isStaff
          ? supabase.from("tax_returns").select("id", { count: "exact" }).neq("status", "filed")
          : supabase.from("tax_returns").select("id", { count: "exact" }).eq("user_id", user.id).neq("status", "filed"),
        isStaff
          ? supabase.from("tax_returns").select("id", { count: "exact" }).eq("review_status", "pending_review")
          : supabase.from("tax_returns").select("id", { count: "exact" }).eq("user_id", user.id).eq("review_status", "pending_review"),
        isStaff
          ? supabase.from("invoices").select("amount, created_at").eq("status", "paid")
          : supabase.from("invoices").select("amount, created_at").eq("user_id", user.id).eq("status", "paid"),
        isStaff
          ? supabase.from("recurring_invoices").select("id", { count: "exact" }).eq("status", "active")
          : supabase.from("recurring_invoices").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "active"),
        isStaff
          ? supabase.from("documents").select("id", { count: "exact" }).eq("status", "pending")
          : supabase.from("documents").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "pending"),
        isStaff
          ? supabase.from("client_invitations").select("id", { count: "exact" }).in("status", ["pending", "sent"])
          : supabase.from("client_invitations").select("id", { count: "exact" }).eq("user_id", user.id).in("status", ["pending", "sent"]),
        isStaff
          ? supabase.from("clients").select("id", { count: "exact" }).eq("status", "inactive")
          : supabase.from("clients").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "inactive"),
        isStaff
          ? supabase.from("clients").select("id", { count: "exact" }).eq("status", "archived")
          : supabase.from("clients").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "archived"),
      ]);

      // Build trailing 12-month revenue buckets from real paid invoices
      const now = new Date();
      const months: { key: string; label: string }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en-US", { month: "short" }) });
      }
      const buckets: Record<string, number> = Object.fromEntries(months.map((m) => [m.key, 0]));
      const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
      let currentMonthRevenue = 0;
      (invoicesRes.data || []).forEach((inv) => {
        const d = new Date(inv.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key in buckets) buckets[key] += inv.amount || 0;
        if (key === currentMonthKey) currentMonthRevenue += inv.amount || 0;
      });
      setRevenueData(months.map((m) => ({ month: m.label, revenue: buckets[m.key] })));

      setPipelineData([
        { stage: "Invited", count: invitedRes.count || 0 },
        { stage: "Active", count: clientsRes.count || 0 },
        { stage: "Inactive", count: inactiveRes.count || 0 },
        { stage: "Archived", count: archivedRes.count || 0 },
      ]);

      setStats({
        totalClients: clientsRes.count || 0,
        activeReturns: returnsRes.count || 0,
        pendingReviews: pendingReviewsRes.count || 0,
        monthlyRevenue: currentMonthRevenue,
        pendingDocs: documentsRes.count || 0,
        activeSubscriptions: subsRes.count || 0,
      });
    } catch {}
  };

  const loadClients = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load actual clients — staff sees all, admin sees own
      let clientQuery = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isStaff) {
        clientQuery = clientQuery.eq("user_id", user.id);
      }

      if (searchQuery.trim()) {
        clientQuery = clientQuery.or(`client_name.ilike.%${searchQuery}%,contact_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== "all" && statusFilter !== "invited") {
        clientQuery = clientQuery.eq("status", statusFilter);
      }

      // Load pending invitations (not yet accepted)
      let invitationQuery = supabase
        .from("client_invitations")
        .select("*")
        .in("status", ["pending", "sent"])
        .order("sent_at", { ascending: false });

      if (!isStaff) {
        invitationQuery = invitationQuery.eq("user_id", user.id);
      }

      if (searchQuery.trim()) {
        invitationQuery = invitationQuery.or(`client_name.ilike.%${searchQuery}%,client_email.ilike.%${searchQuery}%`);
      }

      const [clientsResult, invitationsResult] = await Promise.all([
        clientQuery,
        invitationQuery,
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (invitationsResult.error) throw invitationsResult.error;

      // Transform clients to combined format
      const actualClients: CombinedClient[] = (clientsResult.data || []).map((c) => ({
        id: c.id,
        client_name: c.client_name,
        contact_name: c.contact_name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        lead_accountant: c.lead_accountant,
        created_at: c.created_at,
        isInvitation: false,
      }));

      // Transform invitations to combined format
      const invitedClients: CombinedClient[] = (invitationsResult.data || []).map((inv) => ({
        id: inv.id,
        client_name: inv.client_name,
        contact_name: null,
        email: inv.client_email,
        phone: null,
        status: "invited",
        lead_accountant: null,
        created_at: inv.sent_at || inv.created_at,
        isInvitation: true,
        invitation_status: inv.status,
      }));

      // Combine and filter based on status
      let combinedClients: CombinedClient[] = [];
      if (statusFilter === "all") {
        combinedClients = [...actualClients, ...invitedClients];
      } else if (statusFilter === "invited") {
        combinedClients = invitedClients;
      } else {
        combinedClients = actualClients;
      }

      // Sort by created_at descending
      combinedClients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setClients(combinedClients);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadClients();
      loadStats();
    }
  }, [user, searchQuery, statusFilter]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          {authLoading && <p className="text-muted-foreground">Redirecting to your dashboard…</p>}
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* Welcome Banner */}
        <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 60%, #0f1f3d 100%)" }}>
          <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "support"}
              </h1>
              <p className="text-blue-200 text-sm">Here's what's happening with your practice today</p>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalClients}</div>
                <div className="text-blue-200 text-xs uppercase tracking-wide mt-1">Total Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.activeReturns}</div>
                <div className="text-blue-200 text-xs uppercase tracking-wide mt-1">Active Returns</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.pendingReviews}</div>
                <div className="text-blue-200 text-xs uppercase tracking-wide mt-1">Pending Reviews</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalClients}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active clients</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  <p className="text-2xl font-bold mt-1">{stats.activeSubscriptions}</p>
                  <p className="text-xs text-muted-foreground mt-1">Recurring invoices</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold mt-1">${stats.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">This calendar month</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Documents</p>
                  <p className="text-2xl font-bold mt-1">{stats.pendingDocs}</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Revenue Overview</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Pipeline</CardTitle>
              <p className="text-xs text-muted-foreground">Stage breakdown</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pipelineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MAJR Books</h1>
            {isTrial && trialDaysRemaining !== null && (
              <p className="text-sm text-muted-foreground mt-1">
                🎉 Free trial: {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="link" className="text-primary">Feedback?</Button>
            
            {isTrial && (
              <Button 
                variant="default"
                onClick={() => setShowUpgradeSection(!showUpgradeSection)}
                className="bg-primary hover:bg-primary/90"
              >
                🚀 Upgrade Now
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => {
                toast.info("Opening bulk upload...");
                navigate("/bulk-client-upload");
              }}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            
            <AddClientDialog onClientAdded={loadClients} />
          </div>
        </div>

        {/* Upgrade Plans Section - Show for trial users or when toggled */}
        {shouldShowUpgrade && (
          <UpgradePlansSection 
            onUpgradeComplete={() => {
              checkSubscription();
              setShowUpgradeSection(false);
            }} 
          />
        )}

        {/* Client List Tabs */}
        <div className="space-y-4">
          <Tabs defaultValue="client-list" className="w-full">
            <TabsList>
              <TabsTrigger value="client-list">Client list</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Notice Banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-md p-3 flex items-center space-x-2">
            <span className="bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded">NEW</span>
            <span className="text-sm">
              To add/update client numbers in bulk,{" "}
              <button 
                className="text-primary underline hover:text-primary/80"
                onClick={() => navigate("/bulk-client-numbers")}
              >
                click here
              </button>.
            </span>
          </div>

          {/* Secondary Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            setSearchParams(value === "overview" ? {} : { tab: value });
          }} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookkeeping">Bookkeeping</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
              <TabsTrigger value="multi-entity">Multi-entity</TabsTrigger>
            </TabsList>

            {/* ── OVERVIEW TAB ── */}
            <TabsContent value="overview" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <label className="text-xs text-muted-foreground mb-1">Client type</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="invited">Invited (Pending)</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-muted-foreground mb-1">Lead accountant</label>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 mt-5 bg-card border border-border rounded-lg px-3 py-2 min-w-[250px] focus-within:border-primary transition-colors">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder="Find a client" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-0 outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground" />
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground"><Settings className="mr-2 h-4 w-4" />Customize</Button>
              </div>
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client / contact</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email / phone</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Banking</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Payroll alerts</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Prep for taxes</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground"><div className="flex items-center gap-1">Tax returns<Info className="h-3.5 w-3.5 text-muted-foreground" /></div></th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Lead</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="p-12 text-center"><div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></td></tr>
                    ) : clients.length === 0 ? (
                      <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">{searchQuery ? "No clients found matching your search." : "No clients added yet. Click \"Add client\" to get started."}</td></tr>
                    ) : clients.map((client) => (
                      <tr
                        key={client.id}
                        className="border-b border-border hover:bg-accent/50 cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('[data-no-row-click]')) return;
                          if (!client.isInvitation) navigate(`/client/${client.id}`);
                        }}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">{client.client_name}</div>
                              {client.contact_name && <div className="text-sm text-muted-foreground">{client.contact_name}</div>}
                            </div>
                            {client.isInvitation && <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Invited</Badge>}
                          </div>
                        </td>
                        <td className="p-4"><div className="text-sm">{client.email && <div>{client.email}</div>}{client.phone && <div className="text-muted-foreground">{client.phone}</div>}{!client.email && !client.phone && <span className="text-muted-foreground">-</span>}</div></td>
                        <td className="p-4"><span className="text-sm text-muted-foreground">-</span></td>
                        <td className="p-4"><span className="text-sm text-muted-foreground">-</span></td>
                        <td className="p-4"><span className="text-sm text-muted-foreground">-</span></td>
                        <td className="p-4"><span className="text-sm text-muted-foreground">-</span></td>
                        <td className="p-4"><span className="text-sm">{client.lead_accountant || "-"}</span></td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {client.isInvitation ? (
                                <>
                                  <DropdownMenuItem onClick={async () => { try { await supabase.functions.invoke("send-client-invitation", { body: { clientEmail: client.email, clientName: client.client_name, isResend: true } }); toast.success("Invitation resent successfully"); } catch { toast.error("Failed to resend invitation"); } }}>Resend invitation</DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => { if (confirm(`Cancel invitation for ${client.client_name}?`)) { try { await supabase.from("client_invitations").update({ status: "cancelled" }).eq("id", client.id); toast.success("Invitation cancelled"); loadClients(); } catch { toast.error("Failed to cancel invitation"); } } }} className="text-destructive focus:text-destructive">Cancel invitation</DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => { toast.info(`Opening ${client.client_name}...`); navigate(`/client/${client.id}`); }}>Edit client</DropdownMenuItem>
                                  <DropdownMenuItem asChild><Link to="/tax-returns">Create tax return</Link></DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => { if (confirm(`Are you sure you want to delete ${client.client_name}?`)) { try { await supabase.from("clients").delete().eq("id", client.id); toast.success("Client deleted successfully"); loadClients(); } catch { toast.error("Failed to delete client"); } } }} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => { try { await supabase.from("clients").update({ status: "inactive" }).eq("id", client.id); toast.success("Client marked as inactive"); loadClients(); } catch { toast.error("Failed to update client status"); } }}>Make inactive</DropdownMenuItem>
                                  <DropdownMenuItem asChild><Link to="/tax-returns">Edit leads</Link></DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ── BOOKKEEPING TAB ── */}
            <TabsContent value="bookkeeping" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active Books</p><p className="text-2xl font-bold mt-1">{stats.totalClients}</p><p className="text-xs text-green-500 mt-1">All clients</p></div><div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-green-600" /></div></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Reconciled This Month</p><p className="text-2xl font-bold mt-1">0</p><p className="text-xs text-muted-foreground mt-1">of {stats.totalClients} clients</p></div><div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><FileText className="h-5 w-5 text-blue-600" /></div></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending Review</p><p className="text-2xl font-bold mt-1">{stats.pendingReviews}</p><p className="text-xs text-amber-500 mt-1">Needs attention</p></div><div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-amber-600" /></div></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Behind Schedule</p><p className="text-2xl font-bold mt-1">0</p><p className="text-xs text-green-500 mt-1">All up to date</p></div><div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><Users className="h-5 w-5 text-orange-600" /></div></div></CardContent></Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Client Books Status</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate("/bank-reconciliation")}>Reconciliation</Button>
                      <Button variant="outline" size="sm" onClick={() => navigate("/journal-entries")}>Journal Entries</Button>
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
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.length === 0 ? (
                          <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No clients yet. Add a client to track bookkeeping status.</td></tr>
                        ) : clients.map((client) => (
                          <tr key={client.id} className="border-b border-border hover:bg-accent/50">
                            <td className="p-3">
                              <div className="font-medium text-sm">{client.client_name}</div>
                              {client.contact_name && <div className="text-xs text-muted-foreground">{client.contact_name}</div>}
                            </td>
                            <td className="p-3"><Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">Not configured</Badge></td>
                            <td className="p-3"><span className="text-sm text-muted-foreground">Never</span></td>
                            <td className="p-3"><span className="text-sm text-muted-foreground">—</span></td>
                            <td className="p-3"><Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs">Not started</Badge></td>
                            <td className="p-3">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/client/${client.id}`)}>Open books</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Monthly Close Checklist</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: "Reconcile all bank accounts", done: false },
                        { label: "Review accounts payable", done: false },
                        { label: "Review accounts receivable", done: false },
                        { label: "Post journal entries", done: false },
                        { label: "Run profit & loss report", done: false },
                        { label: "Review balance sheet", done: false },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3 text-sm">
                          <div className={`h-4 w-4 rounded border-2 flex-shrink-0 ${item.done ? "bg-green-500 border-green-500" : "border-border"}`} />
                          <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="mt-4 w-full" variant="outline" onClick={() => navigate("/bank-reconciliation")}>Start Reconciliation</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Quick Links</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Bank Transactions", path: "/bank-transactions", desc: "Review and categorize transactions" },
                      { label: "Chart of Accounts", path: "/chart-of-accounts", desc: "Manage your account structure" },
                      { label: "Journal Entries", path: "/journal-entries", desc: "Post manual entries" },
                      { label: "General Ledger", path: "/general-ledger", desc: "Full transaction history" },
                      { label: "Profit & Loss", path: "/profit-and-loss", desc: "Income and expense summary" },
                    ].map((link) => (
                      <button key={link.path} onClick={() => navigate(link.path)} className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-left transition-colors">
                        <div>
                          <div className="text-sm font-medium">{link.label}</div>
                          <div className="text-xs text-muted-foreground">{link.desc}</div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── PAYROLL TAB ── */}
            <TabsContent value="payroll" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Employees</p><p className="text-2xl font-bold mt-1">0</p><p className="text-xs text-muted-foreground mt-1">Across all clients</p></div><div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Next Pay Date</p><p className="text-2xl font-bold mt-1">Jun 30</p><p className="text-xs text-muted-foreground mt-1">End of month</p></div><div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-green-600" /></div></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending Setup</p><p className="text-2xl font-bold mt-1">{stats.totalClients}</p><p className="text-xs text-amber-500 mt-1">Needs configuration</p></div><div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-amber-600" /></div></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">YTD Payroll</p><p className="text-2xl font-bold mt-1">$0</p><p className="text-xs text-muted-foreground mt-1">Total processed</p></div><div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><FileText className="h-5 w-5 text-purple-600" /></div></div></CardContent></Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Client Payroll Schedule</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate("/payroll-setup")}>Payroll Setup</Button>
                      <Button variant="outline" size="sm" onClick={() => navigate("/payroll-runs")}>Run Payroll</Button>
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
                        {clients.length === 0 ? (
                          <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No clients yet. Add a client to manage payroll.</td></tr>
                        ) : clients.map((client) => (
                          <tr key={client.id} className="border-b border-border hover:bg-accent/50">
                            <td className="p-3">
                              <div className="font-medium text-sm">{client.client_name}</div>
                              {client.contact_name && <div className="text-xs text-muted-foreground">{client.contact_name}</div>}
                            </td>
                            <td className="p-3"><span className="text-sm text-muted-foreground">0</span></td>
                            <td className="p-3"><span className="text-sm text-muted-foreground">Not set</span></td>
                            <td className="p-3"><span className="text-sm text-muted-foreground">—</span></td>
                            <td className="p-3"><Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">Setup required</Badge></td>
                            <td className="p-3"><Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs">No filings</Badge></td>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Upcoming Payroll Runs</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No payroll runs scheduled</p>
                      <Button className="mt-4" variant="outline" onClick={() => navigate("/payroll-setup")}>Set Up Payroll</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Payroll Quick Links</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Payroll Setup", path: "/payroll-setup", desc: "Configure pay schedules and employees" },
                      { label: "Run Payroll", path: "/payroll-runs", desc: "Process pending payroll runs" },
                      { label: "Timesheets", path: "/timesheets", desc: "Review employee time entries" },
                      { label: "1099 History", path: "/1099-history", desc: "Contractor payment records" },
                      { label: "PTO Management", path: "/pto-management", desc: "Track paid time off balances" },
                    ].map((link) => (
                      <button key={link.path} onClick={() => navigate(link.path)} className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-left transition-colors">
                        <div>
                          <div className="text-sm font-medium">{link.label}</div>
                          <div className="text-xs text-muted-foreground">{link.desc}</div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── MULTI-ENTITY TAB ── */}
            <TabsContent value="multi-entity" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Entities</p><p className="text-2xl font-bold mt-1">{stats.totalClients}</p></div><div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Entity Groups</p><p className="text-2xl font-bold mt-1">0</p></div><div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-green-600" /></div></div></CardContent></Card>
                <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Consolidated Reports</p><p className="text-2xl font-bold mt-1">0</p></div><div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><FileText className="h-5 w-5 text-purple-600" /></div></div></CardContent></Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Entity Groups</CardTitle>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">+ Create Group</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Group related entities for consolidated reporting and management.</p>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-sm font-medium mb-1">No entity groups yet</p>
                    <p className="text-xs text-muted-foreground mb-4">Create a group to link related clients — parent companies, subsidiaries, or related businesses — and run consolidated reports across them.</p>
                    <Button variant="outline" onClick={() => navigate("/financial-planning")}>Go to Financial Planning</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">All Entities</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Entity Name</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Group</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.length === 0 ? (
                          <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No clients added yet.</td></tr>
                        ) : clients.map((client) => (
                          <tr key={client.id} className="border-b border-border hover:bg-accent/50">
                            <td className="p-3"><div className="font-medium text-sm">{client.client_name}</div></td>
                            <td className="p-3"><span className="text-sm text-muted-foreground">Business</span></td>
                            <td className="p-3"><Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs">Ungrouped</Badge></td>
                            <td className="p-3"><Badge variant="secondary" className={`text-xs ${client.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-700"}`}>{client.status}</Badge></td>
                            <td className="p-3"><Button variant="ghost" size="sm" onClick={() => navigate(`/client/${client.id}`)}>View</Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
      <ChatWidget />
    </Layout>
  );
};

export default Dashboard;
