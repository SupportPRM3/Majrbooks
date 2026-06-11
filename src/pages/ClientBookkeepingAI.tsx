import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  ChevronRight,
  MessageSquare,
  ClipboardList,
  Lightbulb,
  Shield,
  DollarSign,
  FileText,
  BarChart3,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// ─── Assessment Questions ─────────────────────────────────────────────────────

interface Question {
  id: number;
  category: string;
  text: string;
  options: { label: string; value: number; description?: string }[];
  icon: React.ReactNode;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Record Keeping",
    text: "How often do you record your income and expenses?",
    icon: <FileText className="h-5 w-5" />,
    options: [
      { label: "Daily or weekly", value: 10, description: "Best practice" },
      { label: "Monthly", value: 7 },
      { label: "Every few months", value: 3 },
      { label: "Rarely or never", value: 0 },
    ],
  },
  {
    id: 2,
    category: "Bank Reconciliation",
    text: "Do you reconcile your bank statements with your books?",
    icon: <BarChart3 className="h-5 w-5" />,
    options: [
      { label: "Yes, every month", value: 10 },
      { label: "Yes, occasionally", value: 5 },
      { label: "I'm not sure how", value: 2 },
      { label: "No, I don't do this", value: 0 },
    ],
  },
  {
    id: 3,
    category: "Business Banking",
    text: "Do you have a dedicated business bank account (separate from personal)?",
    icon: <DollarSign className="h-5 w-5" />,
    options: [
      { label: "Yes, fully separate", value: 10 },
      { label: "Mostly separate", value: 6 },
      { label: "Sometimes mixed", value: 3 },
      { label: "No, same account", value: 0 },
    ],
  },
  {
    id: 4,
    category: "Expense Tracking",
    text: "How do you track business receipts and expenses?",
    icon: <FileText className="h-5 w-5" />,
    options: [
      { label: "Accounting software / app", value: 10 },
      { label: "Spreadsheet", value: 7 },
      { label: "Paper receipts only", value: 3 },
      { label: "I don't track them", value: 0 },
    ],
  },
  {
    id: 5,
    category: "Timeliness",
    text: "How current are your financial records?",
    icon: <Clock className="h-5 w-5" />,
    options: [
      { label: "Up to date (within 30 days)", value: 10 },
      { label: "1–3 months behind", value: 6 },
      { label: "3–6 months behind", value: 2 },
      { label: "More than 6 months behind", value: 0 },
    ],
  },
  {
    id: 6,
    category: "Financial Review",
    text: "Do you review your Profit & Loss (P&L) statement regularly?",
    icon: <TrendingUp className="h-5 w-5" />,
    options: [
      { label: "Yes, monthly", value: 10 },
      { label: "Yes, quarterly", value: 7 },
      { label: "Occasionally", value: 3 },
      { label: "Never", value: 0 },
    ],
  },
  {
    id: 7,
    category: "Invoice Management",
    text: "How do you manage your invoices and accounts receivable?",
    icon: <FileText className="h-5 w-5" />,
    options: [
      { label: "Systematic — tracked and followed up", value: 10 },
      { label: "Basic tracking only", value: 6 },
      { label: "I only invoice sometimes", value: 2 },
      { label: "No system in place", value: 0 },
    ],
  },
  {
    id: 8,
    category: "Tax Planning",
    text: "Do you set aside money for taxes throughout the year?",
    icon: <Shield className="h-5 w-5" />,
    options: [
      { label: "Yes, every month / per payment", value: 10 },
      { label: "Occasionally", value: 5 },
      { label: "Only near tax time", value: 2 },
      { label: "No, it catches me off guard", value: 0 },
    ],
  },
  {
    id: 9,
    category: "Expense Categorization",
    text: "Do you categorize your business expenses (e.g., rent, marketing, payroll)?",
    icon: <ClipboardList className="h-5 w-5" />,
    options: [
      { label: "Yes, consistently", value: 10 },
      { label: "Mostly yes", value: 7 },
      { label: "Sometimes", value: 3 },
      { label: "No, not at all", value: 0 },
    ],
  },
  {
    id: 10,
    category: "Budgeting",
    text: "Do you have a business budget and compare actual spending to it?",
    icon: <BarChart3 className="h-5 w-5" />,
    options: [
      { label: "Yes — I review it regularly", value: 10 },
      { label: "I have a budget but rarely review", value: 5 },
      { label: "No formal budget", value: 2 },
      { label: "I have no idea where money goes", value: 0 },
    ],
  },
];

