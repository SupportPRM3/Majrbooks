import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, ChevronDown, Upload, Settings, Info } from "lucide-react";
import { ChatWidget } from "@/components/ChatWidget";
import { AddClientDialog } from "@/components/AddClientDialog";
import { DashboardCharts } from "@/components/DashboardCharts";
import { UpcomingRecurringInvoices } from "@/components/UpcomingRecurringInvoices";
import { UpgradePlansSection } from "@/components/dashboard/UpgradePlansSection";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
  const { user, loading: authLoading, isTrial, trialDaysRemaining, subscribed, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clients, setClients] = useState<CombinedClient[]>([]);
  const [showUpgradeSection, setShowUpgradeSection] = useState(false);

  // Show upgrade section for trial users or when they click upgrade
  const shouldShowUpgrade = isTrial || showUpgradeSection;

  const loadClients = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load actual clients
      let clientQuery = supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

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
        .eq("user_id", user.id)
        .in("status", ["pending", "sent"])
        .order("sent_at", { ascending: false });

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
            toast.info(`Switched to ${value.charAt(0).toUpperCase() + value.slice(1)} view`);
          }} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookkeeping">Bookkeeping</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
              <TabsTrigger value="multi-entity">Multi-entity</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {/* Filters and Search */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <label className="text-xs text-muted-foreground mb-1">Client type</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
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
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 mt-5 bg-card border border-border rounded-lg px-3 py-2 min-w-[250px] focus-within:border-primary transition-colors">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Find a client"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-0 outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Settings className="mr-2 h-4 w-4" />
                  Customize
                </Button>
              </div>

              {/* Client Table */}
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client / contact</th>
                      {activeTab === "overview" && (
                        <>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email / phone</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Banking</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Payroll alerts</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Prep for taxes</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                            <div className="flex items-center gap-1">
                              Tax returns
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          </th>
                        </>
                      )}
                      {activeTab === "bookkeeping" && (
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Books review</th>
                      )}
                      {activeTab === "payroll" && (
                        <>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Next pay date</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Setup</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tax payments due</th>
                          <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tax filings due</th>
                        </>
                      )}
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Lead</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={activeTab === "overview" ? 8 : activeTab === "payroll" ? 7 : 4} className="p-12 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        </td>
                      </tr>
                    ) : clients.length === 0 ? (
                      <tr>
                        <td colSpan={activeTab === "overview" ? 8 : activeTab === "payroll" ? 7 : 4} className="p-12 text-center text-muted-foreground">
                          {searchQuery ? "No clients found matching your search." : "No clients added yet. Click \"Add client\" to get started."}
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => (
                        <tr key={client.id} className="border-b border-border hover:bg-accent/50">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{client.client_name}</div>
                                {client.contact_name && (
                                  <div className="text-sm text-muted-foreground">{client.contact_name}</div>
                                )}
                              </div>
                              {client.isInvitation && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                  Invited
                                </Badge>
                              )}
                            </div>
                          </td>
                          {activeTab === "overview" && (
                            <>
                              <td className="p-4">
                                <div className="text-sm">
                                  {client.email && <div>{client.email}</div>}
                                  {client.phone && <div className="text-muted-foreground">{client.phone}</div>}
                                  {!client.email && !client.phone && <span className="text-muted-foreground">-</span>}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">-</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">-</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">-</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">-</span>
                              </td>
                            </>
                          )}
                          {activeTab === "bookkeeping" && (
                            <td className="p-4">
                              <span className="text-sm text-muted-foreground">-</span>
                            </td>
                          )}
                          {activeTab === "payroll" && (
                            <>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">-</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">-</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">-</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-muted-foreground">-</span>
                              </td>
                            </>
                          )}
                          <td className="p-4">
                            <span className="text-sm">{client.lead_accountant || "-"}</span>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {client.isInvitation ? (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={async () => {
                                        try {
                                          const response = await supabase.functions.invoke("send-client-invitation", {
                                            body: {
                                              clientEmail: client.email,
                                              clientName: client.client_name,
                                              isResend: true,
                                            },
                                          });
                                          if (response.error) throw response.error;
                                          toast.success("Invitation resent successfully");
                                        } catch (error) {
                                          toast.error("Failed to resend invitation");
                                        }
                                      }}
                                    >
                                      Resend invitation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={async () => {
                                        if (confirm(`Cancel invitation for ${client.client_name}?`)) {
                                          try {
                                            const { error } = await supabase
                                              .from("client_invitations")
                                              .update({ status: "cancelled" })
                                              .eq("id", client.id);
                                            
                                            if (error) throw error;
                                            toast.success("Invitation cancelled");
                                            loadClients();
                                          } catch (error) {
                                            toast.error("Failed to cancel invitation");
                                          }
                                        }
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      Cancel invitation
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem onClick={() => {
                                      toast.info(`Opening ${client.client_name}...`);
                                      navigate(`/client/${client.id}`);
                                    }}>
                                      Edit client
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link to="/tax-returns">Create tax return</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={async () => {
                                        if (confirm(`Are you sure you want to delete ${client.client_name}?`)) {
                                          try {
                                            const { error } = await supabase
                                              .from("clients")
                                              .delete()
                                              .eq("id", client.id);
                                            
                                            if (error) throw error;
                                            toast.success("Client deleted successfully");
                                            loadClients();
                                          } catch (error) {
                                            toast.error("Failed to delete client");
                                          }
                                        }
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={async () => {
                                        try {
                                          const { error } = await supabase
                                            .from("clients")
                                            .update({ status: "inactive" })
                                            .eq("id", client.id);
                                          
                                          if (error) throw error;
                                          toast.success("Client marked as inactive");
                                          loadClients();
                                        } catch (error) {
                                          toast.error("Failed to update client status");
                                        }
                                      }}
                                    >
                                      Make inactive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link to="/tax-returns">Edit leads</Link>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <ChatWidget />
    </Layout>
  );
};

export default Dashboard;
