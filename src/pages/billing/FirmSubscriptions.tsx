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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Users, CreditCard, Calendar, ArrowUp, ArrowDown, Download, Sparkles, Clock, CheckCircle2, Gift, Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface FirmSubscription {
  id: string;
  planName: string;
  status: "active" | "cancelled";
  billingCycle: "monthly" | "yearly";
  price: number;
  seatCount: number;
  maxSeats: number;
  nextBillingDate: string;
  startDate: string;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  invoice: string;
}

const plans = [
  { name: "Starter", price: SUBSCRIPTION_TIERS.starter.price, seats: 5, tier: "starter" as const },
  { name: "Professional", price: SUBSCRIPTION_TIERS.pro.price, seats: 10, tier: "pro" as const },
  { name: "Enterprise", price: SUBSCRIPTION_TIERS.enterprise.price, seats: 50, tier: "enterprise" as const },
];

const mockPaymentHistory: PaymentHistory[] = [];

const FirmSubscriptions = () => {
  const { user, subscriptionTier, subscribed, subscriptionEnd, isTrial, trialDaysRemaining } = useAuth();
  const [subscription, setSubscription] = useState<FirmSubscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [newSeatCount, setNewSeatCount] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const trialFeatures = SUBSCRIPTION_TIERS.trial.features;

  // Calculate trial dates
  const getTrialDates = () => {
    if (subscriptionEnd) {
      const endDate = new Date(subscriptionEnd);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 14);
      return {
        startDate: format(startDate, "MMMM d, yyyy"),
        endDate: format(endDate, "MMMM d, yyyy"),
      };
    }
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 14);
    return {
      startDate: format(now, "MMMM d, yyyy"),
      endDate: format(endDate, "MMMM d, yyyy"),
    };
  };

  const trialDates = getTrialDates();

  useEffect(() => {
    setTimeout(() => {
      if (subscribed && !isTrial) {
        // User has a paid subscription
        const tierConfig = subscriptionTier ? SUBSCRIPTION_TIERS[subscriptionTier] : null;
        setSubscription({
          id: "fs1",
          planName: tierConfig?.name || "Professional",
          status: "active",
          billingCycle: "monthly",
          price: tierConfig?.price || 27,
          seatCount: 3,
          maxSeats: 10,
          nextBillingDate: subscriptionEnd ? format(new Date(subscriptionEnd), "yyyy-MM-dd") : "",
          startDate: format(new Date(), "yyyy-MM-dd"),
        });
      } else {
        setSubscription(null);
      }
      setPaymentHistory(mockPaymentHistory);
      setLoading(false);
    }, 500);
  }, [subscribed, isTrial, subscriptionTier, subscriptionEnd]);

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }

    const plan = plans.find(p => p.name === selectedPlan);
    if (!plan) { toast.error("Invalid plan selected"); return; }

    const priceId = SUBSCRIPTION_TIERS[plan.tier].price_id;
    if (!priceId || priceId.startsWith("price_") && priceId.length < 20) {
      toast.error("This plan is not yet available for online checkout. Please contact support.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, withTrial: false }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Redirecting to checkout...");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
      setUpgradeDialogOpen(false);
      setSelectedPlan("");
    }
  };

  const handleSeatChange = () => {
    if (!newSeatCount || !subscription) return;
    const count = parseInt(newSeatCount);
    if (count < 1 || count > subscription.maxSeats) {
      toast.error(`Seat count must be between 1 and ${subscription.maxSeats}`);
      return;
    }
    setSubscription({ ...subscription, seatCount: count });
    toast.success(`Seat count updated to ${count}`);
    setSeatDialogOpen(false);
    setNewSeatCount("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return "there";
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-8 text-muted-foreground">Loading subscription...</div>
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
              <Building2 className="h-8 w-8 text-primary" />
              Firm Subscriptions
            </h1>
            <p className="text-muted-foreground mt-1">Manage your company's subscription and billing</p>
          </div>
        </div>

        {/* Account Status Card - Friendly Format */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Greeting */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Hi {getUserDisplayName()}! 👋</h2>
                  <p className="text-lg text-muted-foreground mt-1">
                    {isTrial ? (
                      <>You're currently on a <span className="font-semibold text-primary">Free Trial</span></>
                    ) : subscribed ? (
                      <>You're on the <span className="font-semibold text-primary">{SUBSCRIPTION_TIERS[subscriptionTier || 'pro'].name}</span> plan</>
                    ) : (
                      <>Welcome to MAJR Books!</>
                    )}
                  </p>
                </div>
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">Subscription Status</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {isTrial ? (
                      <span className="text-amber-600">Free Trial Active</span>
                    ) : subscribed ? (
                      <span className="text-green-600">Paid Subscription</span>
                    ) : (
                      <span className="text-muted-foreground">No paid subscription yet</span>
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Start Date</span>
                  </div>
                  <p className="text-lg font-semibold">{trialDates.startDate}</p>
                </div>

                <div className="p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">{isTrial ? "Expiration Date" : "Next Billing"}</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {isTrial ? trialDates.endDate : subscriptionEnd ? format(new Date(subscriptionEnd), "MMMM d, yyyy") : "N/A"}
                  </p>
                </div>

                {isTrial && trialDaysRemaining !== null && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                      <Gift className="h-4 w-4" />
                      <span className="text-sm font-medium">Days Remaining</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{trialDaysRemaining} days</p>
                  </div>
                )}
              </div>

              {/* Available Features */}
              {isTrial && (
                <div className="p-4 rounded-lg bg-background border">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Available Features During Free Trial
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {trialFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upgrade CTA */}
              {(isTrial || !subscribed) && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        {isTrial ? "Enjoy exploring the platform!" : "Ready to get started?"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upgrade anytime to unlock full access and premium features.
                      </p>
                    </div>
                    <Button onClick={() => setUpgradeDialogOpen(true)} className="gap-2 whitespace-nowrap">
                      <ArrowUp className="h-4 w-4" />
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Plan */}
        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{subscription.planName}</span>
                    <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Billing</p>
                  <p className="text-2xl font-bold">${subscription.price}<span className="text-sm font-normal text-muted-foreground">/{subscription.billingCycle}</span></p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Next Billing Date</p>
                  <p className="text-2xl font-bold">{subscription.nextBillingDate}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-2xl font-bold">{subscription.startDate}</p>
                </div>
              </div>

              {/* Seat Usage */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Seat Usage</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{subscription.seatCount} of {subscription.maxSeats} seats</span>
                </div>
                <Progress value={(subscription.seatCount / subscription.maxSeats) * 100} className="h-2" />
              </div>

              <div className="flex gap-4 mt-6">
                <Button onClick={() => setUpgradeDialogOpen(true)} className="gap-2">
                  <ArrowUp className="h-4 w-4" /> Upgrade Plan
                </Button>
                <Button variant="outline" onClick={() => setSeatDialogOpen(true)} className="gap-2">
                  <Users className="h-4 w-4" /> Manage Seats
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.name} className={`${subscription?.planName === plan.name ? "ring-2 ring-primary" : ""}`}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-3xl font-bold mb-4">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                    <p className="text-sm text-muted-foreground mb-4">Up to {plan.seats} seats</p>
                    {subscription?.planName === plan.name ? (
                      <Badge className="w-full justify-center py-2">Current Plan</Badge>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={() => { setSelectedPlan(plan.name); setUpgradeDialogOpen(true); }}>
                        {plans.indexOf(plan) > plans.findIndex(p => p.name === subscription?.planName) ? "Upgrade" : "Downgrade"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="font-medium">{payment.invoice}</TableCell>
                    <TableCell>${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="h-4 w-4" /> Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Upgrade Dialog - Shows all plans for purchase/repurchase */}
        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Your Plan</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Select a plan below. All plans include a 14-day free trial with your card on file.
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Plan Selection Cards */}
              <div className="space-y-3">
                {plans.map((plan) => {
                  const isCurrentPlan = subscription?.planName === plan.name;
                  const isSelected = selectedPlan === plan.name;
                  
                  return (
                    <div 
                      key={plan.name}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : isCurrentPlan 
                            ? 'border-green-500 bg-green-50'
                            : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => !isCurrentPlan && setSelectedPlan(plan.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{plan.name}</span>
                            {isCurrentPlan && (
                              <Badge variant="secondary" className="text-xs">Current Plan</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Up to {plan.seats} seats</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold">${plan.price}</span>
                          <span className="text-sm text-muted-foreground">/mo</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-3 rounded-lg bg-muted border">
                <p className="text-sm text-muted-foreground">
                  You will be redirected to our secure Stripe checkout to complete your payment. Cancel anytime from your account settings.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setUpgradeDialogOpen(false); setSelectedPlan(""); }} disabled={checkoutLoading}>
                Cancel
              </Button>
              <Button onClick={handleUpgrade} disabled={checkoutLoading || !selectedPlan}>
                {checkoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Subscribe Now"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Seat Management Dialog */}
        <Dialog open={seatDialogOpen} onOpenChange={setSeatDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Seats</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Current: {subscription?.seatCount} seats (max {subscription?.maxSeats})
              </p>
              <div className="space-y-2">
                <Label>New Seat Count</Label>
                <Input
                  type="number"
                  min="1"
                  max={subscription?.maxSeats}
                  value={newSeatCount}
                  onChange={(e) => setNewSeatCount(e.target.value)}
                  placeholder={`1-${subscription?.maxSeats}`}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSeatDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSeatChange}>Update Seats</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default FirmSubscriptions;
