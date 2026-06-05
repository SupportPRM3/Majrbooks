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
  DialogDescription,
} from "@/components/ui/dialog";
import { DollarSign, Users, TrendingUp, Wallet, Search, Check, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Referral {
  id: string;
  referred_client_name: string;
  referred_email: string | null;
  subscription_value: number;
  commission_rate: number;
  earnings: number;
  status: string;
  referred_at: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  processed_at: string | null;
}

const RevenueShare = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [addReferralOpen, setAddReferralOpen] = useState(false);
  const [newReferral, setNewReferral] = useState({
    referred_client_name: "",
    referred_email: "",
    subscription_value: "",
    commission_rate: "10",
  });

  const fetchReferrals = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .order("referred_at", { ascending: false });

    if (error) {
      toast.error("Failed to load referrals");
    } else {
      setReferrals(data || []);
    }
  };

  const fetchPayouts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("payouts")
      .select("*")
      .order("requested_at", { ascending: false });

    if (error) {
      toast.error("Failed to load payouts");
    } else {
      setPayouts(data || []);
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchReferrals(), fetchPayouts()]).finally(() => setLoading(false));
    }
  }, [user]);

  const handleAddReferral = async () => {
    if (!user || !newReferral.referred_client_name || !newReferral.subscription_value) {
      toast.error("Please fill required fields");
      return;
    }

    const subscriptionValue = parseFloat(newReferral.subscription_value);
    const commissionRate = parseFloat(newReferral.commission_rate) / 100;
    const earnings = subscriptionValue * commissionRate;

    const { error } = await supabase
      .from("referrals")
      .insert({
        user_id: user.id,
        referred_client_name: newReferral.referred_client_name,
        referred_email: newReferral.referred_email || null,
        subscription_value: subscriptionValue,
        commission_rate: commissionRate,
        earnings: earnings,
        status: "active",
      });

    if (error) {
      toast.error("Failed to add referral");
    } else {
      toast.success("Referral added successfully");
      setAddReferralOpen(false);
      setNewReferral({ referred_client_name: "", referred_email: "", subscription_value: "", commission_rate: "10" });
      fetchReferrals();
    }
  };

  const handleRequestPayout = async () => {
    if (!user) return;
    
    const pendingEarnings = referrals
      .filter(r => r.status === "active")
      .reduce((sum, r) => sum + r.earnings, 0);

    if (pendingEarnings < 50) {
      toast.error("Minimum payout amount is $50");
      return;
    }

    const { error } = await supabase
      .from("payouts")
      .insert({
        user_id: user.id,
        amount: pendingEarnings,
        status: "pending",
      });

    if (error) {
      toast.error("Failed to request payout");
    } else {
      // Mark referrals as paid
      await supabase
        .from("referrals")
        .update({ status: "paid" })
        .eq("user_id", user.id)
        .eq("status", "active");

      toast.success("Payout request submitted!");
      setPayoutDialogOpen(false);
      fetchReferrals();
      fetchPayouts();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "paid": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "churned": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredReferrals = referrals.filter(r =>
    r.referred_client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.referred_email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalEarnings: referrals.reduce((sum, r) => sum + r.earnings, 0),
    pendingEarnings: referrals.filter(r => r.status === "active").reduce((sum, r) => sum + r.earnings, 0),
    paidEarnings: payouts.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
    activeReferrals: referrals.filter(r => r.status === "active").length,
  };

  const monthlyRecurring = referrals
    .filter(r => r.status === "active")
    .reduce((sum, r) => sum + r.earnings, 0);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-8 text-muted-foreground">Loading revenue share data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              Revenue Share
            </h1>
            <p className="text-muted-foreground mt-1">Track your referral earnings and payouts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddReferralOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Referral
            </Button>
            <Button onClick={() => setPayoutDialogOpen(true)} className="gap-2" disabled={stats.pendingEarnings < 50}>
              <Wallet className="h-4 w-4" /> Request Payout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">${stats.pendingEarnings.toFixed(2)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Out</p>
                  <p className="text-2xl font-bold">${stats.paidEarnings.toFixed(2)}</p>
                </div>
                <Check className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Referrals</p>
                  <p className="text-2xl font-bold">{stats.activeReferrals}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Recurring</p>
                  <p className="text-2xl font-bold">${monthlyRecurring.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Referral Program</h3>
                <p className="text-sm text-muted-foreground">
                  Earn a percentage of your referred clients' subscription value for as long as they remain active.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referred Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Referred Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {filteredReferrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No referrals yet. Add your first referral to get started.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Referred Date</TableHead>
                    <TableHead>Subscription Value</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Your Earnings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{referral.referred_client_name}</p>
                          <p className="text-sm text-muted-foreground">{referral.referred_email || "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(referral.referred_at).toLocaleDateString()}</TableCell>
                      <TableCell>${referral.subscription_value.toFixed(2)}/mo</TableCell>
                      <TableCell>{(referral.commission_rate * 100).toFixed(0)}%</TableCell>
                      <TableCell className="font-medium text-green-600">${referral.earnings.toFixed(2)}/mo</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(referral.status)}>{referral.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Payout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payouts yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>{new Date(payout.requested_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">${payout.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payout.status)}>{payout.status}</Badge>
                      </TableCell>
                      <TableCell>{payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Referral Dialog */}
        <Dialog open={addReferralOpen} onOpenChange={setAddReferralOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Referral</DialogTitle>
              <DialogDescription>Add a client you've referred to earn commission on their subscription.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input
                  value={newReferral.referred_client_name}
                  onChange={(e) => setNewReferral(prev => ({ ...prev, referred_client_name: e.target.value }))}
                  placeholder="Enter client name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  value={newReferral.referred_email}
                  onChange={(e) => setNewReferral(prev => ({ ...prev, referred_email: e.target.value }))}
                  placeholder="client@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Subscription Value</Label>
                  <Input
                    type="number"
                    value={newReferral.subscription_value}
                    onChange={(e) => setNewReferral(prev => ({ ...prev, subscription_value: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
                  <Input
                    type="number"
                    value={newReferral.commission_rate}
                    onChange={(e) => setNewReferral(prev => ({ ...prev, commission_rate: e.target.value }))}
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddReferralOpen(false)}>Cancel</Button>
              <Button onClick={handleAddReferral}>Add Referral</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Payout Dialog */}
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>Request your pending earnings to be transferred to your bank account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Available for payout</p>
                <p className="text-3xl font-bold">${stats.pendingEarnings.toFixed(2)}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Payouts are processed within 3-5 business days via bank transfer. Minimum payout amount is $50.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRequestPayout}>Request Payout</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default RevenueShare;