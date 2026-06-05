export const SUBSCRIPTION_TIERS = {
  trial: {
    name: "Free Trial",
    price_id: null,
    yearly_price_id: null,
    product_id: null,
    price: 0,
    yearly_price: 0,
    features: [
      "Full access for 14 days",
      "All Pro features included",
      "No credit card required",
      "Explore all tools",
    ],
    modules: [
      "dashboard",
      "invoices",
      "expenses",
      "transactions",
      "reports",
      "resources",
      "payroll",
      "tax-returns",
      "tasks",
      "team",
      "accounting",
      "workflow-automation",
      "tax-ai",
      "settings",
    ],
  },
  starter: {
    name: "Starter",
    price_id: "price_1SJGSlLJQAEtF5u9VXkaSglv",
    yearly_price_id: "price_starter_yearly", // Replace with actual Stripe yearly price ID
    product_id: "prod_TFm0qFQl5Tb8d0",
    price: 29,
    yearly_price: 290, // Save 2 months
    features: [
      "Basic bookkeeping",
      "Invoice creation",
      "Expense tracking",
      "Basic reports",
    ],
    modules: [
      "dashboard",
      "invoices",
      "expenses",
      "transactions",
      "reports",
      "resources",
      "settings",
    ],
  },
  pro: {
    name: "Professional",
    price_id: "price_1SJGT8LJQAEtF5u97a5xckAB",
    yearly_price_id: "price_pro_yearly", // Replace with actual Stripe yearly price ID
    product_id: "prod_TFm1wq4fgLJvlJ",
    price: 37,
    yearly_price: 370, // Save 2 months
    features: [
      "Everything in Starter",
      "Advanced tax planning",
      "Payroll management",
      "Unlimited clients",
    ],
    modules: [
      "dashboard",
      "invoices",
      "expenses",
      "transactions",
      "reports",
      "resources",
      "payroll",
      "tax-returns",
      "tasks",
      "team",
      "accounting",
      "workflow-automation",
      "settings",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price_id: "price_enterprise",
    yearly_price_id: "price_enterprise_yearly", // Replace with actual Stripe yearly price ID
    product_id: "prod_enterprise",
    price: 97,
    yearly_price: 970, // Save 2 months
    features: [
      "Everything in Professional",
      "Tax AI assistant",
      "Priority support",
      "Custom integrations",
    ],
    modules: [
      "dashboard",
      "invoices",
      "expenses",
      "transactions",
      "reports",
      "resources",
      "payroll",
      "tax-returns",
      "tasks",
      "team",
      "accounting",
      "workflow-automation",
      "tax-ai",
      "settings",
    ],
  },
} as const;

export const TRIAL_DURATION_DAYS = 14;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export const getTierByProductId = (productId: string | null): SubscriptionTier | null => {
  if (!productId) return null;
  
  for (const [tier, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (config.product_id === productId) {
      return tier as SubscriptionTier;
    }
  }
  return null;
};

export const hasAccessToModule = (tier: SubscriptionTier | null, module: string): boolean => {
  if (!tier) return false;
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  return (tierConfig.modules as readonly string[]).includes(module);
};
