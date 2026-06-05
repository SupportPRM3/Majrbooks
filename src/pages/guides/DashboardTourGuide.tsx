import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Play,
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  Clock,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Briefcase,
  Building2,
  HelpCircle,
  ChevronRight,
  Monitor,
  Sidebar,
  PanelLeft,
  Home
} from "lucide-react";

const DashboardTourGuide = () => {
  const navigate = useNavigate();

  const dashboardSections = [
    {
      id: 1,
      title: "Navigation Sidebar",
      icon: PanelLeft,
      description: "Your command center for accessing all MAJR Books features",
      features: [
        { name: "Dashboard", icon: Home, desc: "Quick overview of your business health" },
        { name: "Clients", icon: Users, desc: "Manage all your client accounts" },
        { name: "Invoices", icon: FileText, desc: "Create, send, and track invoices" },
        { name: "Expenses", icon: Receipt, desc: "Track and categorize expenses" },
        { name: "Payroll", icon: CreditCard, desc: "Manage employee payroll" },
        { name: "Reports", icon: BarChart3, desc: "Generate financial reports" },
        { name: "Settings", icon: Settings, desc: "Configure your preferences" },
      ],
      tips: [
        "Click any menu item to navigate directly",
        "Collapse the sidebar for more workspace",
        "Use keyboard shortcuts for quick access"
      ]
    },
    {
      id: 2,
      title: "Top Header Bar",
      icon: Monitor,
      description: "Quick access to search, notifications, and account settings",
      features: [
        { name: "Search", icon: Search, desc: "Find clients, invoices, or transactions instantly" },
        { name: "Notifications", icon: Bell, desc: "Stay updated on important alerts" },
        { name: "Account Menu", icon: Users, desc: "Access profile and logout" },
      ],
      tips: [
        "Use Cmd/Ctrl + K for quick search",
        "Red badge indicates unread notifications",
        "Click your avatar for account options"
      ]
    },
    {
      id: 3,
      title: "Financial KPIs Overview",
      icon: TrendingUp,
      description: "At-a-glance metrics showing your business performance",
      features: [
        { name: "Total Revenue", icon: DollarSign, desc: "Current month vs. previous month" },
        { name: "Total Expenses", icon: Receipt, desc: "Track spending with % change" },
        { name: "Net Profit", icon: TrendingUp, desc: "Profit margin and trends" },
        { name: "Cash Runway", icon: Clock, desc: "Months of operating cash available" },
      ],
      tips: [
        "Green arrows indicate positive growth",
        "Click any metric for detailed breakdown",
        "Compare month-over-month performance"
      ]
    },
    {
      id: 4,
      title: "Cashflow Snapshot",
      icon: BarChart3,
      description: "Visual representation of money flowing in and out",
      features: [
        { name: "Bank Balances", icon: Building2, desc: "Total across all linked accounts" },
        { name: "Upcoming Inflows", icon: TrendingUp, desc: "Expected income from invoices" },
        { name: "Upcoming Outflows", icon: Receipt, desc: "Bills and payroll due" },
        { name: "30-Day Projection", icon: Calendar, desc: "Cash position forecast" },
      ],
      tips: [
        "Hover over chart points for details",
        "Green represents inflows, red outflows",
        "Adjust date range for different views"
      ]
    },
    {
      id: 5,
      title: "Alerts Center",
      icon: AlertTriangle,
      description: "Real-time notifications requiring your attention",
      features: [
        { name: "Overdue Invoices", icon: FileText, desc: "Invoices past payment date" },
        { name: "Bank Sync Errors", icon: Building2, desc: "Connection issues to resolve" },
        { name: "Tax Deadlines", icon: Calendar, desc: "Upcoming filing requirements" },
        { name: "Low Balance Warnings", icon: DollarSign, desc: "Accounts below threshold" },
      ],
      tips: [
        "Click alerts to take immediate action",
        "Dismiss alerts once resolved",
        "Configure alert preferences in Settings"
      ]
    },
    {
      id: 6,
      title: "Tasks Due Soon",
      icon: CheckCircle,
      description: "Prioritized list of upcoming bookkeeping tasks",
      features: [
        { name: "Today's Tasks", icon: Clock, desc: "Urgent items needing attention" },
        { name: "This Week", icon: Calendar, desc: "Tasks due within 7 days" },
        { name: "Quick Actions", icon: ChevronRight, desc: "Complete tasks directly" },
        { name: "Categories", icon: Briefcase, desc: "Filter by task type" },
      ],
      tips: [
        "Color-coded by urgency level",
        "Check off tasks as completed",
        "Create recurring tasks for routine work"
      ]
    },
    {
      id: 7,
      title: "Client Overview Table",
      icon: Users,
      description: "Comprehensive view of all client statuses and actions",
      features: [
        { name: "Banking Status", icon: Building2, desc: "Connected account health" },
        { name: "Payroll Alerts", icon: AlertTriangle, desc: "Pending payroll items" },
        { name: "Tax Prep Status", icon: Receipt, desc: "Preparation progress" },
        { name: "Quick Actions", icon: Settings, desc: "View, edit, or archive clients" },
      ],
      tips: [
        "Click column headers to sort",
        "Use filters to find specific clients",
        "Assign lead accountants directly"
      ]
    }
  ];

  const keyboardShortcuts = [
    { key: "Cmd/Ctrl + K", action: "Open quick search" },
    { key: "Cmd/Ctrl + N", action: "Create new invoice" },
    { key: "Cmd/Ctrl + /", action: "Show all shortcuts" },
    { key: "Esc", action: "Close dialogs/modals" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header navigate={navigate} />

      <main className="pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-5xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <span 
              className="hover:text-foreground cursor-pointer"
              onClick={() => navigate("/resources")}
            >
              Resources
            </span>
            <ChevronRight className="h-4 w-4" />
            <span 
              className="hover:text-foreground cursor-pointer"
              onClick={() => navigate("/resources")}
            >
              Videos
            </span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Dashboard Tour</span>
          </nav>

          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/resources")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Button>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            {/* Video Thumbnail Placeholder */}
            <div className="relative bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 rounded-xl h-64 md:h-80 flex items-center justify-center mb-8 overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
              <div className="relative z-10 text-center">
                <div className="bg-primary rounded-full p-6 mb-4 mx-auto w-fit shadow-lg hover:scale-110 transition-transform cursor-pointer">
                  <Play className="h-12 w-12 text-primary-foreground fill-primary-foreground" />
                </div>
                <p className="text-lg font-medium">Watch Full Video Tour (8:45)</p>
              </div>
              <div className="absolute bottom-4 right-4 bg-background/90 px-3 py-1 rounded text-sm font-medium">
                8:45
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="secondary">Video Tutorial</Badge>
              <Badge variant="outline">Beginner</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                8 min 45 sec
              </span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">24.5k views</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Dashboard Tour: Complete Walkthrough
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Get a complete walkthrough of the MAJR Books dashboard. Learn where everything is 
              and how to navigate efficiently. Master every feature to streamline your bookkeeping workflow.
            </p>
          </motion.div>

          {/* Dashboard Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6 mb-12"
          >
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              Dashboard Components
            </h2>
            <p className="text-muted-foreground">
              The MAJR Books dashboard is designed to give you a complete picture of your business 
              finances at a glance. Here's a breakdown of each component:
            </p>

            <div className="space-y-6">
              {dashboardSections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <section.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              Section {section.id}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">{section.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {section.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Features */}
                        <div>
                          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                            Key Features
                          </h4>
                          <div className="space-y-3">
                            {section.features.map((feature, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <div className="bg-primary/5 p-2 rounded">
                                  <feature.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{feature.name}</p>
                                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tips */}
                        <div>
                          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                            Pro Tips
                          </h4>
                          <div className="space-y-2">
                            {section.tips.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Keyboard Shortcuts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Keyboard Shortcuts
                </CardTitle>
                <CardDescription>
                  Speed up your workflow with these essential shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {keyboardShortcuts.map((shortcut, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">{shortcut.action}</span>
                      <kbd className="px-3 py-1 bg-background border rounded text-xs font-mono">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-12"
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Ready to explore?</h3>
                    <p className="text-muted-foreground">
                      Jump into your dashboard and start putting this knowledge into action.
                    </p>
                  </div>
                  <Button onClick={() => navigate("/dashboard")} size="lg">
                    <LayoutDashboard className="h-5 w-5 mr-2" />
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <HelpCircle className="h-5 w-5" />
              <span>Need help?</span>
              <Button variant="link" className="p-0 h-auto">
                Contact Support
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DashboardTourGuide;
