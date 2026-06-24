import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hasAccessToModule } from "@/lib/subscriptionTiers";
import TrialExpiryModal from "@/components/TrialExpiryModal";
import UpgradeModal from "@/components/UpgradeModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  TrendingUp,
  LogOut,
  Users,
  UserPlus,
  Briefcase,
  UserCheck,
  ChevronRight,
  BarChart3,
  Bookmark,
  Menu,
  X,
  UserCircle,
  RotateCcw,
  DollarSign,
  RefreshCw,
  Wallet,
  CreditCard,
  FileSpreadsheet,
  Lightbulb,
  Plus,
  Building2,
  Settings,
  UsersRound,
  GripVertical,
  Edit2,
  Check,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  BarChart3 as BarChartIcon,
  ShieldCheck,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  HardDrive,
  Bot,
  MessageCircle,
  GraduationCap,
  BookOpen,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import majrLogo from "@/assets/logo-majr-books.jpg";
import NotificationBadge from "@/components/NotificationBadge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LayoutProps {
  children: ReactNode;
}

interface SubNavItem {
  path: string;
  label: string;
}

interface YourBooksItem {
  id: string;
  path: string;
  label: string;
  icon: any;
  hasChevron: boolean;
  visible?: boolean;
  module?: string;
  subItems?: SubNavItem[];
}

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: any;
  subItems?: SubNavItem[];
  isExternal?: boolean;

  module?: string;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

