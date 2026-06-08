import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Sparkles, ArrowRight, Clock, ArrowLeft, Mail } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logoImage from "@/assets/logo-majr-books-new.jpg";
import { SUBSCRIPTION_TIERS, SubscriptionTier, TRIAL_DURATION_DAYS } from "@/lib/subscriptionTiers";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const { signIn, signUp, user, subscribed, isTrial, trialDaysRemaining, checkSubscription, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", fullName: "", businessName: "" });

  // Check for checkout status or plan selection flag in URL
  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    const forcePlanSelection = searchParams.get("showPlanSelection");
    
    // For invited clients - show plan selection immediately
    if (forcePlanSelection === "true" && user) {
      setShowPlanSelection(true);
    }
    
    if (checkoutStatus === "cancelled") {
      toast({
        variant: "destructive",
        title: "Checkout cancelled",
        description: "You can continue with your free trial or select a plan anytime.",
      });
      setShowPlanSelection(false);
    }
    if (checkoutStatus === "success") {
      toast({
        title: "Subscription activated!",
        description: "Welcome to MajrBooks. Redirecting to dashboard...",
      });
      checkSubscription();
    }
  }, [searchParams, toast, checkSubscription, user]);

  // Redirect subscribed users (including trial) or admins to dashboard
  useEffect(() => {
    if (user && (subscribed || isAdmin) && !showPlanSelection) {
      navigate("/dashboard");
    }
  }, [user, subscribed, isAdmin, navigate, showPlanSelection]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(loginData.email, loginData.password);

    if (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Login successful!",
      description: "Redirecting to dashboard...",
    });
    // Navigate immediately — don't wait for subscription check to finish
    navigate("/dashboard");
    setLoading(false);
  };

  const ADMIN_EMAILS = ["support@prm3tax.com"];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName, signupData.businessName);

    if (error) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    // Admin email bypasses plan selection entirely
    if (ADMIN_EMAILS.some(e => e.toLowerCase() === signupData.email.toLowerCase())) {
      toast({
        title: "Admin account created!",
        description: "Redirecting to dashboard...",
      });
      await checkSubscription();
      navigate("/dashboard");
      setLoading(false);
      return;
    }

    toast({
      title: "Account created!",
      description: "Please select your subscription plan.",
    });
    
    setShowPlanSelection(true);
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Reset email sent!",
        description: "Check your inbox for a password reset link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: error.message || "Failed to send reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setForgotPasswordEmail("");
  };

  const handleSelectPlanWithTrial = async (tier: SubscriptionTier) => {
    if (tier === 'trial') return;
    
    setCheckoutLoading(tier);
    
    try {
      const priceId = SUBSCRIPTION_TIERS[tier].price_id;
      
      // Create checkout with 14-day trial
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, withTrial: true }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: error.message || "Failed to start checkout",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === 'trial') return; // Can't select trial as a plan
    
    setCheckoutLoading(tier);
    
    try {
      const priceId = SUBSCRIPTION_TIERS[tier].price_id;
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: error.message || "Failed to start checkout",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Handle starting free trial with credit card via Stripe
  const handleStartFreeTrial = async (tier: SubscriptionTier = 'pro') => {
    if (tier === 'trial') return;
    
    setCheckoutLoading('trial');
    
    try {
      const priceId = SUBSCRIPTION_TIERS[tier].price_id;
      
      // Create checkout with 14-day trial - card will be collected but not charged
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, withTrial: true }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to start trial",
        description: error.message || "Please try again",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Show plan selection after signup - Free trial option + paid plans
  if (showPlanSelection && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <img 
                src={logoImage} 
                alt="MAJR Books Logo" 
                className="h-20 w-auto object-contain mx-auto"
              />
            </Link>
            <h1 className="text-3xl font-bold mb-2">Welcome to MajrBooks!</h1>
            <p className="text-muted-foreground">Start your free trial or choose a plan</p>
          </div>

          {/* Free Trial Card - Highlighted */}
          <Card className="mb-6 border-green-500 ring-2 ring-green-500/20 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Clock className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Start with 14-Day Free Trial</h3>
                  <p className="text-muted-foreground">Full access to all features • Credit card required • Cancel anytime before trial ends</p>
                </div>
              </div>
              <Button 
                size="lg"
                className="gap-2 bg-green-600 hover:bg-green-700 text-white min-w-[200px]"
                onClick={() => handleStartFreeTrial('pro')}
                disabled={checkoutLoading !== null}
              >
                {checkoutLoading === 'trial' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mb-4">
            Your card won't be charged during the 14-day trial. Cancel anytime before it ends to avoid charges.
          </p>

          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Or choose a different plan with 14-day free trial</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS[SubscriptionTier]][])
              .filter(([tier]) => tier !== 'trial')
              .map(([tier, config]) => (
              <Card 
                key={tier} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  tier === 'pro' ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                {tier === 'pro' && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{config.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${config.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {config.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-center text-muted-foreground mb-2">14-day free trial included</p>
                  <Button 
                    className="w-full gap-2" 
                    variant={tier === 'pro' ? 'default' : 'outline'}
                    onClick={() => handleStartFreeTrial(tier)}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === tier || (checkoutLoading === 'trial' && tier === 'pro') ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Start Free Trial
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show plan selection if user's trial expired and hasn't subscribed (exclude admins)
  if (user && !subscribed && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <img 
                src={logoImage} 
                alt="MAJR Books Logo" 
                className="h-20 w-auto object-contain mx-auto"
              />
            </Link>
            <h1 className="text-3xl font-bold mb-2">Your Trial Has Ended</h1>
            <p className="text-muted-foreground">Select a plan to continue using MajrBooks</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {(Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS[SubscriptionTier]][])
              .filter(([tier]) => tier !== 'trial')
              .map(([tier, config]) => (
              <Card 
                key={tier} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  tier === 'pro' ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                {tier === 'pro' && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{config.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${config.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {config.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full gap-2" 
                    variant={tier === 'pro' ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(tier)}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === tier ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show forgot password form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md shadow-xl border-primary/10">
          <CardHeader className="space-y-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <Link to="/" className="cursor-pointer">
                <img 
                  src={logoImage} 
                  alt="MAJR Books Logo" 
                  className="h-20 w-auto object-contain hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription className="text-base">
              {resetEmailSent 
                ? "Check your email for further instructions" 
                : "Enter your email to receive a password reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetEmailSent ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-center text-muted-foreground">
                    We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>. 
                    Please check your inbox and spam folder.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full gap-2" 
                  onClick={handleBackToLogin}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send Reset Link
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full gap-2" 
                  onClick={handleBackToLogin}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-3 text-center">
          <div className="flex items-center justify-center mb-2">
            <Link to="/" className="cursor-pointer">
              <img 
                src={logoImage} 
                alt="MAJR Books Logo" 
                className="h-20 w-auto object-contain hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>
          <CardDescription className="text-base">Smart Bookkeeping Made Simple</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">{TRIAL_DURATION_DAYS}-Day Free Trial</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Full access to all features. No credit card required.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-business">Business Name</Label>
                  <Input
                    id="signup-business"
                    type="text"
                    placeholder="Your Business LLC"
                    value={signupData.businessName}
                    onChange={(e) => setSignupData({ ...signupData, businessName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Start Free Trial
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