// ─── AI Chat ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const BOOKKEEPING_KB: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["reconcile", "reconciliation", "bank statement"],
    answer:
      "Bank reconciliation means matching your internal books with your bank statement to catch errors, fraud, or missing entries. You should do it every month — compare each transaction in your accounting software to the statement and mark them off. Any difference needs investigation.",
  },
  {
    keywords: ["expense", "category", "categorize", "write off", "deduction"],
    answer:
      "Common business expense categories include: Office & Rent, Marketing & Advertising, Software & Subscriptions, Travel & Meals (50% deductible), Payroll & Contractors, Utilities, and Professional Services. Always keep receipts for anything over $75 and document the business purpose.",
  },
  {
    keywords: ["invoice", "invoice payment", "accounts receivable"],
    answer:
      "Best practice for invoices: send them immediately after delivery, set clear payment terms (Net 15 or Net 30), follow up 3 days before due, and again 1 day after. Use MAJR Books to track status automatically — you can see paid, pending, and overdue invoices in My Invoices.",
  },
  {
    keywords: ["tax", "taxes", "estimated tax", "quarterly tax"],
    answer:
      "Self-employed business owners typically pay quarterly estimated taxes (April 15, June 15, September 15, January 15). Set aside 25–30% of net profit for federal taxes. Your bookkeeper can help you calculate quarterly estimates and minimize your tax bill through proper expense tracking.",
  },
  {
    keywords: ["profit", "loss", "p&l", "income statement"],
    answer:
      "Your Profit & Loss (P&L) report shows Revenue minus Expenses = Net Profit (or Loss). Review it monthly to understand trends. If expenses are growing faster than revenue, that's a warning sign. Your bookkeeper will generate this report for you — you can ask them for monthly P&L reviews.",
  },
  {
    keywords: ["cash flow", "cash"],
    answer:
      "Cash flow is the movement of money in and out of your business. You can be profitable on paper but still run out of cash! Tips: invoice promptly, collect faster, delay non-urgent payments, and keep a 2–3 month cash reserve. Review your cash flow report weekly if possible.",
  },
  {
    keywords: ["payroll", "employee", "contractor", "1099", "w-2"],
    answer:
      "For employees: withhold payroll taxes, pay employer FICA (7.65%), and issue W-2s by January 31. For contractors: no withholding, but issue a 1099-NEC if you paid them $600+ in a year. Misclassifying employees as contractors is a serious IRS issue — when in doubt, ask your bookkeeper.",
  },
  {
    keywords: ["budget", "budgeting", "forecast"],
    answer:
      "A budget helps you plan spending and avoid surprises. Start with last year's actual expenses, adjust for expected changes, then compare monthly actuals vs. budget. Even a simple spreadsheet budget is far better than none. MAJR Books can help you set financial planning goals.",
  },
  {
    keywords: ["separate", "business account", "personal", "commingling"],
    answer:
      "Mixing personal and business finances (called commingling) is one of the top bookkeeping mistakes. It makes tracking harder, can invalidate deductions, and may cause legal liability issues for LLCs. Open a dedicated business checking account and business credit card immediately if you haven't.",
  },
  {
    keywords: ["receipt", "receipts", "documentation"],
    answer:
      "Keep digital copies of all business receipts. The IRS requires documentation for deductions. Use a phone app to photograph receipts immediately, then upload them to your accounting system. The IRS can audit returns up to 3 years back (6 years if substantial income is underreported).",
  },
  {
    keywords: ["score", "result", "assessment", "health"],
    answer:
      "Your bookkeeping health score reflects 10 key areas: record keeping, bank reconciliation, business banking, expense tracking, timeliness, P&L review, invoice management, tax planning, expense categorization, and budgeting. Focus on any area scored below 7/10 for the biggest improvements.",
  },
  {
    keywords: ["help", "start", "begin", "how"],
    answer:
      "Great question! Start with these 3 steps: (1) Open a dedicated business bank account if you don't have one. (2) Choose an accounting method — MAJR Books helps you track everything in one place. (3) Set a recurring monthly date to update your books. Even 1 hour per month is enough to stay current. Want help with any specific area?",
  },
];