const SortableItem = ({
  item,
  isActive,
  isEditMode,
  onToggleVisibility,
  isExpanded,
  onToggleExpand,
}: {
  item: YourBooksItem;
  isActive: boolean;
  isEditMode: boolean;
  onToggleVisibility: (id: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const location = useLocation();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = item.icon;
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const innerContent = (
    <div className={cn(
      "flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors group",
      isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/50",
      isDragging && "shadow-lg ring-2 ring-primary",
      hasSubItems && "cursor-pointer"
    )}>
      <div className="flex items-center space-x-3 flex-1">
        {isEditMode && (
          <>
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleVisibility(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {item.visible !== false ? (
                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          </>
        )}
        <Icon className={cn("h-4 w-4", item.visible === false && "opacity-40")} />
        <span className={cn(item.visible === false && "opacity-40")}>{item.label}</span>
      </div>
      {item.hasChevron && (
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-90")} />
      )}
    </div>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {hasSubItems ? (
        <div onClick={() => onToggleExpand?.(item.id)}>
          {innerContent}
        </div>
      ) : (
        <Link to={item.path}>
          {innerContent}
        </Link>
      )}
      {hasSubItems && isExpanded && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/40 pl-3">
          {item.subItems!.map((sub) => (
            <Link key={sub.path + sub.label} to={sub.path}>
              <div className={cn(
                "px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer",
                location.pathname === sub.path
                  ? "bg-secondary text-secondary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}>
                {sub.label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Layout = ({ children }: LayoutProps) => {
  const { signOut, user, subscriptionTier, subscribed, isTrial, trialDaysRemaining, isAdmin, isClient, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [expandedNavItems, setExpandedNavItems] = useState<Record<string, boolean>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebarCollapsed', String(newValue));
      return newValue;
    });
  };

  const toggleNavItem = (id: string) => {
    setExpandedNavItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [profile, setProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  // ─── Your Books items (drag-and-drop bookmarks section) ───────────────────
  const defaultYourBooksItems: YourBooksItem[] = [
    { id: "client-overview", path: "/dashboard", label: "Client overview", icon: Users, hasChevron: false, module: "dashboard" },
    {
      id: "dashboards", path: "/financial-dashboard", label: "Dashboards", icon: LayoutDashboard, hasChevron: true, module: "dashboard",
      subItems: [
        { path: "/financial-dashboard", label: "Financial Dashboard" },
        { path: "/reports", label: "Reports Overview" },
        { path: "/standard-reports", label: "Standard Reports" },
      ],
    },
    { id: "tasks", path: "/tasks", label: "Tasks", icon: FileText, hasChevron: false, module: "tasks" },
    {
      id: "transactions", path: "/bank-transactions", label: "Transactions", icon: Receipt, hasChevron: true, module: "transactions",
      subItems: [
        { path: "/bank-transactions", label: "Bank Transactions" },
        { path: "/bank-reconciliation", label: "Reconciliation" },
        { path: "/journal-entries", label: "Journal Entries" },
        { path: "/chart-of-accounts", label: "Chart of Accounts" },
        { path: "/general-ledger", label: "General Ledger" },
      ],
    },
    {
      id: "sales", path: "/invoices", label: "Sales", icon: DollarSign, hasChevron: true, module: "invoices",
      subItems: [
        { path: "/invoices", label: "Invoices" },
        { path: "/invoice-templates", label: "Invoice Templates" },
        { path: "/invoice/new", label: "New Invoice" },
        { path: "/revenue-by-client", label: "Revenue by Client" },
        { path: "/sales-tax-summary", label: "Sales Tax Summary" },
      ],
    },
    {
      id: "expenses", path: "/expense-tracking", label: "Expenses", icon: CreditCard, hasChevron: true, module: "expenses",
      subItems: [
        { path: "/expense-tracking", label: "Expense Tracking" },
        { path: "/expenses", label: "All Expenses" },
      ],
    },
    {
      id: "reports", path: "/reports", label: "Reports", icon: BarChart3, hasChevron: true, module: "reports",
      subItems: [
        { path: "/reports", label: "All Reports" },
        { path: "/profit-and-loss", label: "Profit & Loss" },
        { path: "/balance-sheet", label: "Balance Sheet" },
        { path: "/cash-flow", label: "Cash Flow" },
        { path: "/trial-balance", label: "Trial Balance" },
        { path: "/revenue-by-client", label: "Revenue by Client" },
        { path: "/journal-entry-report", label: "Journal Entry Report" },
      ],
    },
    {
      id: "payroll", path: "/payroll-setup", label: "Payroll", icon: UsersRound, hasChevron: true, module: "payroll",
      subItems: [
        { path: "/payroll-setup", label: "Payroll Setup" },
        { path: "/payroll-runs", label: "Payroll Runs" },
        { path: "/timesheets", label: "Timesheets" },
        { path: "/1099-history", label: "1099 History" },
      ],
    },
    { id: "time-dashboard", path: "/time-tracking-dashboard", label: "Time Dashboard", icon: BarChartIcon, hasChevron: false, module: "payroll" },
    { id: "time-analytics", path: "/time-tracking-analytics", label: "Time Analytics", icon: TrendingUp, hasChevron: false, module: "payroll" },
    { id: "billable-forecast", path: "/billable-forecast", label: "Billable Forecast", icon: DollarSign, hasChevron: false, module: "payroll" },
    { id: "pto", path: "/pto-management", label: "PTO", icon: Calendar, hasChevron: false, module: "payroll" },
    {
      id: "time", path: "/timesheets", label: "Time", icon: RotateCcw, hasChevron: true, module: "transactions",
      subItems: [
        { path: "/timesheets", label: "Timesheets" },
        { path: "/time-tracking-dashboard", label: "Time Dashboard" },
        { path: "/time-tracking-analytics", label: "Time Analytics" },
        { path: "/billable-forecast", label: "Billable Forecast" },
        { path: "/pto-management", label: "PTO Management" },
      ],
    },
    { id: "projects", path: "/projects", label: "Projects", icon: Building2, hasChevron: false, module: "dashboard" },
    {
      id: "financial-planning", path: "/financial-planning", label: "Financial planning", icon: Lightbulb, hasChevron: true, module: "reports",
      subItems: [
        { path: "/financial-planning", label: "Planning Overview" },
        { path: "/financial-dashboard", label: "Financial Dashboard" },
        { path: "/cash-flow", label: "Cash Flow" },
      ],
    },
    {
      id: "workflow-automation", path: "/workflow-automation", label: "Workflow automation", icon: RefreshCw, hasChevron: true, module: "workflow-automation",
      subItems: [
        { path: "/workflow-automation", label: "All Workflows" },
      ],
    },
    {
      id: "taxes", path: "/tax-returns", label: "Taxes", icon: FileSpreadsheet, hasChevron: true, module: "tax-returns",
      subItems: [
        { path: "/tax-returns", label: "Tax Returns" },
        { path: "/1099-history", label: "1099 History" },
      ],
    },
    {
      id: "lending-banking", path: "/bank-transactions", label: "Lending & banking", icon: Wallet, hasChevron: true, module: "transactions",
      subItems: [
        { path: "/bank-transactions", label: "Bank Transactions" },
        { path: "/bank-reconciliation", label: "Reconciliation" },
      ],
    },
    {
      id: "commerce", path: "/invoices", label: "Commerce", icon: TrendingUp, hasChevron: true, module: "invoices",
      subItems: [
        { path: "/invoices", label: "Invoices" },
        { path: "/invoice-templates", label: "Templates" },
        { path: "/sales-tax-summary", label: "Sales Tax" },
      ],
    },
  ];

  const [yourBooksItems, setYourBooksItems] = useState<YourBooksItem[]>(defaultYourBooksItems);
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});
  const toggleBookExpand = (id: string) => {
    setExpandedBooks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (subscribed || isTrial || subscriptionTier !== null || isAdmin) return;
    const timer = setTimeout(() => {
      if (!subscribed && !isTrial && subscriptionTier === null && !isAdmin) {
        navigate("/auth");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [user, subscribed, subscriptionTier, isTrial, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }

    const savedOrder = localStorage.getItem('yourBooksOrder');
    const savedVisibility = localStorage.getItem('yourBooksVisibility');

    let visibilityMap: Record<string, boolean> = {};
    if (savedVisibility) {
      try {
        visibilityMap = JSON.parse(savedVisibility);
      } catch (error) {
        console.error("Error loading saved visibility:", error);
      }
    }

    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        const reorderedItems = orderIds
          .map((id: string) => {
            const item = defaultYourBooksItems.find(item => item.id === id);
            return item ? { ...item, visible: visibilityMap[id] !== false } : null;
          })
          .filter(Boolean) as YourBooksItem[];

        const newItems = defaultYourBooksItems.filter(
          item => !orderIds.includes(item.id)
        ).map(item => ({ ...item, visible: visibilityMap[item.id] !== false }));

        setYourBooksItems([...reorderedItems, ...newItems]);
      } catch (error) {
        console.error("Error loading saved order:", error);
      }
    } else {
      setYourBooksItems(defaultYourBooksItems.map(item => ({
        ...item,
        visible: visibilityMap[item.id] !== false
      })));
    }
  }, [user]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setYourBooksItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('yourBooksOrder', JSON.stringify(newItems.map(item => item.id)));
        return newItems;
      });
    }
  };

  const handleToggleVisibility = (id: string) => {
    setYourBooksItems((items) => {
      const newItems = items.map(item =>
        item.id === id ? { ...item, visible: item.visible === false } : item
      );
      const visibilityMap: Record<string, boolean> = {};
      newItems.forEach(item => {
        visibilityMap[item.id] = item.visible !== false;
      });
      localStorage.setItem('yourBooksVisibility', JSON.stringify(visibilityMap));
      return newItems;
    });
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user?.id)
        .single();
      if (data) setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const moduleMapping: Record<string, string> = {
    "/dashboard": "dashboard",
    "/invoices": "invoices",
    "/expense-tracking": "expenses",
    "/bank-transactions": "transactions",
    "/reports": "reports",
    "/payroll-setup": "payroll",
    "/payroll": "payroll",
    "/tax-returns": "tax-returns",
    "/tasks": "tasks",
    "/team": "team",
    "/accounting": "accounting",
    "/workflow-automation": "workflow-automation",
    "/tax-majr-ai": "tax-ai",
    "/settings": "settings",
    "/resources": "resources",
  };

  const canAccessPath = (path: string): boolean => {
    const module = moduleMapping[path];
    if (!module) return true;
    return hasAccessToModule(subscriptionTier, module);
  };

  // ─── Client portal navigation ─────────────────────────────────────────────
  const clientPortalItems: Array<{ path: string; label: string; icon: any }> = [
    { path: "/client-portal", label: "My Portal", icon: LayoutDashboard },
    { path: "/client-invoices", label: "My Invoices", icon: Receipt },
    { path: "/client-ai", label: "AI Assistant", icon: Bot },
    { path: "/client-support", label: "Support", icon: MessageCircle },
    { path: "/training", label: "Training", icon: GraduationCap },
    { path: "/client-settings", label: "Settings", icon: Settings },
  ];

  // ─── Grouped practice navigation ──────────────────────────────────────────
  const navSections: NavSection[] = [
    {
      id: "clients-section",
      title: "Clients",
      items: [
        { id: "clients", path: "/dashboard", label: "Clients", icon: Users },
        { id: "overview", path: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { id: "client-invitations", path: "/client-invitations", label: "Client Invitations", icon: UserPlus },
        { id: "multi-entity", path: "/multi-entity", label: "Multi-entity", icon: Layers },
      ],
    },
    {
      id: "finance-section",
      title: "Finance",
      items: [
        {
          id: "bookkeeping-nav",
          path: "/bookkeeping",
          label: "Bookkeeping",
          icon: BookOpen,
          subItems: [
            { path: "/bookkeeping", label: "Overview" },
            { path: "/bank-transactions", label: "Bank Transactions" },
            { path: "/bank-reconciliation", label: "Reconciliation" },
            { path: "/journal-entries", label: "Journal Entries" },
            { path: "/chart-of-accounts", label: "Chart of Accounts" },
          ],
        },
        {
          id: "payroll-nav",
          path: "/payroll-dashboard",
          label: "Payroll",
          icon: UsersRound,
          subItems: [
            { path: "/payroll-setup", label: "Payroll Setup" },
            { path: "/payroll-runs", label: "Payroll Runs" },
            { path: "/timesheets", label: "Timesheets" },
            { path: "/1099-history", label: "1099 History" },
          ],
        },
        {
          id: "billing-nav",
          path: "/invoices",
          label: "Billing",
          icon: Receipt,
          module: "invoices",
          subItems: [
            { path: "/billing/client-subscriptions", label: "Client subscriptions" },
            { path: "/billing/product-recommendations", label: "Product recommendations" },
            { path: "/billing/discover-more", label: "Discover more" },
            { path: "/billing/firm-subscriptions", label: "Firm subscriptions" },
            { path: "/billing/billing-details", label: "Billing details" },
            { path: "/billing/revenue-share", label: "Revenue share" },
          ],
        },
        {
          id: "invoicing-nav",
          path: "/invoices",
          label: "Invoicing",
          icon: FileText,
          module: "invoices",
          subItems: [
            { path: "/invoice/new", label: "New invoice" },
            { path: "/invoices?status=outstanding", label: "Outstanding" },
            { path: "/invoices?status=paid", label: "Paid" },
          ],
        },
        {
          id: "expenses-nav",
          path: "/expense-tracking",
          label: "Expenses",
          icon: CreditCard,
          module: "expenses",
          subItems: [
            { path: "/expense-tracking", label: "Receipt capture" },
            { path: "/expenses", label: "Expense reports" },
          ],
        },
      ],
    },
    {
      id: "compliance-section",
      title: "Compliance",
      items: [
        { id: "tax-returns-nav", path: "/tax-returns", label: "Tax Returns", icon: FileSpreadsheet, module: "tax-returns" },
        { id: "tax-majr-ai-nav", path: "https://taxmajr.ai/", label: "Tax Majr AI", icon: Sparkles, isExternal: true },
        {
          id: "reports-nav",
          path: "/reports",
          label: "Reports",
          icon: BarChart3,
          module: "reports",
          subItems: [
            { path: "/profit-and-loss", label: "P&L" },
            { path: "/balance-sheet", label: "Balance Sheet" },
            { path: "/cash-flow", label: "Cash Flow" },
          ],
        },
        { id: "deadlines-nav", path: "/deadlines", label: "Deadlines", icon: Calendar },
      ],
    },
    {
      id: "operations-section",
      title: "Operations",
      items: [
        { id: "workflow-nav", path: "/workflow-automation", label: "Workflow Automation", icon: RefreshCw, module: "workflow-automation" },
        { id: "work-nav", path: "/transactions", label: "Work", icon: Briefcase },
        { id: "ai-support-nav", path: "/client-support", label: "AI Support", icon: MessageCircle },
      ],
    },
    {
      id: "admin-section",
      title: "Admin",
      items: [
        { id: "team-nav", path: "/team", label: "Team", icon: UserCheck, module: "team" },
        { id: "user-permissions-nav", path: "/user-permissions", label: "User Permissions", icon: ShieldCheck },
        { id: "training-nav", path: "/training", label: "Training", icon: GraduationCap },
        { id: "settings-nav", path: "/settings", label: "Settings", icon: Settings, module: "settings" },
      ],
    },
  ];

  const practiceNavSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {

        if (item.isExternal) return true;
        return isAdmin || canAccessPath(item.path);
      }),
    }))
    .filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0",
          "border-r border-white/10 text-white flex flex-col",
          sidebarCollapsed ? "w-[52px]" : "w-60",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "hsl(215, 73%, 12%)" }}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Collapse Toggle */}
          <div className="py-4 px-2 border-b border-white/10 flex items-center justify-between shrink-0">
            {!sidebarCollapsed && (
              <Link to="/dashboard" className="flex items-center justify-center flex-1 min-w-0 pr-1">
                <img src={majrLogo} alt="MAJR Books" className="w-full max-w-[160px] h-auto object-contain" />
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebarCollapse}
              className={cn(
                "h-8 w-8 p-0 hidden lg:flex shrink-0 text-white/60 hover:text-white hover:bg-white/10",
                sidebarCollapsed && "mx-auto"
              )}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed
                ? <PanelLeft className="h-4 w-4" />
                : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* New Button */}
          <div className={cn("shrink-0", sidebarCollapsed ? "p-1.5" : "px-3 py-2")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className={cn(
                    "justify-center bg-green-600 hover:bg-green-700 text-white w-full",
                    sidebarCollapsed ? "h-9 p-0" : "h-9"
                  )}
                  variant="default"
                >
                  {sidebarCollapsed ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <><span className="text-base mr-1.5">+</span> New</>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card border border-border z-50" align="start">
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" /><span>Client</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoices" className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" /><span>Retainer</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoices" className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" /><span>Invoice</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoice-templates" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /><span>Recurring Template</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/bank-transactions" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /><span>Other Income</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/expense-tracking" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" /><span>Expense</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoices" className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" /><span>Estimate</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoices" className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" /><span>Proposal</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoices" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /><span>Credit</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/expense-tracking" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /><span>Bill</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/payroll-setup" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" /><span>Vendor</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Scrollable Navigation */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">

            {/* Practice: grouped sections */}
            {!isClient && (
              <div className={cn("py-2", sidebarCollapsed ? "px-1" : "px-2")}>
                {practiceNavSections.map((section, sectionIdx) => (
                  <div key={section.id} className={cn(sectionIdx > 0 && "mt-3")}>
                    {/* Section header */}
                    {!sidebarCollapsed ? (
                      <div className="px-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 select-none">
                          {section.title}
                        </span>
                      </div>
                    ) : sectionIdx > 0 ? (
                      <div className="border-t border-white/10 mb-2 mx-1" />
                    ) : null}

                    <nav role="navigation" aria-label={section.title} className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const hasSubItems = !!item.subItems?.length;
                        const isExpanded = !!expandedNavItems[item.id];

                        // Active if current path matches item path or any sub-item path
                        const isItemActive = hasSubItems
                          ? !!item.subItems?.some(sub => {
                              const [subPath] = sub.path.split('?');
                              return location.pathname === subPath;
                            })
                          : location.pathname === item.path;

                        if (item.isExternal) {
                          return (
                            <a
                              key={item.id}
                              href={item.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={sidebarCollapsed ? item.label : undefined}
                              className={cn(
                                "flex items-center rounded-md transition-colors text-white/75 hover:text-white hover:bg-white/10",
                                sidebarCollapsed
                                  ? "justify-center p-2"
                                  : "px-2 py-1.5 gap-3 text-sm"
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                            </a>
                          );
                        }

                        if (hasSubItems) {
                          return (
                            <div key={item.id}>
                              {sidebarCollapsed ? (
                                // Collapsed: icon links to primary path
                                <Link
                                  to={item.path}
                                  title={item.label}
                                  className={cn(
                                    "flex justify-center items-center p-2 rounded-md transition-colors",
                                    isItemActive
                                      ? "bg-white/15 text-white"
                                      : "text-white/75 hover:text-white hover:bg-white/10"
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </Link>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => toggleNavItem(item.id)}
                                    aria-expanded={isExpanded}
                                    aria-controls={`submenu-${item.id}`}
                                    className={cn(
                                      "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors",
                                      isItemActive
                                        ? "bg-white/15 text-white"
                                        : "text-white/75 hover:text-white hover:bg-white/10"
                                    )}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <Icon className="h-4 w-4 shrink-0" />
                                      <span className="truncate">{item.label}</span>
                                    </div>
                                    <ChevronRight
                                      className={cn(
                                        "h-3.5 w-3.5 text-white/40 transition-transform duration-200 shrink-0 ml-1",
                                        isExpanded && "rotate-90"
                                      )}
                                    />
                                  </button>

                                  {/* Animated submenu using CSS grid trick */}
                                  <div
                                    id={`submenu-${item.id}`}
                                    className={cn(
                                      "grid transition-all duration-200 ease-in-out",
                                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                    )}
                                  >
                                    <div className="overflow-hidden">
                                      <div className="ml-[22px] pl-3 border-l border-white/15 py-0.5 mt-0.5 space-y-0.5">
                                        {item.subItems!.map((sub) => {
                                          const [subPath, subQuery] = sub.path.split('?');
                                          const isSubActive =
                                            location.pathname === subPath &&
                                            (!subQuery || location.search === `?${subQuery}`);
                                          return (
                                            <Link
                                              key={sub.path}
                                              to={sub.path}
                                              className={cn(
                                                "block px-2.5 py-1.5 text-xs rounded-md transition-colors",
                                                isSubActive
                                                  ? "bg-white/15 text-white font-medium"
                                                  : "text-white/55 hover:text-white hover:bg-white/10"
                                              )}
                                            >
                                              {sub.label}
                                            </Link>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        }

                        // Plain nav item
                        return (
                          <Link
                            key={item.id}
                            to={item.path}
                            title={sidebarCollapsed ? item.label : undefined}
                            className={cn(
                              "flex items-center rounded-md transition-colors",
                              sidebarCollapsed
                                ? "justify-center p-2"
                                : "px-2 py-1.5 gap-3 text-sm",
                              isItemActive
                                ? "bg-white/15 text-white"
                                : "text-white/75 hover:text-white hover:bg-white/10"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                ))}
              </div>
            )}

            {/* Client portal navigation */}
            {isClient && (
              <div className={cn("py-2", sidebarCollapsed ? "px-1" : "px-2")}>
                <nav role="navigation" aria-label="Client portal" className="space-y-0.5">
                  {clientPortalItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center rounded-md transition-colors",
                          sidebarCollapsed
                            ? "justify-center p-2"
                            : "px-2 py-1.5 gap-3 text-sm",
                          isActive
                            ? "bg-white/15 text-white"
                            : "text-white/75 hover:text-white hover:bg-white/10"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Your Books Section – drag-and-drop bookmarks, hidden when collapsed or client */}
            {!sidebarCollapsed && !isClient && (
              <div className="px-3 py-2 mt-2 border-t border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="h-3 w-3 text-white/40" />
                    <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider select-none">
                      Your Books
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setYourBooksItems(defaultYourBooksItems.map(item => ({ ...item, visible: true })));
                        localStorage.removeItem('yourBooksOrder');
                        localStorage.removeItem('yourBooksVisibility');
                      }}
                      className="h-6 px-1.5 text-white/40 hover:text-white hover:bg-white/10"
                      title="Reset to default order"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditMode(!isEditMode)}
                      className="h-6 px-1.5 text-white/40 hover:text-white hover:bg-white/10"
                    >
                      {isEditMode ? <Check className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={yourBooksItems.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                    disabled={!isEditMode}
                  >
                    <nav className="space-y-0.5">
                      {yourBooksItems
                        .filter(item => {
                          if (item.module && !hasAccessToModule(subscriptionTier, item.module)) return false;
                          return isEditMode || item.visible !== false;
                        })
                        .map((item) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <SortableItem
                              key={item.id}
                              item={item}
                              isActive={isActive}
                              isEditMode={isEditMode}
                              onToggleVisibility={handleToggleVisibility}
                              isExpanded={!!expandedBooks[item.id]}
                              onToggleExpand={toggleBookExpand}
                            />
                          );
                        })}
                    </nav>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
                <span className="text-sm">GO TO MAJR BOOKS</span>
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Navigate or search for transactions, contacts, reports, and more"
                  className="w-full px-4 py-2 border border-border rounded-md bg-background text-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-accent">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover border-2 border-border"
                        onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/32"; }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                        <UserCircle className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {isAdmin ? "Majr Books" : (profile?.full_name || user?.email?.split("@")[0] || "User")}
                      </span>
                      <span className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded",
                        isAdmin ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
                      )}>
                        {isAdmin ? "ADMIN" : "User"}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-card border border-border z-[100]"
                  align="end"
                  sideOffset={8}
                >
                  <div className="flex items-center gap-3 p-3 border-b border-border">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/40"; }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{profile?.full_name || "User"}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                      <span className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded mt-1 w-fit",
                        isAdmin ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      )}>
                        {isAdmin ? "Admin" : "User"}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /><span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={signOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" /><span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Trial Banner */}
        {!isAdmin && isTrial && trialDaysRemaining !== null && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  <strong>{trialDaysRemaining} days</strong> remaining in your free trial
                </span>
              </div>
              <Button
                size="sm"
                variant="default"
                className="gap-1"
                onClick={() => setUpgradeModalOpen(true)}
              >
                <Sparkles className="h-3 w-3" />
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />

        <main className="flex-1 p-6 bg-background">{children}</main>
      </div>

      {isTrial && !isAdmin && !isClient && trialDaysRemaining !== null && trialDaysRemaining <= 3 && (
        <TrialExpiryModal
          daysRemaining={trialDaysRemaining}
          isTrialExpired={trialDaysRemaining <= 0}
          userEmail={user?.email}
        />
      )}
    </div>
  );
};

export default Layout;
