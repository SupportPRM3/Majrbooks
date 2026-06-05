import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Zap, Crown, XCircle, CreditCard, Sparkles } from "lucide-react";
import { SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/subscriptionTiers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const { subscribed, subscriptionTier, subscriptionEnd, openCustomerPortal, isTrial, isStripeTrial } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'trial') return;
    
    setCheckoutLoading(tier);
    try {
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      const priceId = isYearly ? tierConfig.yearly_price_id : tierConfig.price_id;
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, withTrial: false }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPlanName = subscriptionTier && subscriptionTier !== 'trial' 
    ? SUBSCRIPTION_TIERS[subscriptionTier]?.name 
    : null;

  const formattedEndDate = subscriptionEnd 
    ? format(new Date(subscriptionEnd), "MMMM d, yyyy")
    : null;

  const planOrder: SubscriptionTier[] = ['starter', 'pro', 'enterprise'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Crown className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Upgrade Your Plan 👑
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Choose the plan and billing option that works best for you. Your card will be charged after the trial period ends.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
            <span className={cn("text-sm font-medium", !isYearly && "text-primary")}>Monthly</span>
            <div className="flex items-center gap-2">
              <Switch
                id="billing-toggle"
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
            </div>
            <span className={cn("text-sm font-medium", isYearly && "text-primary")}>
              Yearly <span className="text-green-600 font-semibold">(Save 2 months!)</span>
            </span>
          </div>

          {/* Current subscription info for paid users */}
          {subscribed && !isTrial && currentPlanName && (
            <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-green-900 dark:text-green-100">
                      Current Plan: {currentPlanName}
                    </p>
                    {formattedEndDate && (
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Next billing date: {formattedEndDate}
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 gap-2 text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/40"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <Zap className="h-4 w-4 animate-pulse" />
                      ) : (
                        "Manage Subscription"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stripe Trial info */}
          {isStripeTrial && (
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                      {currentPlanName} Trial{formattedEndDate && ` - Ends ${formattedEndDate}`}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      You won't be charged until your trial ends. Cancel anytime before then.
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
                          Cancel Trial
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {planOrder.map((tier) => {
              const config = SUBSCRIPTION_TIERS[tier];
              const isCurrentPlan = subscriptionTier === tier;
              const isPopular = tier === 'pro';
              const monthlyPrice = config.price;
              const yearlyPrice = config.yearly_price;
              const displayPrice = isYearly ? yearlyPrice : monthlyPrice;
              const priceLabel = isYearly ? '/yr' : '/mo';
              const savingsLabel = isYearly ? '(save 2 months)' : '';
              
              return (
                <Card 
                  key={tier}
                  className={cn(
                    "relative transition-all hover:shadow-lg",
                    isPopular && "ring-2 ring-primary shadow-lg",
                    isCurrentPlan && "bg-primary/5"
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-full">
                      Popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-3 bg-green-500 text-white px-2 py-0.5 text-xs font-medium rounded">
                      Current
                    </div>
                  )}
                  <CardContent className="pt-8 pb-6 px-5">
                    <div className="text-center mb-5">
                      <h3 className="font-bold text-lg">{config.name}</h3>
                      <div className="flex items-baseline justify-center gap-1 mt-3">
                        <span className="text-4xl font-bold">${displayPrice}</span>
                        <span className="text-muted-foreground text-sm">{priceLabel}</span>
                      </div>
                      {isYearly && (
                        <p className="text-xs text-green-600 font-medium mt-1">{savingsLabel}</p>
                      )}
                      {!isYearly && (
                        <p className="text-xs text-muted-foreground mt-1">
                          or ${yearlyPrice}/yr {savingsLabel}
                        </p>
                      )}
                    </div>
                    
                    {/* Features list */}
                    <ul className="space-y-2.5 mb-6">
                      {config.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
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
                      onClick={() => isCurrentPlan ? handleManageSubscription() : handleUpgrade(tier)}
                      disabled={checkoutLoading !== null || portalLoading}
                    >
                      {checkoutLoading === tier ? (
                        <Zap className="h-4 w-4 animate-pulse" />
                      ) : isCurrentPlan ? (
                        'Manage Plan'
                      ) : (
                        'Select Plan'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info messages */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles className="h-4 w-4" />
              You can switch between monthly and yearly anytime.
            </p>
            <p className="text-xs text-muted-foreground">
              ⚠️ Your card will only be charged after your free trial ends.
            </p>
          </div>

          {/* Cancel subscription option for paid users */}
          {subscribed && !isTrial && (
            <div className="flex justify-center pt-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground gap-2"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                <XCircle className="h-4 w-4" />
                Cancel Subscription
              </Button>
            </div>
          )}

          {/* Close button for trial users */}
          {isTrial && !isStripeTrial && (
            <div className="flex justify-center pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Continue with Free Trial
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
