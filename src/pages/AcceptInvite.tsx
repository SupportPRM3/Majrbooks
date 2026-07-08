import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Shield, AlertTriangle, XCircle } from "lucide-react";
import logoImage from "@/assets/logo-majr-books-new.jpg";

interface InviteData {
  team_member_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  owner_id: string;
  inviter_business_name: string;
  is_valid: boolean;
  error_message: string | null;
}

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [accountCreated, setAccountCreated] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  useEffect(() => {
    const validateInvite = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
        return;
      }

      if (!token) {
        setInviteError("No invitation token provided. Please use the link from your invitation email.");
        setValidating(false);
        return;
      }

      const { data, error } = await supabase.rpc('validate_team_invite', { p_token: token });

      if (error) {
        console.error("Validation error:", error);
        setInviteError("Unable to validate invitation. Please try again later.");
        setValidating(false);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        if (result.is_valid) {
          setInviteData({
            team_member_id: result.team_member_id,
            first_name: result.first_name,
            last_name: result.last_name,
            email: result.email,
            role: result.role,
            owner_id: result.owner_id,
            inviter_business_name: result.inviter_business_name || 'MAJR Books',
            is_valid: true,
            error_message: null,
          });
        } else {
          setInviteError(result.error_message || "Invalid invitation.");
        }
      } else {
        setInviteError("Invalid invitation link. Please request a new invitation.");
      }

      setValidating(false);
    };

    validateInvite();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteData?.is_valid || !token) {
      toast({
        variant: "destructive",
        title: "Invalid invitation",
        description: "This invitation is no longer valid.",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: `${inviteData.first_name} ${inviteData.last_name}`,
            company_name: inviteData.inviter_business_name,
            is_team_member: true,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Account creation failed. Please try again.");

      const { data: accepted, error: acceptError } = await supabase.rpc('accept_team_invite', {
        p_token: token,
        p_user_id: authData.user.id,
      });

      if (acceptError || !accepted) {
        throw new Error("This invitation could not be completed. It may have already been used or expired.");
      }

      if (!authData.session) {
        // Email confirmation is required project-wide, so signUp() succeeded but issued
        // no session — signing in immediately would just fail with "email not confirmed".
        // The team_members row is already linked above, so all that's left is confirming.
        setAccountCreated(true);
        return;
      }

      toast({
        title: "Account created successfully!",
        description: "Redirecting to your dashboard...",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Account creation failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!inviteData?.email) return;
    setResendingConfirmation(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: inviteData.email });
      if (error) throw error;
      toast({ title: "Confirmation email sent!", description: "Check your inbox (and spam folder)." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to resend", description: err.message });
    } finally {
      setResendingConfirmation(false);
    }
  };

  if (accountCreated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center mb-2">
              <img src={logoImage} alt="MAJR Books Logo" className="h-16 w-auto object-contain" />
            </div>
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Confirm Your Email</CardTitle>
            <CardDescription className="text-base">
              Your account is set up — we just need to confirm <strong>{inviteData?.email}</strong> before you can sign in.
              Click the link we sent to that address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive it? Check your spam folder, or click below to resend.
            </p>
            <Button className="w-full" onClick={handleResendConfirmation} disabled={resendingConfirmation}>
              {resendingConfirmation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Resend Confirmation Email
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/auth")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Invitation Invalid</CardTitle>
            <CardDescription className="text-base">{inviteError}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">What you can do:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Contact the administrator who invited you</li>
                    <li>Request a new invitation link</li>
                    <li>Check if you received a newer invitation email</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <img src={logoImage} alt="MAJR Books Logo" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Account</CardTitle>
          <CardDescription>
            Join <span className="font-semibold text-primary">{inviteData?.inviter_business_name}</span> on MajrBooks
          </CardDescription>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {inviteData?.first_name} {inviteData?.last_name} &middot; {inviteData?.role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No payment or trial setup required — your access is managed by {inviteData?.inviter_business_name}.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={inviteData?.email || ""} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                minLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
