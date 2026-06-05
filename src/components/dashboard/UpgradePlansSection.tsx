import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Rocket, Star, Crown, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/subscriptionTiers";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface UpgradePlansSectionProps {
  onUpgradeComplete?: () => void;
}

export const UpgradePlansSection = ({ onUpgradeComplete }: UpgradePlansSectionProps) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'trial') return;
    
    setLoadingPlan(tier);
    try {
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      const priceId = isYearly ? tierConfig.yearly_price_id : tierConfig.price_id;
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        onUpgradeComplete?.();
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const planOrder: SubscriptionTier[] = ['starter', 'pro', 'enterprise'];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardContent className="p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upgrade Your Plan 👑</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose the plan and billing option that works best for you.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg mb-6 max-w-md mx-auto">
          <span className={cn("text-sm font-medium", !isYearly && "text-primary")}>Monthly</span>
          <Switch
            id="dashboard-billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <span className={cn("text-sm font-medium", isYearly && "text-primary")}>
            Yearly <span className="text-green-600 font-semibold">(Save 2 months!)</span>
          </span>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
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
                  "relative border transition-all hover:shadow-lg",
                  isPopular && "border-2 border-primary shadow-lg bg-gradient-to-b from-primary/5 to-background"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-4 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> MOST POPULAR
                  </div>
                )}
                
                <CardContent className="p-6 pt-8">
                  <div className="text-center mb-5">
                    <h3 className="text-lg font-bold">{config.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mt-3">
                      <span className={cn("text-4xl font-bold", isPopular && "text-primary")}>
                        ${displayPrice}
                      </span>
                      <span className="text-muted-foreground">{priceLabel}</span>
                    </div>
                    {isYearly && (
                      <p className="text-xs text-green-600 font-medium mt-1">(save 2 months)</p>
                    )}
                    {!isYearly && (
                      <p className="text-xs text-muted-foreground mt-1">
                        or ${yearlyPrice}/yr (save 2 months)
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border my-5" />
                  
                  <ul className="space-y-3 mb-6">
                    {config.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={cn(
                      "w-full h-12 font-semibold",
                      isPopular 
                        ? "bg-primary hover:bg-primary/90 shadow-lg" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                    onClick={() => handleUpgrade(tier)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === tier ? (
                      <Zap className="h-4 w-4 animate-pulse" />
                    ) : isPopular ? (
                      "SELECT PROFESSIONAL"
                    ) : (
                      `Select ${config.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust indicators */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Switch between monthly and yearly anytime • Cancel anytime • Secure payment via Stripe
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