function getAIResponse(userText: string, score?: number): string {
  const lower = userText.toLowerCase();

  for (const entry of BOOKKEEPING_KB) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.answer;
    }
  }

  if (lower.includes("good") || lower.includes("great") || lower.includes("excellent")) {
    return "That's wonderful to hear! Keeping strong bookkeeping habits pays off at tax time and when you need financing. Is there any specific area you'd like to improve further?";
  }
  if (lower.includes("bad") || lower.includes("behind") || lower.includes("mess")) {
    return "Don't worry — even chaotic books can be organized. The key is starting somewhere. Pick the most recent month and work forward. Your MAJR Books bookkeeper can also do a catch-up cleanup for you. What area feels most overwhelming?";
  }

  if (score !== undefined && score < 50) {
    return "Based on your assessment score, I'd recommend starting with: (1) opening a separate business account, (2) recording expenses weekly, and (3) doing a monthly bank reconciliation. These three steps alone will dramatically improve your bookkeeping health. What would you like to tackle first?";
  }
  if (score !== undefined && score >= 50 && score < 75) {
    return "You have a solid foundation! To get to the next level, focus on consistent monthly reviews of your P&L and setting up quarterly tax savings. Would you like tips on either of those?";
  }

  return "Great question! As your bookkeeping AI assistant, I can help with topics like expense tracking, reconciliation, tax planning, invoicing, payroll, and budgeting. What would you like to know more about?";
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function getScoreLevel(pct: number) {
  if (pct >= 80) return { label: "Excellent", color: "text-green-600", bg: "bg-green-50 border-green-200", icon: <CheckCircle2 className="h-6 w-6 text-green-600" /> };
  if (pct >= 60) return { label: "On Track", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: <TrendingUp className="h-6 w-6 text-blue-600" /> };
  if (pct >= 40) return { label: "Needs Attention", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: <AlertCircle className="h-6 w-6 text-amber-600" /> };
  return { label: "Critical", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: <XCircle className="h-6 w-6 text-red-600" /> };
}

function getRecommendations(answers: Record<number, number>): { title: string; detail: string; priority: "high" | "medium" | "low" }[] {
  const recs: { title: string; detail: string; priority: "high" | "medium" | "low" }[] = [];

  if (answers[3] <= 3) recs.push({ title: "Open a business bank account", detail: "Separating finances is the #1 step. It protects you legally and makes tracking effortless.", priority: "high" });
  if (answers[1] <= 3) recs.push({ title: "Start recording weekly", detail: "Block 30 minutes every Friday to enter income and expenses. Consistency is more important than perfection.", priority: "high" });
  if (answers[2] <= 5) recs.push({ title: "Set up monthly reconciliation", detail: "Reconcile your bank each month to catch errors before they compound.", priority: "high" });
  if (answers[5] <= 3) recs.push({ title: "Review P&L monthly", detail: "Knowing your profit/loss each month lets you make smart business decisions.", priority: "medium" });
  if (answers[8] <= 2) recs.push({ title: "Tax savings account", detail: "Set aside 25–30% of each payment into a separate savings account for taxes.", priority: "high" });
  if (answers[6] <= 5) recs.push({ title: "Implement invoice follow-up", detail: "Use MAJR Books to send automatic reminders for overdue invoices.", priority: "medium" });
  if (answers[10] <= 2) recs.push({ title: "Create a business budget", detail: "Even a simple monthly budget helps you avoid overspending and plan for growth.", priority: "low" });
  if (answers[4] <= 3) recs.push({ title: "Upgrade expense tracking", detail: "Consider using accounting software to save hours each month and reduce errors.", priority: "medium" });

  return recs.slice(0, 5);
}

// ─── Component ────────────────────────────────────────────────────────────────

