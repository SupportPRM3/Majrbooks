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
  ChevronLeft,
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
  Calculator,
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
  Shield,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  HardDrive,
  Bot,
  MessageCircle,
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

interface YourBooksItem {
  id: string;
  path: string;
  label: string;
  icon: any;
  hasChevron: boolean;
  visible?: boolean;
  module?: string;
}

const SortableItem = ({ 
  item, 
  isActive, 
  isEditMode,
  onToggleVisibility,
}: { 
  item: YourBooksItem; 
  isActive: boolean; 
  isEditMode: boolean;
  onToggleVisibility: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = item.icon;

  return (
    <div ref={setNodeRef} style={style}>
      <Link to={item.path}>
        <div className={cn(
          "flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors group",
          isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/50",
          isDragging && "shadow-lg ring-2 ring-primary"
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
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </Link>
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
  const [billingOpen, setBillingOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);


  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebarCollapsed', String(newValue));
      return newValue;
    });
  };
  
  const [profile, setProfile] = useState<{
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  const defaultYourBooksItems: YourBooksItem[] = [
    { id: "client-overview", path: "/dashboard", label: "Client overview", icon: Users, hasChevron: false, module: "dashboard" },
    { id: "dashboards", path: "/financial-dashboard", label: "Dashboards", icon: LayoutDashboard, hasChevron: true, module: "dashboard" },
    { id: "tasks", path: "/tasks", label: "Tasks", icon: FileText, hasChevron: false, module: "tasks" },
    { id: "transactions", path: "/bank-transactions", label: "Transactions", icon: Receipt, hasChevron: true, module: "transactions" },
    { id: "sales", path: "/invoices", label: "Sales", icon: DollarSign, hasChevron: true, module: "invoices" },
    { id: "expenses", path: "/expense-tracking", label: "Expenses", icon: CreditCard, hasChevron: true, module: "expenses" },
    { id: "reports", path: "/reports", label: "Reports", icon: BarChart3, hasChevron: true, module: "reports" },
    { id: "payroll", path: "/payroll-setup", label: "Payroll", icon: UsersRound, hasChevron: true, module: "payroll" },
    { id: "time-dashboard", path: "/time-tracking-dashboard", label: "Time Dashboard", icon: BarChartIcon, hasChevron: false, module: "payroll" },
    { id: "time-analytics", path: "/time-tracking-analytics", label: "Time Analytics", icon: TrendingUp, hasChevron: false, module: "payroll" },
    { id: "billable-forecast", path: "/billable-forecast", label: "Billable Forecast", icon: DollarSign, hasChevron: false, module: "payroll" },
    { id: "pto", path: "/pto-management", label: "PTO", icon: Calendar, hasChevron: false, module: "payroll" },
    { id: "time", path: "/transactions", label: "Time", icon: RotateCcw, hasChevron: true, module: "transactions" },
    { id: "projects", path: "/projects", label: "Projects", icon: Building2, hasChevron: false, module: "dashboard" },
    { id: "financial-planning", path: "/financial-planning", label: "Financial planning", icon: Lightbulb, hasChevron: true, module: "reports" },
    { id: "workflow-automation", path: "/workflow-automation", label: "Workflow automation", icon: RefreshCw, hasChevron: true, module: "workflow-automation" },
    { id: "taxes", path: "/tax-returns", label: "Taxes", icon: FileSpreadsheet, hasChevron: true, module: "tax-returns" },
    { id: "lending-banking", path: "/bank-transactions", label: "Lending & banking", icon: Wallet, hasChevron: true, module: "transactions" },
    { id: "commerce", path: "/invoices", label: "Commerce", icon: TrendingUp, hasChevron: true, module: "invoices" },
  ];

  const [yourBooksItems, setYourBooksItems] = useState<YourBooksItem[]>(defaultYourBooksItems);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Redirect to auth if not subscribed - but wait for subscription check to complete first
  useEffect(() => {
    // Don't redirect while still loading or if user has any form of access
    if (loading) return;
    if (!user) return;
    
    // If user has ANY form of access, don't redirect
    if (subscribed || isTrial || subscriptionTier !== null || isAdmin) return;
    
    // Give a delay for subscription check to complete before redirecting
    const timer = setTimeout(() => {
      // Double check after timeout - subscription might have been set
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
    
    // Load saved order and visibility from localStorage
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
        
        // Add any new items that weren't in the saved order
        const newItems = defaultYourBooksItems.filter(
          item => !orderIds.includes(item.id)
        ).map(item => ({ ...item, visible: visibilityMap[item.id] !== false }));
        
        setYourBooksItems([...reorderedItems, ...newItems]);
      } catch (error) {
        console.error("Error loading saved order:", error);
      }
    } else {
      // Just apply visibility if no saved order
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
        
        // Save to localStorage
        const orderIds = newItems.map(item => item.id);
        localStorage.setItem('yourBooksOrder', JSON.stringify(orderIds));
        
        return newItems;
      });
    }
  };

  const handleToggleVisibility = (id: string) => {
    setYourBooksItems((items) => {
      const newItems = items.map(item =>
        item.id === id ? { ...item, visible: item.visible === false } : item
      );
      
      // Save visibility to localStorage
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

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  // Map navigation items to subscription modules
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
    if (!module) return true; // Allow paths not in mapping
    return hasAccessToModule(subscriptionTier, module);
  };

  // Client users see a restricted navigation - only their portal items
  const clientPortalItems: Array<{ path: string; label: string; icon: any; hasSubmenu?: boolean; isExternal?: boolean }> = [
    { path: "/client-portal", label: "My Portal", icon: LayoutDashboard },
    { path: "/client-invoices", label: "My Invoices", icon: Receipt },
    { path: "/client-ai", label: "AI Assistant", icon: Bot },
    { path: "/client-support", label: "Support", icon: MessageCircle },
    { path: "/client-settings", label: "Settings", icon: Settings },
  ];

  // Admin/User practice items - full navigation
  const fullPracticeItems: Array<{ path: string; label: string; icon: any; hasSubmenu?: boolean; isExternal?: boolean }> = [
    { path: "/dashboard", label: "Clients", icon: Users },
    { path: "/client-invitations", label: "Client Invitations", icon: UserPlus },
    { path: "/invoices", label: "Billing", icon: Receipt, hasSubmenu: true },
    { path: "/tax-returns", label: "Tax Returns", icon: FileText },
    { path: "/schedule-c", label: "Schedule C Prep", icon: FileSpreadsheet },
    { path: "https://taxmajr.ai/", label: "Tax Majr AI", icon: Sparkles, isExternal: true },
    { path: "/workflow-automation", label: "Workflow Automation", icon: RefreshCw },
    { path: "/transactions", label: "Work", icon: Briefcase },
    { path: "/team", label: "Team", icon: UserCheck },
    { path: "/user-permissions", label: "User Permissions", icon: ShieldCheck },
    { path: "/settings", label: "Settings", icon: Settings },
    ...(isAdmin ? [{ path: "/admin", label: "Admin Dashboard", icon: Shield }] : []),
  ];

  // Admins get ALL items - bypass subscription check
  const practiceItems = isClient
    ? clientPortalItems
    : fullPracticeItems.filter(item => item.isExternal || isAdmin || canAccessPath(item.path));

  const billingSubmenuItems = [
    { label: "Client subscriptions", path: "/billing/client-subscriptions" },
    { label: "Product recommendations", path: "/billing/product-recommendations" },
    { label: "Discover more", path: "/billing/discover-more" },
    { label: "Firm subscriptions", path: "/billing/firm-subscriptions" },
    { label: "Billing details", path: "/billing/billing-details" },
    { label: "Revenue share", path: "/billing/revenue-share" },
  ];

  const bookmarkItems = [
    { path: "/dashboard", label: "Client overview", icon: Users },
    { path: "/reports", label: "Dashboards", icon: LayoutDashboard, hasSubmenu: true },
    { path: "/transactions", label: "Tasks", icon: Check },
    { path: "/transactions", label: "Transactions", icon: CreditCard, hasSubmenu: true },
    { path: "/invoices", label: "Sales", icon: DollarSign, hasSubmenu: true },
    { path: "/expenses", label: "Expenses", icon: Receipt, hasSubmenu: true },
    { path: "/reports", label: "Reports", icon: BarChart3, hasSubmenu: true },
    { path: "/payroll-setup", label: "Payroll", icon: UsersRound, hasSubmenu: true },
    { path: "/time-tracking-dashboard", label: "Time Dashboard", icon: Clock },
    { path: "/time-tracking-analytics", label: "Time Analytics", icon: BarChartIcon },
    { path: "/billable-forecast", label: "Billable Forecast", icon: TrendingUp },
    { path: "/pto-management", label: "PTO", icon: Calendar },
    { path: "/timesheets", label: "Time", icon: Clock, hasSubmenu: true },
    { path: "/projects", label: "Projects", icon: Briefcase },
    { path: "/financial-planning", label: "Financial planning", icon: TrendingUp, hasSubmenu: true },
    { path: "/workflow-automation", label: "Workflow automation", icon: RefreshCw },
    { path: "/tax-returns", label: "Taxes", icon: FileText, hasSubmenu: true },
    { path: "/bank-transactions", label: "Lending & banking", icon: Wallet, hasSubmenu: true },
    { path: "/invoices", label: "Commerce", icon: HardDrive, hasSubmenu: true },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0",
        "border-r border-white/10 text-white",
        sidebarCollapsed ? "w-16" : "w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ backgroundColor: "hsl(215, 73%, 12%)" }}>
        <div className="flex flex-col h-full">
          {/* Logo & Collapse Toggle */}
          <div className="py-4 px-2 border-b border-border/50 bg-sidebar-background flex items-center justify-between">
            {!sidebarCollapsed && (
              <Link to="/dashboard" className="flex items-center justify-center flex-1">
                <img src={majrLogo} alt="MAJR Books" className="w-full max-w-[200px] h-auto object-contain" />
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebarCollapse}
              className={cn("h-8 w-8 p-0 hidden lg:flex", sidebarCollapsed && "mx-auto")}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* New Button */}
          <div className={cn("p-2", sidebarCollapsed ? "px-2" : "px-4")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className={cn(
                  "justify-center bg-green-600 hover:bg-green-700 text-white",
                  sidebarCollapsed ? "w-full h-10 p-0" : "w-full"
                )} variant="default">
                  {sidebarCollapsed ? (
                    <Plus className="h-5 w-5" />
                  ) : (
                    <>
                      <span className="text-lg mr-2">+</span> New
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card border border-border z-50" align="start">
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    <span>Client</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoices" className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    <span>Retainer</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoices" className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    <span>Invoice</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoice-templates" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Recurring Template</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/bank-transactions" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Other Income</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/expense-tracking" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>Expense</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoices" className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Estimate</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoices" className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>Proposal</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/invoices" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Credit</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/expense-tracking" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Bill</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                  <Link to="/payroll-setup" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Vendor</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Scrollable Navigation */}
          <div className="flex-1 overflow-y-auto">
            {/* Your Practice Section */}
            <div className={cn("py-2", sidebarCollapsed ? "px-2" : "px-4")}>
              {!sidebarCollapsed && (
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase">Your Practice</h3>
                </div>
              )}
              <nav className="space-y-1">
                {practiceItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  if (item.hasSubmenu) {
                    return (
                      <div key={item.path}>
                        <div 
                          onClick={() => !sidebarCollapsed && setBillingOpen(!billingOpen)}
                          className={cn(
                            "flex items-center rounded-md transition-colors cursor-pointer",
                            sidebarCollapsed ? "justify-center p-2" : "justify-between px-3 py-2 text-sm",
                            isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/50"
                          )}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          <div className={cn("flex items-center", sidebarCollapsed ? "" : "space-x-3")}>
                            <Icon className="h-4 w-4" />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                          </div>
                          {!sidebarCollapsed && (
                            <ChevronRight className={cn("h-4 w-4 transition-transform", billingOpen && "rotate-90")} />
                          )}
                        </div>
                        {billingOpen && !sidebarCollapsed && (
                          <div className="ml-4 mt-1 space-y-1">
                            {billingSubmenuItems.map((subItem, index) => (
                              <Link key={index} to={subItem.path}>
                                <div
                                  className={cn(
                                    "px-3 py-2 text-sm rounded-md hover:bg-secondary/50 transition-colors cursor-pointer",
                                    location.pathname === subItem.path && "bg-secondary text-secondary-foreground"
                                  )}
                                >
                                  {subItem.label}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  if (item.isExternal) {
                    return (
                      <a key={item.path} href={item.path} target="_blank" rel="noopener noreferrer" title={sidebarCollapsed ? item.label : undefined}>
                        <div className={cn(
                          "flex items-center rounded-md transition-colors hover:bg-secondary/50",
                          sidebarCollapsed ? "justify-center p-2" : "justify-between px-3 py-2 text-sm"
                        )}>
                          <div className={cn("flex items-center", sidebarCollapsed ? "" : "space-x-3")}>
                            <Icon className="h-4 w-4" />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                          </div>
                        </div>
                      </a>
                    );
                  }
                  
                  return (
                    <Link key={item.path} to={item.path} title={sidebarCollapsed ? item.label : undefined}>
                      <div className={cn(
                        "flex items-center rounded-md transition-colors",
                        sidebarCollapsed ? "justify-center p-2" : "justify-between px-3 py-2 text-sm",
                        isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/50"
                      )}>
                        <div className={cn("flex items-center", sidebarCollapsed ? "" : "space-x-3")}>
                          <Icon className="h-4 w-4" />
                          {!sidebarCollapsed && <span>{item.label}</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>


            {/* Your Books Section - hidden when collapsed or for client users */}
            {!sidebarCollapsed && !isClient && (
              <div className="px-4 py-2 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-3 w-3 text-muted-foreground" />
                    <h3 className="text-xs font-semibold text-foreground uppercase">Your Books</h3>
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
                      className="h-6 px-2"
                      title="Reset to default order"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditMode(!isEditMode)}
                      className="h-6 px-2"
                    >
                      {isEditMode ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Edit2 className="h-3 w-3" />
                      )}
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
                    <nav className="space-y-1">
                      {yourBooksItems
                        .filter(item => {
                          // Filter by subscription module access
                          if (item.module && !hasAccessToModule(subscriptionTier, item.module)) {
                            return false;
                          }
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
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/32";
                        }}
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
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/40";
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {profile?.full_name || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user?.email}
                      </span>
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
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={signOut} 
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Trial Banner - hidden for admins */}
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

        {/* Upgrade Modal */}
        <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-background">{children}</main>
      </div>

      {/* Trial Expiry Modal - shows during trial when <= 3 days remaining */}
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
