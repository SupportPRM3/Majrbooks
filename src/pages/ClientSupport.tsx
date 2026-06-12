import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Loader2, RefreshCw, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "How do I import bank transactions?",
  "Where can I find my invoices?",
  "How do I reconcile my bank account?",
  "How do I add a new client?",
  "How do I run a profit & loss report?",
];

const KB = [
  {
    keywords: ["import", "bank", "transaction", "upload", "csv", "pdf", "statement"],
    answer: `**What I understand:** You want to import bank transactions into MajrBooks.\n\n**How to do it:**\n1. Go to **Bank Transactions** in the sidebar\n2. Click the **Import Transactions** button at the top right\n3. Upload your CSV or PDF bank statement\n4. Review the preview and confirm the import\n\n**Prevention tip:** Export your bank statement as CSV for the most accurate results — PDF parsing works but CSV is more reliable.`,
  },
  {
    keywords: ["invoice", "billing", "bill", "payment", "paid", "unpaid"],
    answer: `**What I understand:** You're looking for invoice information.\n\n**How to find it:**\n1. Click **Billing** in the left sidebar\n2. Select **Sales** or go directly to **Invoices**\n3. You can filter by status: Paid, Unpaid, Overdue\n\nTo create a new invoice, click **+ New** at the top of the sidebar.`,
  },
  {
    keywords: ["reconcile", "reconciliation", "bank reconcil", "match", "statement"],
    answer: `**What I understand:** You want to reconcile your bank account.\n\n**How to do it:**\n1. Go to **Work** → **Bank Reconciliation** in the sidebar\n2. Select the account and date range\n3. Match your bank statement transactions to recorded transactions\n4. Click **Complete Reconciliation** when balanced\n\n**Prevention tip:** Reconcile monthly to catch discrepancies early.`,
  },
  {
    keywords: ["add client", "new client", "create client", "client"],
    answer: `**What I understand:** You want to add a new client.\n\n**How to do it:**\n1. Go to **Clients** in the sidebar\n2. Click the **Add client** button (top right)\n3. Fill in the client's name, email, and contact details\n4. Click **Save**\n\nYou can also invite clients to their own portal via **Client Invitations**.`,
  },
  {
    keywords: ["profit", "loss", "p&l", "income statement", "revenue", "expense"],
    answer: `**What I understand:** You want to run a Profit & Loss report.\n\n**How to do it:**\n1. Click **Work** in the sidebar\n2. Go to **Reports** → **Profit & Loss**\n3. Select your date range\n4. Click **Generate Report**\n5. Use **Export** to download as PDF or CSV\n\n**Tip:** Run this monthly to track your business performance.`,
  },
  {
    keywords: ["payroll", "salary", "employee", "pay", "wages"],
    answer: `**What I understand:** You have a question about payroll.\n\n**How to access it:**\n1. Click **Work** in the sidebar\n2. Select **Payroll** from the submenu\n3. Set up employees under **Payroll Setup**\n4. Run payroll under **Payroll Runs**\n\nFor time tracking, use the **Time Dashboard** and **Timesheets** sections.`,
  },
  {
    keywords: ["report", "financial", "balance sheet", "cash flow", "ledger"],
    answer: `**What I understand:** You're looking for financial reports.\n\n**Available reports in MajrBooks:**\n1. Go to **Work** → **Reports** in the sidebar\n2. Choose from: Profit & Loss, Balance Sheet, Cash Flow, General Ledger, Trial Balance\n3. Set your date range and click **Generate**\n4. Export as PDF or CSV\n\nFor advanced reports, check **Standard Reports** for pre-built templates.`,
  },
  {
    keywords: ["tax", "schedule c", "1099", "return", "deduction"],
    answer: `**What I understand:** You have a tax-related question.\n\n**In MajrBooks you can:**\n1. Go to **Tax Returns** for managing tax filings\n2. Use **Schedule C Prep** for self-employment tax preparation\n3. Find **1099 History** under Work for contractor payments\n\n**Important:** MajrBooks helps organize your data but does not provide tax advice. Please consult a licensed tax professional for personalized guidance.`,
  },
  {
    keywords: ["settings", "account", "profile", "password", "email"],
    answer: `**What I understand:** You want to update your account settings.\n\n**How to do it:**\n1. Click **Settings** in the left sidebar\n2. Update your profile, business name, and contact info\n3. Change your password under the Security section\n\nFor client portal settings, use **Client Settings** instead.`,
  },
  {
    keywords: ["trial", "subscription", "plan", "billing", "upgrade", "price"],
    answer: `**What I understand:** You have a question about your subscription.\n\nMajrBooks offers a **14-day free trial** with full access to all features. After the trial, you can choose a plan that fits your practice size.\n\nFor billing questions or to upgrade your plan, please contact us at **support@prm3tax.com** or call **888-575-4776**.`,
  },
];

const FALLBACK = `Thanks for reaching out! I'm not sure I have a specific answer for that, but I'm here to help.\n\nFor the best assistance, please contact our support team:\n- **Email:** support@prm3tax.com\n- **Phone:** 888-575-4776\n\nOr try rephrasing your question — I can help with invoices, transactions, reconciliation, reports, payroll, and more.`;

function getAnswer(text: string): string {
  const lower = text.toLowerCase();
  for (const entry of KB) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return entry.answer;
    }
  }
  return FALLBACK;
}

const ClientSupport = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const reply = getAnswer(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setLoading(false);
      textareaRef.current?.focus();
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatMessage = (text: string) => {
    return text.split("\n").map((line, i) => {
      const html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return (
        <p
          key={i}
          className={cn("leading-relaxed", line === "" ? "mt-2" : "")}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              MajrBooks Support
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Ask anything about the software — I'm here to help.
            </p>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { setMessages([]); setInput(""); }} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              New chat
            </Button>
          )}
        </div>

        <Card className="flex flex-col" style={{ height: "calc(100vh - 260px)", minHeight: 400 }}>
          <ScrollArea className="flex-1 px-4 pt-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-6">
                <div className="bg-primary/10 p-5 rounded-full">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">How can I help you today?</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Ask me anything about MajrBooks features, billing, or bookkeeping.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs bg-muted hover:bg-muted/80 border rounded-full px-3 py-1.5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="bg-primary/10 p-1.5 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm space-y-0.5",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    )}>
                      {formatMessage(msg.content)}
                    </div>
                    {msg.role === "user" && (
                      <div className="bg-secondary p-1.5 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="bg-primary/10 p-1.5 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-3 flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question… (Enter to send, Shift+Enter for new line)"
              className="resize-none text-sm min-h-[44px] max-h-32"
              rows={1}
              disabled={loading}
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 h-11 w-11"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Need to speak with a human? Our team is ready to help.
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:support@prm3tax.com" className="gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="tel:888-575-4776" className="gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  888-575-4776
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientSupport;
