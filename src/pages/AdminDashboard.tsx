import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Settings,
  Activity,
  AlertTriangle,
  Lock,
  UserCheck,
  Database,
  CreditCard,
  TrendingUp,
  Clock,
  LogOut,
  ShieldAlert,
  Server,
  Key,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminSystemSettings from "@/components/admin/AdminSystemSettings";
import AdminSecuritySettings from "@/components/admin/AdminSecuritySettings";

const AdminDashboard = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const VALID_TABS = ["overview", "users", "security", "audit", "system"];
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get("tab");
    return VALID_TABS.includes(t ?? "") ? t! : "overview";
  });
  const AUTO_LOGOUT_TIME = 15 * 60 * 1000;

  // Keep activeTab in sync when sidebar links change the URL
  useEffect(() => {
    const t = searchParams.get("tab");
    const resolved = VALID_TABS.includes(t ?? "") ? t! : "overview";
    setActiveTab(resolved);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams(value === "overview" ? {} : { tab: value });
  };

  const handleBackToOverview = () => {
    handleTabChange("overview");
  };

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, navigate]);

  // Auto-logout after inactivity
  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now());
    
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > AUTO_LOGOUT_TIME) {
        signOut();
      }
    }, 60000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      clearInterval(interval);
    };
  }, [lastActivity, signOut]);

  // Fetch system stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: clientCount },
        { count: userCount },
        { count: invoiceCount },
        { count: taskCount },
      ] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("app_user_roles").select("*", { count: "exact", head: true }),
        supabase.from("invoices").select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }),
      ]);

      return {
        clients: clientCount || 0,
        users: userCount || 0,
        invoices: invoiceCount || 0,
        tasks: taskCount || 0,
      };
    },
    enabled: isAdmin,
  });

  // Fetch recent audit logs
  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["recent-admin-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-6 w-6" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have permission to access the Administrator Dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Majr Books Admin
            </h1>
            <p className="text-muted-foreground">
              Full system access and security controls
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Session Active
            </Badge>
            <Button variant="destructive" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Security Alert */}
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <Lock className="h-4 w-4" />
          <AlertTitle>Majr Books Administrator Access Active</AlertTitle>
          <AlertDescription>
            All actions are being logged. Auto-logout after 15 minutes of inactivity.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.clients}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.users}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.invoices}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.tasks}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {logsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : recentLogs && recentLogs.length > 0 ? (
                    <div className="space-y-3">
                      {recentLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{log.action.replace(/_/g, " ")}</span>
                          <span className="text-muted-foreground">
                            {format(new Date(log.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/user-permissions")}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/settings")}>
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("system")}>
                    <Database className="h-4 w-4 mr-2" />
                    View Integrations
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Lock All Books
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm">Database: Operational</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm">Authentication: Operational</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm">Storage: Operational</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <AdminUserManagement onBackToOverview={handleBackToOverview} />
          </TabsContent>

          <TabsContent value="security">
            <AdminSecuritySettings onBackToOverview={handleBackToOverview} />
          </TabsContent>

          <TabsContent value="audit">
            <AdminAuditLog onBackToOverview={handleBackToOverview} />
          </TabsContent>

          <TabsContent value="system">
            <AdminSystemSettings onBackToOverview={handleBackToOverview} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
