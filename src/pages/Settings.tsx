import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxRatesManager } from "@/components/TaxRatesManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Building2, Mail, Image, Hash, MapPin, Phone, CreditCard, Clock, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";
import { format } from "date-fns";

const Settings = () => {
  const { user, subscriptionTier, subscribed, isTrial, isStripeTrial, subscriptionEnd, trialDaysRemaining, canCancel, openCustomerPortal, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    email: "",
    avatar_url: "",
    ein: "",
    business_address: "",
    business_city: "",
    business_state: "",
    business_zip: "",
    business_phone: "",
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          business_name: data.business_name || "",
          email: data.email || user?.email || "",
          avatar_url: data.avatar_url || "",
          ein: data.ein || "",
          business_address: data.business_address || "",
          business_city: data.business_city || "",
          business_state: data.business_state || "",
          business_zip: data.business_zip || "",
          business_phone: data.business_phone || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          business_name: formData.business_name,
          avatar_url: formData.avatar_url,
          ein: formData.ein,
          business_address: formData.business_address,
          business_city: formData.business_city,
          business_state: formData.business_state,
          business_zip: formData.business_zip,
          business_phone: formData.business_phone,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal and business information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Name
                </Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) =>
                    setFormData({ ...formData, business_name: e.target.value })
                  }
                  placeholder="Enter your business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Avatar URL
                </Label>
                <Input
                  id="avatar_url"
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar_url: e.target.value })
                  }
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {formData.avatar_url && (
                <div className="flex items-center gap-4">
                  <img
                    src={formData.avatar_url}
                    alt="Avatar preview"
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/80";
                    }}
                  />
                  <p className="text-sm text-muted-foreground">Avatar preview</p>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Payer Information for 1099 Forms</h3>
                <p className="text-sm text-muted-foreground">
                  This information will be used as defaults when generating 1099 forms
                </p>

                <div className="space-y-2">
                  <Label htmlFor="ein" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Employer Identification Number (EIN)
                  </Label>
                  <Input
                    id="ein"
                    value={formData.ein}
                    onChange={(e) =>
                      setFormData({ ...formData, ein: e.target.value })
                    }
                    placeholder="XX-XXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Business Address
                  </Label>
                  <Input
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) =>
                      setFormData({ ...formData, business_address: e.target.value })
                    }
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-3 sm:col-span-1">
                    <Label htmlFor="business_city">City</Label>
                    <Input
                      id="business_city"
                      value={formData.business_city}
                      onChange={(e) =>
                        setFormData({ ...formData, business_city: e.target.value })
                      }
                      placeholder="City"
                    />
                  </div>

                  <div className="space-y-2 col-span-3 sm:col-span-1">
                    <Label htmlFor="business_state">State</Label>
                    <Input
                      id="business_state"
                      value={formData.business_state}
                      onChange={(e) =>
                        setFormData({ ...formData, business_state: e.target.value })
                      }
                      placeholder="State"
                      maxLength={2}
                    />
                  </div>

                  <div className="space-y-2 col-span-3 sm:col-span-1">
                    <Label htmlFor="business_zip">ZIP Code</Label>
                    <Input
                      id="business_zip"
                      value={formData.business_zip}
                      onChange={(e) =>
                        setFormData({ ...formData, business_zip: e.target.value })
                      }
                      placeholder="ZIP"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Business Phone
                  </Label>
                  <Input
                    id="business_phone"
                    type="tel"
                    value={formData.business_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, business_phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadProfile}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Plan Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : isTrial || isStripeTrial ? (
                  <Clock className="h-8 w-8 text-amber-500" />
                ) : subscribed ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">
                      {isAdmin 
                        ? "Admin Access"
                        : subscriptionTier && subscriptionTier !== 'trial'
                          ? SUBSCRIPTION_TIERS[subscriptionTier]?.name
                          : isTrial || isStripeTrial
                            ? "Free Trial"
                            : "No Active Plan"
                      }
                    </span>
                    {(isTrial || isStripeTrial) && !isAdmin && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        Trial
                      </Badge>
                    )}
                    {subscribed && !isTrial && !isStripeTrial && !isAdmin && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Active
                      </Badge>
                    )}
                    {isAdmin && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Active
                      </Badge>
                    )}
                  </div>
                  {subscriptionEnd && !isAdmin && (
                    <p className="text-sm text-muted-foreground">
                      {isTrial || isStripeTrial 
                        ? `Trial ends: ${format(new Date(subscriptionEnd), "MMMM d, yyyy")} (${trialDaysRemaining} days left)`
                        : `Renews: ${format(new Date(subscriptionEnd), "MMMM d, yyyy")}`
                      }
                    </p>
                  )}
                  {isStripeTrial && (
                    <p className="text-sm text-green-600 mt-1">
                      Card on file. Cancel anytime before trial ends.
                    </p>
                  )}
                  {isTrial && !isStripeTrial && !isAdmin && (
                    <p className="text-sm text-blue-600 mt-1">
                      No payment method on file yet.
                    </p>
                  )}
                </div>
              </div>
              {!isAdmin && subscriptionTier && subscriptionTier !== 'trial' && (
                <span className="text-2xl font-bold">
                  ${SUBSCRIPTION_TIERS[subscriptionTier]?.price}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Stripe Trial - Can cancel via portal */}
              {isStripeTrial && (
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    setPortalLoading(true);
                    try {
                      await openCustomerPortal();
                    } finally {
                      setPortalLoading(false);
                    }
                  }}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Cancel Free Trial
                </Button>
              )}
              
              {/* Active subscription - Manage via portal */}
              {canCancel && !isStripeTrial && (
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    setPortalLoading(true);
                    try {
                      await openCustomerPortal();
                    } finally {
                      setPortalLoading(false);
                    }
                  }}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Manage Subscription
                </Button>
              )}
              
              {/* No active plan - Choose a plan */}
              {!subscribed && !isTrial && !isStripeTrial && !isAdmin && (
                <Button 
                  variant="default"
                  onClick={() => window.location.href = "/billing/firm-subscriptions"}
                >
                  Choose a Plan
                </Button>
              )}
              
              {/* Upgrade button for trial users */}
              {(isTrial || isStripeTrial) && (
                <Button 
                  variant="default"
                  onClick={() => window.location.href = "/billing/firm-subscriptions"}
                >
                  Upgrade Now
                </Button>
              )}
            </div>

            {isStripeTrial && (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                Your free trial includes a payment method on file. Cancel before your trial ends to avoid being charged automatically.
              </p>
            )}
            
            {canCancel && !isStripeTrial && (
              <p className="text-sm text-muted-foreground">
                Use the Manage Subscription button to update payment methods, change plans, or cancel your subscription.
              </p>
            )}
          </CardContent>
        </Card>

        <TaxRatesManager />
      </div>
    </Layout>
  );
};

export default Settings;
