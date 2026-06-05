import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Zap, Check, AlertTriangle, Crown, CreditCard, XCircle, Sparkles } from "lucide-react";
import { SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/subscriptionTiers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface TrialExpiryModalProps {
  daysRemaining: number | null;
  isTrialExpired: boolean;
  userEmail?: string;
}

const TrialExpiryModal = ({ daysRemaining, isTrialExpired, userEmail }: TrialExpiryModalProps) => {
  const navigate = useNavigate();
  const { user, isStripeTrial, subscriptionEnd, openCustomerPortal, subscriptionTier } = useAuth();
  const [open, setOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  // Determine when to show the modal
  useEffect(() => {
    // Check if user has dismissed the modal recently
    const storageKey = `trial_modal_dismissed_${user?.id}`;
    const dismissed = localStorage.getItem(storageKey);
    
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      // If dismissed less than 24 hours ago (for warning) or less than 1 hour (for expired), don't show
      const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
      
      if (isTrialExpired && hoursSinceDismissed < 1) {
        setDismissedUntil(dismissed);
        return;
      }
      if (!isTrialExpired && hoursSinceDismissed < 24) {
        setDismissedUntil(dismissed);
        return;
      }
    }

    // Show modal if trial expired OR if 3 days or less remaining
    if (isTrialExpired || (daysRemaining !== null && daysRemaining <= 3)) {
      setOpen(true);
    }
  }, [daysRemaining, isTrialExpired, user?.id]);

  const handleDismiss = () => {
    const storageKey = `trial_modal_dismissed_${user?.id}`;
    localStorage.setItem(storageKey, new Date().toISOString());
    setOpen(false);
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'trial') return;
    
    setCheckoutLoading(tier);
    try {
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      const priceId = isYearly ? tierConfig.yearly_price_id : tierConfig.price_id;
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, withTrial: false } // No trial for upgrades
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } finally {
      setPortalLoading(false);
    }
  };

  // If trial is expired, force the modal (can't dismiss easily)
  const canDismiss = !isTrialExpired;

  // Format the trial end date for display
  const formattedTrialEnd = subscriptionEnd 
    ? format(new Date(subscriptionEnd), "MMMM d, yyyy")
    : null;

  // Get the plan name for Stripe trial users
  const planName = subscriptionTier && subscriptionTier !== 'trial' 
    ? SUBSCRIPTION_TIERS[subscriptionTier]?.name 
    : null;

  const planOrder: SubscriptionTier[] = ['starter', 'pro', 'enterprise'];

  return (
    <Dialog open={open} onOpenChange={canDismiss ? setOpen : undefined}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={canDismiss ? undefined : (e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            {isTrialExpired ? (
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            {isTrialExpired 
              ? "Your Free Trial Has Ended" 
              : `Your Trial Ends in ${daysRemaining} Day${daysRemaining === 1 ? '' : 's'}`
            }
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {isTrialExpired 
              ? "To continue using MAJR Books and access all your data, please select a plan below."
              : isStripeTrial && planName
                ? `Your ${planName} plan trial ends on ${formattedTrialEnd}. Your card will be charged automatically unless you cancel before then.`
                : "Choose a plan to continue enjoying all features. Your card will be charged after the trial ends."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
            <span className={cn("text-sm font-medium", !isYearly && "text-primary")}>Monthly</span>
            <Switch
              id="trial-billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={cn("text-sm font-medium", isYearly && "text-primary")}>
              Yearly <span className="text-green-600 font-semibold">(Save 2 months!)</span>
            </span>
          </div>

          {/* Stripe Trial Info - Show billing info and cancel option */}
          {isStripeTrial && !isTrialExpired && (
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                      {planName} Trial - Ends {formattedTrialEnd}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      You won't be charged until your trial ends. Cancel anytime before then to avoid charges.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 gap-2 text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/40"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <Zap className="h-4 w-4 animate-pulse" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Cancel Before Trial Ends
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits reminder */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">What you'll keep with a subscription:</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      All your existing data and reports
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      Unlimited invoicing and expense tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      Bank connections and reconciliation
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      Tax preparation and filing tools
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan options - Only show if trial expired or not a Stripe trial */}
          {(isTrialExpired || !isStripeTrial) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {planOrder.map((tier) => {
                const config = SUBSCRIPTION_TIERS[tier];
                const isPopular = tier === 'pro';
                const monthlyPrice = config.price;
                const yearlyPrice = config.yearly_price;
                const displayPrice = isYearly ? yearlyPrice : monthlyPrice;
                const priceLabel = isYearly ? '/yr' : '/mo';
                
                return (
                  <Card 
                    key={tier}
                    className={cn(
                      "relative transition-all hover:shadow-lg cursor-pointer",
                      isPopular && "ring-2 ring-primary"
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-full">
                        Popular
                      </div>
                    )}
                    <CardContent className="pt-7 pb-5">
                      <div className="text-center mb-4">
                        <h3 className="font-semibold">{config.name}</h3>
                        <div className="flex items-baseline justify-center gap-1 mt-2">
                          <span className="text-3xl font-bold">${displayPrice}</span>
                          <span className="text-muted-foreground text-sm">{priceLabel}</span>
                        </div>
                        {isYearly && (
                          <p className="text-xs text-green-600 font-medium mt-1">(save 2 months)</p>
                        )}
                      </div>
                      
                      {/* Features list */}
                      <ul className="space-y-2 mb-5 text-sm">
                        {config.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground text-xs">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button 
                        className={cn(
                          "w-full",
                          isPopular 
                            ? "bg-primary hover:bg-primary/90" 
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                        size="sm"
                        onClick={() => handleUpgrade(tier)}
                        disabled={checkoutLoading !== null}
                      >
                        {checkoutLoading === tier ? (
                          <Zap className="h-4 w-4 animate-pulse" />
                        ) : (
                          'Select Plan'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Info message */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles className="h-4 w-4" />
              You can switch between monthly and yearly anytime.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {canDismiss && (
              <Button variant="ghost" className="flex-1" onClick={handleDismiss}>
                Remind Me Later
              </Button>
            )}
            <Button 
              variant="link" 
              className="text-muted-foreground"
              onClick={() => {
                setOpen(false);
                navigate("/billing/firm-subscriptions");
              }}
            >
              Compare all plans
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialExpiryModal;
