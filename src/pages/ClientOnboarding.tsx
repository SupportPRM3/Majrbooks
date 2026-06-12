import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-majr-books-new.jpg";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building2,
  Briefcase,
  FileText,
  BarChart3,
  Bot,
  Receipt,
  Sparkles,
  Clock,
  DollarSign,
  BookOpen,
  Target,
  Users,
  ArrowRight,
  PartyPopper,
  Phone,
  MapPin,
  Layers,
} from "lucide-react";

// ─── Step definitions ─────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

// ─── Option button component ──────────────────────────────────────────────────

const OptionButton = ({
  icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150",
      selected
        ? "border-primary bg-primary/5 shadow-sm"
        : "border-border hover:border-primary/40 hover:bg-muted/40"
    )}
  >
    <div
      className={cn(
        "p-2 rounded-lg flex-shrink-0 mt-0.5",
        selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
      )}
    >
      {icon}
    </div>
    <div>
      <p className={cn("font-medium", selected && "text-primary")}>{label}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
    {selected && (
      <CheckCircle2 className="h-5 w-5 text-primary ml-auto flex-shrink-0 mt-0.5" />
    )}
  </button>
);

// ─── Feature card ─────────────────────────────────────────────────────────────

const FeatureCard = ({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) => (
  <div className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
    <div className="bg-primary/10 p-2.5 rounded-lg flex-shrink-0">{icon}</div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-sm">{title}</p>
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const ClientOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [industry, setIndustry] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [bookkeepingStatus, setBookkeepingStatus] = useState("");
  const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  // Guard: if already completed, go straight to portal
  useEffect(() => {
    if (user) {
      const key = `majrbooks_onboarding_done_${user.id}`;
      if (localStorage.getItem(key)) {
        navigate("/client-portal", { replace: true });
      }
    }
  }, [user, navigate]);

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  const toggleGoal = (goal: string) => {
    setPrimaryGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const canAdvance = () => {
    if (step === 1) return true; // welcome — always OK
    if (step === 2) return !!businessName.trim() && !!businessType;
    if (step === 3) return !!bookkeepingStatus;
    if (step === 4) return primaryGoals.length > 0;
    if (step === 5) return true; // feature tour
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save onboarding data to profiles table
      if (user) {
        await supabase
          .from("profiles")
          .update({
            business_name: businessName || null,
            business_phone: phone || null,
            // Store industry + state + type + goals in notes/metadata if columns exist
          })
          .eq("id", user.id);

        // Mark onboarding done
        localStorage.setItem(`majrbooks_onboarding_done_${user.id}`, "true");
        // Also store the extra onboarding answers for the bookkeeper to see
        localStorage.setItem(
          `majrbooks_onboarding_data_${user.id}`,
          JSON.stringify({ businessType, industry, state, bookkeepingStatus, primaryGoals })
        );
      }

      navigate("/client-portal", { replace: true });
    } catch (err) {
      console.error("Onboarding save error:", err);
      // Still proceed even if save fails
      if (user) {
        localStorage.setItem(`majrbooks_onboarding_done_${user.id}`, "true");
      }
      navigate("/client-portal", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const skipOnboarding = () => {
    if (user) {
      localStorage.setItem(`majrbooks_onboarding_done_${user.id}`, "true");
    }
    navigate("/client-portal", { replace: true });
  };

  // ─── Left panel content per step ──────────────────────────────────────────

  const leftPanelContent = [
    {
      title: "Welcome aboard!",
      subtitle: `Hi ${firstName}, we're excited to have you with MAJR Books.`,
      bullets: [
        "Your bookkeeping, organized and stress-free",
        "Real-time financial visibility",
        "Expert support when you need it",
      ],
    },
    {
      title: "Tell us about your business",
      subtitle: "This helps us personalize your experience.",
      bullets: [
        "We tailor reports to your business type",
        "Industry-specific tax categories",
        "Smarter expense suggestions",
      ],
    },
    {
      title: "Where are your books right now?",
      subtitle: "No judgment — we've seen it all!",
      bullets: [
        "We meet you where you are",
        "Catch-up bookkeeping available",
        "We'll get you current fast",
      ],
    },
    {
      title: "What are your goals?",
      subtitle: "Pick everything that applies.",
      bullets: [
        "Personalized dashboard widgets",
        "Relevant alerts and reminders",
        "Focused bookkeeper support",
      ],
    },
    {
      title: "You're all set!",
      subtitle: "Here's a quick look at what's waiting for you.",
      bullets: [
        "Your portal is ready to use",
        "Your bookkeeper has been notified",
        "First review call coming soon",
      ],
    },
  ][step - 1];

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 text-white"
        style={{
          background: "linear-gradient(160deg, #0f1f3d 0%, #1a3a6b 60%, #0f3460 100%)",
        }}
      >
        <div>
          <img
            src={logoImage}
            alt="MAJR Books"
            className="h-14 w-auto object-contain mb-10 brightness-0 invert"
          />

          {/* Step progress pills */}
          <div className="flex gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i < step ? "bg-green-400 flex-1" : "bg-white/20 flex-1"
                )}
              />
            ))}
          </div>

          <div className="mb-8">
            <p className="text-xs text-white/60 uppercase tracking-widest mb-2">
              Step {step} of {TOTAL_STEPS}
            </p>
            <h2 className="text-3xl font-bold leading-snug mb-3">
              {leftPanelContent.title}
            </h2>
            <p className="text-white/70 text-base">{leftPanelContent.subtitle}</p>
          </div>

          <div className="space-y-4">
            {leftPanelContent.bullets.map((bullet, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-white/80 text-sm">{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs">
          © {new Date().getFullYear()} MAJR Books. All rights reserved.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-4 border-b">
          <div className="flex items-center gap-3">
            <img
              src={logoImage}
              alt="MAJR Books"
              className="h-8 w-auto object-contain lg:hidden"
            />
            <div className="hidden lg:block">
              <p className="text-sm font-medium">Setting up your account</p>
              <p className="text-xs text-muted-foreground">
                Step {step} of {TOTAL_STEPS}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32 hidden sm:block">
              <Progress value={progress} className="h-2" />
            </div>
            <button
              onClick={skipOnboarding}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip setup
            </button>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-xl space-y-6">

            {/* ── STEP 1: Welcome ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="text-6xl mb-2">👋</div>
                  <h1 className="text-3xl font-bold">Welcome, {firstName}!</h1>
                  <p className="text-muted-foreground text-lg">
                    Your MAJR Books account is ready. Let's take 2 minutes to
                    personalize your experience so your bookkeeper knows exactly
                    how to help you.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Receipt className="h-5 w-5" />, label: "Invoice tracking" },
                    { icon: <BarChart3 className="h-5 w-5" />, label: "P&L reports" },
                    { icon: <Bot className="h-5 w-5" />, label: "AI assistant" },
                    { icon: <DollarSign className="h-5 w-5" />, label: "Tax prep" },
                    { icon: <FileText className="h-5 w-5" />, label: "Expense tracking" },
                    { icon: <Users className="h-5 w-5" />, label: "Bookkeeper access" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border"
                    >
                      <div className="text-primary">{item.icon}</div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-center text-muted-foreground">
                    This setup takes <strong>~2 minutes</strong>. You can always
                    update these details later in Settings.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 2: Business Profile ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold">Your Business</h2>
                  <p className="text-muted-foreground mt-1">
                    Basic info so your bookkeeper can set up the right accounts.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-name">
                      Business Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="biz-name"
                      placeholder="e.g. Sunrise Consulting LLC"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Business Type <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "sole_prop", label: "Sole Proprietor", icon: <Briefcase className="h-4 w-4" /> },
                        { value: "llc", label: "LLC", icon: <Building2 className="h-4 w-4" /> },
                        { value: "s_corp", label: "S-Corp", icon: <Layers className="h-4 w-4" /> },
                        { value: "partnership", label: "Partnership", icon: <Users className="h-4 w-4" /> },
                        { value: "c_corp", label: "C-Corp", icon: <Building2 className="h-4 w-4" /> },
                        { value: "nonprofit", label: "Nonprofit", icon: <Target className="h-4 w-4" /> },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBusinessType(opt.value)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all",
                            businessType === opt.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/40"
                          )}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="industry">Industry</Label>
                      <select
                        id="industry"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select industry…</option>
                        {[
                          "Retail", "Restaurant / Food Service", "Healthcare",
                          "Real Estate", "Construction", "Technology",
                          "Professional Services", "Transportation",
                          "Beauty & Wellness", "Education", "Finance",
                          "Entertainment", "Other",
                        ].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="state">State</Label>
                      <select
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select state…</option>
                        {[
                          "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
                          "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
                          "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
                          "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
                          "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
                        ].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Business Phone (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Bookkeeping Status ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold">Current Bookkeeping Status</h2>
                  <p className="text-muted-foreground mt-1">
                    This helps us understand where you're starting from.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      value: "current",
                      label: "All caught up",
                      description: "Books are up to date within the last 30 days",
                      icon: <CheckCircle2 className="h-5 w-5" />,
                    },
                    {
                      value: "slightly_behind",
                      label: "Slightly behind (1–3 months)",
                      description: "A few months of transactions to catch up on",
                      icon: <Clock className="h-5 w-5" />,
                    },
                    {
                      value: "very_behind",
                      label: "Very behind (3–12 months)",
                      description: "Need a significant catch-up",
                      icon: <Clock className="h-5 w-5" />,
                    },
                    {
                      value: "starting_fresh",
                      label: "Starting fresh — new business",
                      description: "Just launched, building from scratch",
                      icon: <Sparkles className="h-5 w-5" />,
                    },
                    {
                      value: "messy",
                      label: "It's a mess — need major cleanup",
                      description: "Mixed accounts, missing records, need full clean-up",
                      icon: <BookOpen className="h-5 w-5" />,
                    },
                  ].map((opt) => (
                    <OptionButton
                      key={opt.value}
                      icon={opt.icon}
                      label={opt.label}
                      description={opt.description}
                      selected={bookkeepingStatus === opt.value}
                      onClick={() => setBookkeepingStatus(opt.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: Primary Goals ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold">What are your main goals?</h2>
                  <p className="text-muted-foreground mt-1">
                    Select all that apply — we'll customize your portal accordingly.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      value: "track_expenses",
                      label: "Track income & expenses",
                      description: "Know exactly where every dollar goes",
                      icon: <DollarSign className="h-5 w-5" />,
                    },
                    {
                      value: "tax_prep",
                      label: "Stay ready for tax season",
                      description: "No scrambling in April — always prepared",
                      icon: <FileText className="h-5 w-5" />,
                    },
                    {
                      value: "invoicing",
                      label: "Send invoices & get paid faster",
                      description: "Professional invoices and payment tracking",
                      icon: <Receipt className="h-5 w-5" />,
                    },
                    {
                      value: "reports",
                      label: "Understand my P&L and cash flow",
                      description: "Monthly financial reports and insights",
                      icon: <BarChart3 className="h-5 w-5" />,
                    },
                    {
                      value: "payroll",
                      label: "Manage payroll",
                      description: "Employees, contractors, and 1099s",
                      icon: <Users className="h-5 w-5" />,
                    },
                    {
                      value: "grow",
                      label: "Plan for growth",
                      description: "Budgeting, forecasting, and financial strategy",
                      icon: <Target className="h-5 w-5" />,
                    },
                  ].map((opt) => (
                    <OptionButton
                      key={opt.value}
                      icon={opt.icon}
                      label={opt.label}
                      description={opt.description}
                      selected={primaryGoals.includes(opt.value)}
                      onClick={() => toggleGoal(opt.value)}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Select at least one goal to continue
                </p>
              </div>
            )}

            {/* ── STEP 5: Feature Tour + Finish ── */}
            {step === 5 && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="text-5xl">🎉</div>
                  <h2 className="text-2xl font-bold">Your portal is ready!</h2>
                  <p className="text-muted-foreground">
                    Here's what you can do right away:
                  </p>
                </div>

                <div className="space-y-3">
                  <FeatureCard
                    icon={<Receipt className="h-5 w-5 text-primary" />}
                    title="View & Pay Invoices"
                    description="See all invoices from your bookkeeper and track payment status."
                  />
                  <FeatureCard
                    icon={<Bot className="h-5 w-5 text-primary" />}
                    title="AI Bookkeeping Assistant"
                    description="Get instant answers to bookkeeping questions and a health score."
                    badge="New"
                  />
                  <FeatureCard
                    icon={<BarChart3 className="h-5 w-5 text-primary" />}
                    title="Financial Reports"
                    description="Access your P&L, balance sheet, and cash flow any time."
                  />
                  <FeatureCard
                    icon={<FileText className="h-5 w-5 text-primary" />}
                    title="Import Bank Transactions"
                    description="Upload your bank statement (CSV or PDF) to sync your books."
                  />
                </div>

                {/* Summary card */}
                {(businessName || primaryGoals.length > 0) && (
                  <div className="bg-muted/40 border rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Your Profile Summary
                    </p>
                    {businessName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{businessName}</span>
                        {businessType && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {businessType.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                    )}
                    {primaryGoals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {primaryGoals.map((g) => (
                          <Badge key={g} variant="outline" className="text-xs capitalize">
                            {g.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {step < TOTAL_STEPS ? (
                <Button
                  onClick={handleNext}
                  disabled={!canAdvance()}
                  className="gap-1 min-w-[140px]"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={saving}
                  className="gap-2 min-w-[160px] bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    "Saving…"
                  ) : (
                    <>
                      <PartyPopper className="h-4 w-4" />
                      Go to My Portal
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOnboarding;