const ClientBookkeepingAI = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"intro" | "assessment" | "results" | "chat">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const maxScore = QUESTIONS.length * 10;
  const scorePct = Math.round((totalScore / maxScore) * 100);
  const level = getScoreLevel(scorePct);
  const recommendations = getRecommendations(answers);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleAnswer = (value: number) => {
    setSelected(value);
  };

  const handleNext = () => {
    if (selected === null) return;
    const q = QUESTIONS[currentQ];
    setAnswers((prev) => ({ ...prev, [q.id]: selected }));
    setSelected(null);
    if (currentQ + 1 < QUESTIONS.length) {
      setCurrentQ(currentQ + 1);
    } else {
      setPhase("results");
      // Seed the chat with results context
      const finalScore = { ...answers, [q.id]: selected };
      const total = Object.values(finalScore).reduce((a, b) => a + b, 0);
      const pct = Math.round((total / maxScore) * 100);
      const lvl = getScoreLevel(pct);
      setChatMessages([
        {
          id: "0",
          role: "assistant",
          text: `Your bookkeeping health score is **${pct}%** — rated **${lvl.label}**. I've reviewed your answers across 10 key areas. Ask me anything about your results, or any bookkeeping topic — I'm here to help! 🤖`,
        },
      ]);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", text: chatInput };
    const input = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);
    setTimeout(() => {
      const reply = getAIResponse(input, scorePct);
      setChatMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: reply }]);
      setChatLoading(false);
    }, 800);
  };

  const handleRestart = () => {
    setPhase("intro");
    setCurrentQ(0);
    setAnswers({});
    setSelected(null);
    setChatMessages([]);
    setChatInput("");
  };

  const question = QUESTIONS[currentQ];
  const progress = Math.round(((currentQ) / QUESTIONS.length) * 100);

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Bookkeeping Assistant</h1>
            <p className="text-muted-foreground text-sm">Assess your bookkeeping health and get personalized guidance</p>
          </div>
        </div>

        {/* ─── INTRO ─────────────────────────────────────────────────── */}
        {phase === "intro" && (
          <div className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="text-xl">Welcome, {firstName}!</CardTitle>
                <CardDescription className="text-base">
                  This 10-question assessment evaluates your bookkeeping health across key areas and gives you a personalized score with action steps.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { icon: <ClipboardList className="h-5 w-5 text-primary" />, label: "10 Questions" },
                    { icon: <Clock className="h-5 w-5 text-primary" />, label: "~3 Minutes" },
                    { icon: <Star className="h-5 w-5 text-primary" />, label: "Health Score" },
                    { icon: <Lightbulb className="h-5 w-5 text-primary" />, label: "Action Plan" },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-2 bg-white rounded-lg p-3 border border-primary/10 text-center">
                      {item.icon}
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                  <p className="font-semibold text-foreground">This assessment covers:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {QUESTIONS.map((q) => (
                      <div key={q.id} className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3 text-primary" />
                        <span>{q.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={() => setPhase("assessment")}>
                  Start Assessment
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Chat-only option */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-full">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Just have a question?</p>
                    <p className="text-sm text-muted-foreground">Skip the assessment and chat directly with the AI assistant.</p>
                  </div>
                  <Button variant="outline" onClick={() => {
                    setChatMessages([{ id: "0", role: "assistant", text: `Hi ${firstName}! I'm your bookkeeping AI assistant. Ask me anything about expense tracking, reconciliation, invoicing, taxes, payroll, or any other bookkeeping topic!` }]);
                    setPhase("chat");
                  }}>
                    Open Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── ASSESSMENT ────────────────────────────────────────────── */}
        {phase === "assessment" && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Question {currentQ + 1} of {QUESTIONS.length}</span>
                <span className="font-medium">{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
                  {question.icon}
                  <span>{question.category}</span>
                </div>
                <CardTitle className="text-lg leading-snug">{question.text}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {question.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border-2 transition-all duration-150",
                      selected === opt.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-4 w-4 rounded-full border-2 flex-shrink-0",
                        selected === opt.value ? "border-primary bg-primary" : "border-muted-foreground"
                      )} />
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        {opt.description && (
                          <span className="ml-2 text-xs text-primary font-medium">— {opt.description}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                <div className="flex gap-3 pt-2">
                  {currentQ > 0 && (
                    <Button variant="outline" onClick={() => { setCurrentQ(currentQ - 1); setSelected(null); }}>
                      Back
                    </Button>
                  )}
                  <Button className="flex-1" disabled={selected === null} onClick={handleNext}>
                    {currentQ + 1 === QUESTIONS.length ? "See My Results" : "Next Question"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── RESULTS ───────────────────────────────────────────────── */}
        {phase === "results" && (
          <div className="space-y-6">
            {/* Score card */}
            <Card className={cn("border-2", level.bg)}>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  {level.icon}
                  <div>
                    <p className="text-5xl font-bold">{scorePct}%</p>
                    <p className={cn("text-xl font-semibold mt-1", level.color)}>{level.label}</p>
                  </div>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {scorePct >= 80
                      ? "Your bookkeeping is in great shape! Keep up the disciplined habits."
                      : scorePct >= 60
                      ? "You have a solid base. A few targeted improvements will move you to excellent."
                      : scorePct >= 40
                      ? "There are some important gaps to address. Focus on the priorities below."
                      : "Your books need significant attention. Don't worry — start with the basics and build from there."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Category breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {QUESTIONS.map((q) => {
                  const val = answers[q.id] ?? 0;
                  const pct = val * 10;
                  const icon = pct >= 70
                    ? <TrendingUp className="h-4 w-4 text-green-500" />
                    : pct >= 40
                    ? <Minus className="h-4 w-4 text-amber-500" />
                    : <TrendingDown className="h-4 w-4 text-red-500" />;
                  return (
                    <div key={q.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {icon}
                          <span>{q.category}</span>
                        </div>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Your Action Plan
                  </CardTitle>
                  <CardDescription>Prioritized steps to improve your bookkeeping health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-lg bg-muted/40 border">
                      <div className={cn(
                        "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                        rec.priority === "high" ? "bg-red-100 text-red-700" :
                        rec.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{rec.title}</p>
                          <Badge variant="outline" className={cn("text-xs",
                            rec.priority === "high" ? "border-red-300 text-red-600" :
                            rec.priority === "medium" ? "border-amber-300 text-amber-600" : "border-blue-300 text-blue-600"
                          )}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{rec.detail}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={() => setPhase("chat")}>
                <Bot className="h-4 w-4 mr-2" />
                Ask the AI Assistant
              </Button>
              <Button variant="outline" onClick={handleRestart}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Assessment
              </Button>
            </div>
          </div>
        )}

        {/* ─── CHAT ──────────────────────────────────────────────────── */}
        {phase === "chat" && (
          <div className="space-y-4">
            {phase === "chat" && Object.keys(answers).length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setPhase("results")}>
                ← Back to Results
              </Button>
            )}

            <Card className="flex flex-col" style={{ height: "600px" }}>
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b bg-primary rounded-t-lg text-primary-foreground">
                <div className="bg-primary-foreground/20 p-2 rounded-full">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">MAJR Bookkeeping AI</p>
                  <p className="text-xs opacity-80">Ask anything about your bookkeeping</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs opacity-80">Online</span>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "assistant" && (
                        <div className="bg-primary/10 rounded-full p-1.5 mr-2 flex-shrink-0 self-end">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}>
                        {msg.text.split("**").map((part, i) =>
                          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-primary/10 rounded-full p-1.5 mr-2 self-end">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
              </ScrollArea>

              {/* Suggested questions */}
              <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {["How do I reconcile my bank?", "What should I track as expenses?", "How much to save for taxes?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setChatInput(q); }}
                    className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1 rounded-full border transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <Separator />

              {/* Input */}
              <div className="p-4 flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                  placeholder="Ask a bookkeeping question..."
                  className="flex-1"
                  disabled={chatLoading}
                />
                <Button onClick={handleSendChat} size="icon" disabled={!chatInput.trim() || chatLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              AI responses are for general educational purposes only. For advice specific to your situation, consult your MAJR Books bookkeeper or a licensed CPA.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientBookkeepingAI;
