import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Receipt,
  BarChart3,
  UsersRound,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  FileSpreadsheet,
  ShieldCheck,
  Search,
  MessageCircle,
  BookOpen,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  icon: any;
  badge?: string;
  description: string;
  steps: { heading: string; detail: string }[];
  tips?: string[];
}

const modules: Module[] = [
  {
    id: "overview",
    title: "Dashboard Overview",
    icon: LayoutDashboard,
    description: "Understand the layout and navigate MajrBooks confidently from day one.",
    steps: [
      {
        heading: "Sidebar — Your Practice",
        detail: 'The left sidebar is divided into two sections. "Your Practice" at the top contains your main navigation: Clients, Billing, Tax Returns, Work, Team, and Settings.',
      },
      {
        heading: "Sidebar — Your Books",
        detail: 'Below "Your Practice" is "Your Books" — a customizable shortcut list of frequently used features like Transactions, Sales, Reports, and Payroll. You can reorder items by clicking the pencil icon, then drag rows up or down. Hide items you do not use with the eye icon.',
      },
      {
        heading: "Collapse the sidebar",
        detail: "Click the arrow icon at the top of the sidebar to collapse it to icon-only mode, giving you more screen space. Hover over any icon to see its label.",
      },
      {
        heading: "Top search bar",
        detail: "The search bar at the top of every page lets you quickly jump to transactions, contacts, reports, and more without navigating through menus.",
      },
      {
        heading: "The + New button",
        detail: 'The green "+ New" button in the sidebar opens a quick-create menu. From here you can instantly create a Client, Invoice, Expense, Estimate, Proposal, Bill, Vendor, and more.',
      },
    ],
    tips: [
      "Use the + New button for the fastest way to create any record.",
      "The search bar works across all modules — try searching a client name.",
    ],
  },
  {
    id: "clients",
    title: "Managing Clients",
    icon: Users,
    description: "Add clients, manage their profiles, and invite them to their own portal.",
    steps: [
      {
        heading: "Go to Clients",
        detail: 'Click "Clients" in the Your Practice section of the sidebar to see all your clients in one place.',
      },
      {
        heading: "Add a new client",
        detail: 'Click "+ New" in the sidebar and select "Client", or use the Add Client button on the Clients page. Fill in the client\'s name, email, phone number, and business details, then click Save.',
      },
      {
        heading: "View a client record",
        detail: "Click any client row to open their full profile. From here you can see their invoices, balances, contact info, and notes.",
      },
      {
        heading: "Invite a client to their portal",
        detail: 'Go to "Client Invitations" in the sidebar. Enter the client\'s email and click Send Invitation. They will receive a link to create their own login and view their invoices, documents, and messages.',
      },
      {
        heading: "Bookkeeping tab",
        detail: 'Click the "Bookkeeping" tab on the Clients page to see a books review column for each client, showing the status of their bookkeeping.',
      },
      {
        heading: "Payroll tab",
        detail: 'Click the "Payroll" tab on the Clients page to see each client\'s next pay date, setup status, and upcoming tax payment and filing deadlines.',
      },
      {
        heading: "Multi-entity tab",
        detail: 'Click the "Multi-entity" tab to manage clients who operate under multiple business entities from a single view.',
      },
    ],
    tips: [
      "Keep client emails up to date so invoice notifications reach them automatically.",
      "Client portal invitations can be resent from the Client Invitations page.",
    ],
  },
  {
    id: "billing",
    title: "Billing & Invoices",
    icon: Receipt,
    badge: "Sales",
    description: "Create invoices, track payments, and manage recurring billing.",
    steps: [
      {
        heading: "Open Billing",
        detail: 'Click "Billing" in the sidebar. The submenu includes Client Subscriptions, Product Recommendations, Firm Subscriptions, Billing Details, and Revenue Share.',
      },
      {
        heading: "Create an invoice",
        detail: 'Click "+ New" then Invoice. Select the client, add line items with descriptions and amounts, set a due date, and click Save. The invoice is saved as a draft until you send it.',
      },
      {
        heading: "Send an invoice",
        detail: 'Open the invoice, review it, then click "Send". The client receives an email with a link to view and pay the invoice online.',
      },
      {
        heading: "Track payment status",
        detail: 'On the Invoices list page, filter by Status: Paid, Unpaid, or Overdue. You can record a manual payment by opening the invoice and clicking "Record Payment".',
      },
      {
        heading: "Set up recurring templates",
        detail: 'Click "+ New" then Recurring Template. Define the billing interval (weekly, monthly, yearly), amount, and client. MajrBooks will auto-generate invoices on schedule.',
      },
    ],
    tips: [
      "Overdue invoices show in red on the invoice list — address these first.",
      "Recurring templates save time for retainer clients billed on a fixed schedule.",
    ],
  },
  {
    id: "transactions",
    title: "Bank Transactions",
    icon: DollarSign,
    description: "Import, categorize, and reconcile your bank transactions.",
    steps: [
      {
        heading: "Navigate to Transactions",
        detail: 'In the Your Books section of the sidebar, click "Transactions". This shows your imported bank activity.',
      },
      {
        heading: "Import a bank statement",
        detail: 'Click "Import Transactions" at the top right of the Transactions page. Upload a CSV or PDF bank statement. Review the column mapping in the preview and confirm the import.',
      },
      {
        heading: "Categorize transactions",
        detail: "Each imported transaction needs a category (e.g. Office Supplies, Payroll, Rent). Click on a transaction row and select the appropriate category from the dropdown. MajrBooks learns your patterns over time.",
      },
      {
        heading: "Reconcile your bank account",
        detail: 'Go to Work then Bank Reconciliation. Select the account and the statement end date. Match each bank statement line to a recorded transaction. When your difference is $0.00, click "Complete Reconciliation".',
      },
    ],
    tips: [
      "CSV exports from your bank are more accurate than PDF imports — use CSV when available.",
      "Reconcile every month to catch discrepancies before they compound.",
    ],
  },
  {
    id: "reports",
    title: "Reports & Financials",
    icon: BarChart3,
    description: "Generate Profit & Loss, Balance Sheet, Cash Flow, and more.",
    steps: [
      {
        heading: "Access Reports",
        detail: 'Click "Reports" in the Your Books sidebar section, or go to Work then Reports from the main navigation.',
      },
      {
        heading: "Profit & Loss report",
        detail: 'Select "Profit & Loss" from the report list. Choose a date range (e.g. this quarter or last year) and click "Generate Report". This shows income minus expenses for the period.',
      },
      {
        heading: "Balance Sheet",
        detail: "The Balance Sheet shows your assets, liabilities, and equity at a specific point in time. Set a date and click Generate.",
      },
      {
        heading: "Cash Flow Statement",
        detail: "The Cash Flow report tracks actual money in and out — separate from accrual-based income. Useful for understanding liquidity.",
      },
      {
        heading: "Export a report",
        detail: 'After generating any report, click "Export" to download it as a PDF or CSV file. PDF is best for sharing with clients; CSV is best for further analysis in a spreadsheet.',
      },
    ],
    tips: [
      "Run a P&L at the end of each month to stay on top of profitability.",
      "The General Ledger report shows every transaction by account — useful for deep audits.",
    ],
  },
  {
    id: "payroll",
    title: "Payroll",
    icon: UsersRound,
    description: "Set up employees, run payroll, and track time.",
    steps: [
      {
        heading: "Open Payroll Setup",
        detail: 'Click "Payroll" in the Your Books section. First-time users should start with "Payroll Setup" to enter company payroll settings and add employees.',
      },
      {
        heading: "Add an employee",
        detail: 'In Payroll Setup, click "Add Employee". Enter their name, pay rate, pay type (hourly or salary), tax information, and direct deposit details.',
      },
      {
        heading: "Run payroll",
        detail: 'Go to "Payroll Runs" and click "Start New Run". Select the pay period, review hours for hourly employees, confirm deductions, and click "Process Payroll".',
      },
      {
        heading: "Time tracking",
        detail: 'Use the "Time Dashboard" to see hours logged across all employees. Go to "Timesheets" to enter or approve time entries. Hours flow automatically into payroll runs.',
      },
      {
        heading: "PTO management",
        detail: 'Click "PTO" in the sidebar to view and manage employee paid time off balances. You can approve or deny requests directly from this page.',
      },
    ],
    tips: [
      "Set up payroll schedules once and MajrBooks will remind you when it is time to run.",
      "Review timesheets before running payroll to avoid corrections after the fact.",
    ],
  },
  {
    id: "tax",
    title: "Tax Returns & Schedule C",
    icon: FileSpreadsheet,
    description: "Organize tax filings, prepare Schedule C, and access 1099 history.",
    steps: [
      {
        heading: "Open Tax Returns",
        detail: 'Click "Tax Returns" in the Your Practice sidebar section. This page lists all tax filings organized by client and year.',
      },
      {
        heading: "Create a new tax return",
        detail: 'Click "+ New Tax Return". Select the client, tax year, and filing type. MajrBooks pulls in relevant financial data automatically from the client\'s books.',
      },
      {
        heading: "Schedule C Preparation",
        detail: 'Click "Schedule C Prep" in the sidebar. Select a client and tax year. MajrBooks compiles self-employment income and deductions from their transaction history into Schedule C format.',
      },
      {
        heading: "1099 History",
        detail: "Go to Work then 1099 History to view all contractor payments made during the year. Use this data to issue 1099-NEC forms to contractors paid $600 or more.",
      },
    ],
    tips: [
      "MajrBooks organizes data — always have a licensed tax professional review returns before filing.",
      "Run the P&L report alongside Schedule C Prep to cross-check figures.",
    ],
  },
  {
    id: "team",
    title: "Team & Permissions",
    icon: ShieldCheck,
    description: "Add team members and control what each person can access.",
    steps: [
      {
        heading: "Open Team",
        detail: 'Click "Team" in the Your Practice sidebar section to see all staff members with access to your firm\'s MajrBooks account.',
      },
      {
        heading: "Invite a team member",
        detail: 'Click "Invite Team Member". Enter their email and select their role (Admin, Accountant, or Viewer). They receive an email invitation to set up their login.',
      },
      {
        heading: "Set permissions",
        detail: 'Go to "User Permissions" in the sidebar. For each team member, toggle on or off access to specific modules: Payroll, Tax Returns, Billing, Reports, etc.',
      },
      {
        heading: "Remove a team member",
        detail: 'Open the team member\'s record and click "Revoke Access". This immediately removes their ability to log in without deleting any data they created.',
      },
    ],
    tips: [
      "Use the Viewer role for clients or stakeholders who should see data but not edit it.",
      "Regularly audit user permissions, especially after staff changes.",
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "Configure your firm profile, business details, and preferences.",
    steps: [
      {
        heading: "Open Settings",
        detail: 'Click "Settings" at the bottom of the Your Practice sidebar section.',
      },
      {
        heading: "Update your firm profile",
        detail: "Under the Profile tab, update your firm's name, logo, address, phone number, and email. This information appears on invoices and client-facing documents.",
      },
      {
        heading: "Change your password",
        detail: "Go to the Security section within Settings. Enter your current password and then your new password twice to confirm the change.",
      },
      {
        heading: "Notification preferences",
        detail: "Under Notifications, choose which events trigger email alerts — new client messages, overdue invoices, payroll reminders, and more.",
      },
    ],
    tips: [
      "Upload your firm logo so it appears on all invoices you send to clients.",
      "Keep your contact email current so clients can reach you through the platform.",
    ],
  },
  {
    id: "support",
    title: "Getting Help",
    icon: MessageCircle,
    description: "Use AI Support or contact the MajrBooks team directly.",
    steps: [
      {
        heading: "AI Support chat",
        detail: 'Click "AI Support" (or "Support" in the client portal) in the sidebar. Type your question and the assistant will guide you through the most common tasks, errors, and features.',
      },
      {
        heading: "Suggested questions",
        detail: 'When the chat is empty, you will see suggested questions like "How do I import bank transactions?" — click any to get an instant answer.',
      },
      {
        heading: "Contact the support team",
        detail: 'At the bottom of the Support page, click "Email" to send a message to support@prm3tax.com, or click the phone number to call the MajrBooks support team directly.',
      },
    ],
    tips: [
      "The AI Support chat works instantly — no waiting — and covers the most common tasks.",
      "For complex issues or billing questions, calling the support line is the fastest option.",
    ],
  },
];

const TrainingCard = ({ module, isOpen, onToggle }: { module: Module; isOpen: boolean; onToggle: () => void }) => {
  const Icon = module.icon;
  return (
    <Card className={cn("overflow-hidden transition-shadow", isOpen && "shadow-md ring-1 ring-primary/20")}>
      <button className="w-full text-left" onClick={onToggle}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", isOpen ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{module.title}</CardTitle>
                {module.badge && <Badge variant="secondary" className="text-xs">{module.badge}</Badge>}
              </div>
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-11">{module.description}</p>
        </CardHeader>
      </button>

      {isOpen && (
        <CardContent className="pt-0 pb-5">
          <div className="ml-11 space-y-4">
            <div className="space-y-3">
              {module.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-snug">{step.heading}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            {module.tips && module.tips.length > 0 && (
              <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Pro Tips</p>
                {module.tips.map((tip, i) => (
                  <div key={i} className="flex gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/80 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const Training = () => {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(["overview"]));
  const [search, setSearch] = useState("");

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = search.trim()
    ? modules.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.description.toLowerCase().includes(search.toLowerCase()) ||
          m.steps.some(
            (s) =>
              s.heading.toLowerCase().includes(search.toLowerCase()) ||
              s.detail.toLowerCase().includes(search.toLowerCase())
          )
      )
    : modules;

  return (
    <Layout>
      <div className="w-full max-w-3xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Training Guide
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Step-by-step instructions for every feature in MajrBooks.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setOpenModules(new Set(modules.map((m) => m.id)))} className="text-xs text-primary hover:underline">
              Expand all
            </button>
            <span className="text-muted-foreground text-xs">·</span>
            <button onClick={() => setOpenModules(new Set())} className="text-xs text-muted-foreground hover:underline">
              Collapse all
            </button>
          </div>
        </div>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-sm">New to MajrBooks? Start here.</p>
              <p className="text-xs opacity-80 mt-0.5">
                Follow the modules below in order for the smoothest onboarding experience.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium opacity-90 flex-shrink-0">
              <span>Dashboard</span>
              <ArrowRight className="h-3 w-3" />
              <span>Clients</span>
              <ArrowRight className="h-3 w-3" />
              <span>Billing</span>
              <ArrowRight className="h-3 w-3" />
              <span>Reports</span>
            </div>
          </CardContent>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search training topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No training topics match your search.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((module) => (
              <TrainingCard
                key={module.id}
                module={module}
                isOpen={openModules.has(module.id)}
                onToggle={() => toggleModule(module.id)}
              />
            ))}
          </div>
        )}

        <Card className="bg-muted/30">
          <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Still have questions? Our team is happy to help.
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <a href="mailto:support@prm3tax.com" className="inline-flex items-center gap-1.5 text-xs border border-border rounded-md px-3 py-2 hover:bg-accent transition-colors">
                support@prm3tax.com
              </a>
              <a href="tel:888-575-4776" className="inline-flex items-center gap-1.5 text-xs border border-border rounded-md px-3 py-2 hover:bg-accent transition-colors">
                888-575-4776
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Training;
