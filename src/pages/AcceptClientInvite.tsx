import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, FileText, MessageSquare, Bell, Shield, AlertTriangle, XCircle } from "lucide-react";
import logoImage from "@/assets/logo-majr-books-new.jpg";

interface InvitationData {
  invitation_id: string;
  client_name: string;
  client_email: string;
  firm_id: string;
  inviter_business_name: string;
  is_valid: boolean;
  error_message: string | null;
}

const AcceptClientInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Support both token-based and legacy firm-based invitations
  const token = searchParams.get("token");
  const legacyFirmId = searchParams.get("firm");

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  // Validate invitation on mount
  useEffect(() => {
    const validateInvitation = async () => {
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
        return;
      }

      if (token) {
        // Token-based invitation (new flow)
        const { data, error } = await supabase.rpc('validate_client_invitation', {
          p_token: token
        });

        if (error) {
          console.error("Validation error:", error);
          setInvitationError("Unable to validate invitation. Please try again later.");
          setValidating(false);
          return;
        }

        if (data && data.length > 0) {
          const result = data[0];
          if (result.is_valid) {
            setInvitationData({
              invitation_id: result.invitation_id,
              client_name: result.client_name,
              client_email: result.client_email,
              firm_id: result.firm_id,
              inviter_business_name: result.inviter_business_name || 'MAJR Books',
              is_valid: true,
              error_message: null,
            });
            // Pre-fill form with invitation data
            setFormData(prev => ({
              ...prev,
              fullName: result.client_name || "",
              email: result.client_email || "",
            }));
          } else {
            setInvitationError(result.error_message || "Invalid invitation.");
          }
        } else {
          setInvitationError("Invalid invitation link. Please request a new invitation.");
        }
      } else if (legacyFirmId) {
        // Legacy firm-based invitation (backwards compatibility)
        // Look up the invitation by firm_id and find a valid pending one
        const { data: invitations, error } = await supabase
          .from('client_invitations')
          .select('*')
          .eq('firm_id', legacyFirmId)
          .eq('status', 'pending')
          .is('used_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (error || !invitations || invitations.length === 0) {
          // Allow signup with just firm_id for backwards compatibility
          setInvitationData({
            invitation_id: '',
            client_name: '',
            client_email: '',
            firm_id: legacyFirmId,
            inviter_business_name: 'MAJR Books',
            is_valid: true,
            error_message: null,
          });
        } else {
          const inv = invitations[0];
          setInvitationData({
            invitation_id: inv.id,
            client_name: inv.client_name,
            client_email: inv.client_email,
            firm_id: inv.firm_id,
            inviter_business_name: inv.inviter_business_name || 'MAJR Books',
            is_valid: true,
            error_message: null,
          });
          setFormData(prev => ({
            ...prev,
            fullName: inv.client_name || "",
            email: inv.client_email || "",
          }));
        }
      } else {
        setInvitationError("No invitation token provided. Please use the link from your invitation email.");
      }

      setValidating(false);
    };

    validateInvitation();
  }, [token, legacyFirmId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationData?.is_valid) {
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
      // Create the user account with client role metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            is_client: true,
            firm_id: invitationData.firm_id,
            company_name: invitationData.inviter_business_name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Mark invitation as used (for token-based invitations)
        if (token) {
          await supabase.rpc('mark_invitation_used', {
            p_token: token,
            p_client_user_id: authData.user.id
          });
        } else if (invitationData.invitation_id) {
          // Legacy: Update invitation status directly
          await supabase
            .from("client_invitations")
            .update({
              status: "accepted",
              responded_at: new Date().toISOString(),
              used_at: new Date().toISOString(),
              client_user_id: authData.user.id,
            })
            .eq("id", invitationData.invitation_id);
        }

        // Note: 'client' role is automatically assigned by the database trigger
        // based on the is_client flag in user metadata

        // Create a client record linked to the firm owner
        // The firm_id in invitation is the inviter's user_id - client should appear in THEIR dashboard
        await supabase.from('clients').insert({
          user_id: invitationData.firm_id, // The FIRM OWNER's ID so they see the client in their dashboard
          client_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          status: 'active',
          notes: `Client portal user ID: ${authData.user.id}. Firm: ${invitationData.inviter_business_name}`,
        });
      }

      toast({
        title: "Account created successfully!",
        description: `Redirecting to select your plan...`,
      });

      // Sign in the user immediately after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        navigate("/auth");
      } else {
        // Redirect to onboarding wizard for new clients
        navigate("/client-onboarding");
      }
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

  const features = [
    {
      icon: FileText,
      title: "Document Management",
      description: "Securely upload and manage your financial documents",
    },
    {
      icon: MessageSquare,
      title: "Team Collaboration",
      description: "Communicate efficiently with your accounting team",
    },
    {
      icon: Bell,
      title: "Real-time Updates",
      description: "Stay informed with updates related to your account",
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Bank-level security protecting your information",
    },
  ];

  // Show loading state while validating
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

  // Show error state if invitation is invalid
  if (invitationError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Invitation Invalid</CardTitle>
            <CardDescription className="text-base">
              {invitationError}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">What you can do:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Contact the person who sent you this invitation</li>
                    <li>Request a new invitation link</li>
                    <li>Check if you received a newer invitation email</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate("/auth")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sidebar-background via-card to-secondary p-12 flex-col justify-between">
        <div>
          <img
            src={logoImage}
            alt="MAJR Books Logo"
            className="h-16 w-auto object-contain mb-8"
          />
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Welcome to {invitationData?.inviter_business_name || 'MAJR Books'}
          </h1>
          <p className="text-muted-foreground text-lg mb-12">
            Your secure client portal for seamless financial management and collaboration.
          </p>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="bg-primary/20 p-3 rounded-lg">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} MAJR Books. All rights reserved.
        </p>
      </div>

      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="lg:hidden flex justify-center mb-4">
              <img
                src={logoImage}
                alt="MAJR Books Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Join <span className="font-semibold text-primary">{invitationData?.inviter_business_name || 'MAJR Books'}</span> and access your client portal
            </CardDescription>
            
            {/* Company badge - locked */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-2">
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Joining: {invitationData?.inviter_business_name || 'MAJR Books'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your account will be linked to this company
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!invitationData?.client_email}
                  className={invitationData?.client_email ? "bg-muted" : ""}
                />
                {invitationData?.client_email && (
                  <p className="text-xs text-muted-foreground">
                    Email is pre-filled from your invitation
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
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
    </div>
  );
};

export default AcceptClientInvite;