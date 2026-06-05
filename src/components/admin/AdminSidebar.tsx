import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Settings,
  Activity,
  Lock,
  Database,
  CreditCard,
  Server,
  Key,
  AlertTriangle,
  BarChart3,
  Workflow,
  Receipt,
} from "lucide-react";
import majrLogo from "@/assets/logo-majr-books.jpg";

const adminNavItems = [
  {
    section: "Dashboard",
    items: [
      { path: "/admin", label: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    section: "User Management",
    items: [
      { path: "/admin?tab=users", label: "All Users", icon: Users },
      { path: "/user-permissions", label: "Roles & Permissions", icon: Key },
      { path: "/team", label: "Team Members", icon: Users },
    ],
  },
  {
    section: "Financial Data",
    items: [
      { path: "/dashboard", label: "Clients", icon: Users },
      { path: "/invoices", label: "Invoicing & Billing", icon: Receipt },
      { path: "/payroll", label: "Payroll", icon: CreditCard },
      { path: "/tax-returns", label: "Tax Forms", icon: FileText },
      { path: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    section: "System",
    items: [
      { path: "/admin?tab=security", label: "Security Settings", icon: Shield },
      { path: "/admin?tab=audit", label: "Audit Logs", icon: Activity },
      { path: "/workflow-automation", label: "Workflows", icon: Workflow },
      { path: "/settings", label: "System Settings", icon: Settings },
    ],
  },
  {
    section: "Data Control",
    items: [
      { path: "/admin?tab=system", label: "Integrations", icon: Database },
      { path: "/admin?tab=system", label: "Data Locks", icon: Lock },
    ],
  },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Logo with Admin Badge */}
      <div className="p-4 border-b border-border">
        <Link to="/admin" className="flex flex-col items-center">
          <img src={majrLogo} alt="MAJR Books" className="h-12 object-contain mb-2" />
          <div className="flex items-center gap-2 px-3 py-1 bg-destructive/10 rounded-full">
            <Shield className="h-4 w-4 text-destructive" />
            <span className="text-xs font-semibold text-destructive uppercase tracking-wide">
              Admin Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {adminNavItems.map((section) => (
          <div key={section.section}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {section.section}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (location.pathname === "/admin" && item.path.includes("admin?tab"));
                
                return (
                  <Link
                    key={item.path + item.label}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Warning Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>All actions are logged</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
