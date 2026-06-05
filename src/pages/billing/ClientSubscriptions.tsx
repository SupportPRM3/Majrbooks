import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Search, MoreVertical, Pause, Play, X, Edit, Eye, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Subscription {
  id: string;
  client_id: string | null;
  plan_name: string;
  billing_cycle: string;
  price: number;
  status: string;
  next_billing_date: string;
  start_date: string;
  client_name?: string;
  client_email?: string;
}

const ClientSubscriptions = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [clients, setClients] = useState<{ id: string; client_name: string; email: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    client_id: "",
    plan_name: "",
    billing_cycle: "monthly",
    price: "",
    next_billing_date: "",
  });

  const predefinedPlans = [
    { name: "Starter", price: 19, description: "Perfect for freelancers", features: ["Track income & expenses", "Send unlimited custom invoices & quotes", "Connect your bank", "Track GST and VAT", "Insights & reports", "Progress invoicing", "Up to 250 items in Chart of Accounts", "For one user, plus your accountant"] },
    { name: "Professional", price: 27, description: "For growing businesses", popular: true, features: ["Everything in Starter, plus:", "Manage bills & payments", "Track employee time", "Multi-currency", "For three users, plus your accountant", "Recurring transactions and bills", "Track inventory", "Manage budgets", "Up to 40 classes and locations", "For five users, plus your accountant"] },
    { name: "Enterprise", price: 97, description: "For established companies", features: ["Everything in Professional, plus:", "UNLIMITED items in Chart of Accounts", "UNLIMITED classes and locations", "Data sync with Excel", "Customise role permissions", "Manage users (up to 25)", "Automate workflows", "Custom reporting fields", "Customise dashboards", "Backup online & restore data", "Manage revenue recognition"] },
  ];

  const fetchSubscriptions = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("client_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load subscriptions");
      console.error(error);
    } else {
      // Fetch client names
      const clientIds = data?.map(s => s.client_id).filter(Boolean) || [];
      if (clientIds.length > 0) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("id, client_name, email")
          .in("id", clientIds);
        
        const clientMap = new Map(clientData?.map(c => [c.id, c]) || []);
        const enrichedData = data?.map(s => ({
          ...s,
          client_name: s.client_id ? clientMap.get(s.client_id)?.client_name : "Unknown",
          client_email: s.client_id ? clientMap.get(s.client_id)?.email : "",
        }));
        setSubscriptions(enrichedData || []);
      } else {
        setSubscriptions(data || []);
      }
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("clients")
      .select("id, client_name, email")
      .eq("status", "active");
    setClients(data || []);
  };

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
      fetchClients();
    }
  }, [user]);

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = (sub.client_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.client_email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = async (action: string, subscription: Subscription) => {
    let newStatus = subscription.status;
    switch (action) {
      case "pause": newStatus = "paused"; break;
      case "resume": newStatus = "active"; break;
      case "cancel": newStatus = "cancelled"; break;
    }

    const { error } = await supabase
      .from("client_subscriptions")
      .update({ status: newStatus })
      .eq("id", subscription.id);

    if (error) {
      toast.error("Failed to update subscription");
    } else {
      toast.success(`Subscription ${action}ed successfully`);
      fetchSubscriptions();
    }
  };

  const handleAddSubscription = async () => {
    if (!user || !newSubscription.client_id || !newSubscription.plan_name || !newSubscription.price || !newSubscription.next_billing_date) {
      toast.error("Please fill all required fields");
      return;
    }

    const { error } = await supabase
      .from("client_subscriptions")
      .insert({
        user_id: user.id,
        client_id: newSubscription.client_id,
        plan_name: newSubscription.plan_name,
        billing_cycle: newSubscription.billing_cycle,
        price: parseFloat(newSubscription.price),
        next_billing_date: newSubscription.next_billing_date,
        status: "active",
      });

    if (error) {
      toast.error("Failed to create subscription");
      console.error(error);
    } else {
      toast.success("Subscription created successfully");
      setAddDialogOpen(false);
      setNewSubscription({ client_id: "", plan_name: "", billing_cycle: "monthly", price: "", next_billing_date: "" });
      fetchSubscriptions();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      case "past_due": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === "active").length,
    mrr: subscriptions.filter(s => s.status === "active").reduce((sum, s) => sum + (s.billing_cycle === "monthly" ? s.price : s.price / 12), 0),
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              Client Subscriptions
            </h1>
            <p className="text-muted-foreground mt-1">Manage all client subscription plans</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Subscription
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                  <p className="text-2xl font-bold">${stats.mrr.toFixed(2)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading subscriptions...</div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No subscriptions found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Next Charge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.client_name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{sub.client_email || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{sub.plan_name}</TableCell>
                      <TableCell className="capitalize">{sub.billing_cycle}</TableCell>
                      <TableCell>${sub.price.toFixed(2)}</TableCell>
                      <TableCell>{sub.next_billing_date}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(sub.status)}>{sub.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedSubscription(sub); setDetailsOpen(true); }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {sub.status === "active" && (
                              <DropdownMenuItem onClick={() => handleAction("pause", sub)}>
                                <Pause className="h-4 w-4 mr-2" /> Pause
                              </DropdownMenuItem>
                            )}
                            {sub.status === "paused" && (
                              <DropdownMenuItem onClick={() => handleAction("resume", sub)}>
                                <Play className="h-4 w-4 mr-2" /> Resume
                              </DropdownMenuItem>
                            )}
                            {sub.status !== "cancelled" && (
                              <DropdownMenuItem className="text-destructive" onClick={() => handleAction("cancel", sub)}>
                                <X className="h-4 w-4 mr-2" /> Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subscription Details</DialogTitle>
            </DialogHeader>
            {selectedSubscription && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{selectedSubscription.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedSubscription.client_email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{selectedSubscription.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">${selectedSubscription.price.toFixed(2)} / {selectedSubscription.billing_cycle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{selectedSubscription.start_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Charge</p>
                    <p className="font-medium">{selectedSubscription.next_billing_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedSubscription.status)}>{selectedSubscription.status}</Badge>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Subscription Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add Client Subscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label>Select Client</Label>
                <Select value={newSubscription.client_id} onValueChange={(v) => setNewSubscription(prev => ({ ...prev, client_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.client_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plan Selection Cards */}
              <div className="space-y-2">
                <Label>Select Plan</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {predefinedPlans.map((plan) => (
                    <Card 
                      key={plan.name}
                      className={`cursor-pointer transition-all hover:border-primary relative ${
                        newSubscription.plan_name === plan.name 
                          ? "border-primary ring-2 ring-primary bg-primary/5" 
                          : "border-border"
                      }`}
                      onClick={() => setNewSubscription(prev => ({ 
                        ...prev, 
                        plan_name: plan.name, 
                        price: plan.price.toString() 
                      }))}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white">
                          Most Popular
                        </Badge>
                      )}
                      <CardContent className="p-4 pt-6 text-center">
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div className="my-4">
                          <span className="text-3xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="text-xs text-left space-y-1 max-h-32 overflow-y-auto">
                          {plan.features.slice(0, 5).map((feature, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                          {plan.features.length > 5 && (
                            <li className="text-muted-foreground">+{plan.features.length - 5} more features</li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Billing Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select value={newSubscription.billing_cycle} onValueChange={(v) => setNewSubscription(prev => ({ ...prev, billing_cycle: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Next Billing Date</Label>
                  <Input
                    type="date"
                    value={newSubscription.next_billing_date}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, next_billing_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Summary */}
              {newSubscription.plan_name && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Selected Plan</p>
                  <p className="font-semibold">{newSubscription.plan_name} - ${newSubscription.price}/{newSubscription.billing_cycle}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddSubscription} disabled={!newSubscription.client_id || !newSubscription.plan_name}>
                Create Subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ClientSubscriptions;