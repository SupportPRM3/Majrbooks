import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Play,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfYear, endOfYear, addDays, isAfter, isBefore } from "date-fns";

interface PayrollStats {
  totalEmployees: number;
  activeEmployees: number;
  totalContractors: number;
  ytdGrossPay: number;
  ytdNetPay: number;
  ytdTaxes: number;
  ytdContractorPay: number;
  pendingRuns: number;
  upcomingPayDate: string | null;
}

interface RecentPayrollRun {
  id: string;
  run_name: string;
  pay_date: string;
  status: string;
  total_gross_pay: number;
  total_net_pay: number;
  created_at: string;
}

interface PendingTimesheet {
  id: string;
  employee_name: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  status: string;
}

export function PayrollOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PayrollStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalContractors: 0,
    ytdGrossPay: 0,
    ytdNetPay: 0,
    ytdTaxes: 0,
    ytdContractorPay: 0,
    pendingRuns: 0,
    upcomingPayDate: null,
  });
  const [recentRuns, setRecentRuns] = useState<RecentPayrollRun[]>([]);
  const [pendingTimesheets, setPendingTimesheets] = useState<PendingTimesheet[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const currentYear = new Date().getFullYear();
      const yearStart = format(startOfYear(new Date()), "yyyy-MM-dd");
      const yearEnd = format(endOfYear(new Date()), "yyyy-MM-dd");

      // Load employees count
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("id, status")
        .eq("user_id", user.id);

      // Load contractors count
      const { data: contractors } = await supabase
        .from("contractors")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active");

      // Load YTD payroll totals from payroll_runs
      const { data: payrollRuns } = await supabase
        .from("payroll_runs")
        .select("total_gross_pay, total_net_pay, total_taxes, status, pay_date")
        .eq("user_id", user.id)
        .gte("pay_date", yearStart)
        .lte("pay_date", yearEnd);

      // Calculate YTD totals (only from processed runs)
      const processedRuns = payrollRuns?.filter(r => r.status === "processed") || [];
      const ytdGrossPay = processedRuns.reduce((sum, r) => sum + (r.total_gross_pay || 0), 0);
      const ytdNetPay = processedRuns.reduce((sum, r) => sum + (r.total_net_pay || 0), 0);
      const ytdTaxes = processedRuns.reduce((sum, r) => sum + (r.total_taxes || 0), 0);

      // Pending runs count
      const pendingRuns = payrollRuns?.filter(r => r.status === "draft" || r.status === "approved").length || 0;

      // Find upcoming pay date (next draft or approved run)
      const upcomingRun = payrollRuns
        ?.filter(r => r.status === "draft" || r.status === "approved")
        .sort((a, b) => new Date(a.pay_date).getTime() - new Date(b.pay_date).getTime())[0];

      setStats({
        totalEmployees: employees?.length || 0,
        activeEmployees: employees?.filter(e => e.status === "active").length || 0,
        totalContractors: contractors?.length || 0,
        ytdGrossPay,
        ytdNetPay,
        ytdTaxes,
        ytdContractorPay: 0,
        pendingRuns,
        upcomingPayDate: upcomingRun?.pay_date || null,
      });

      // Load recent payroll runs
      const { data: runs } = await supabase
        .from("payroll_runs")
        .select("id, run_name, pay_date, status, total_gross_pay, total_net_pay, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentRuns(runs || []);

      // Load pending timesheets
      const { data: timesheets } = await supabase
        .from("timesheets")
        .select(`
          id, period_start, period_end, total_hours, status,
          employees (first_name, last_name)
        `)
        .eq("user_id", user.id)
        .eq("status", "submitted")
        .order("period_end", { ascending: false })
        .limit(5);

      setPendingTimesheets(
        timesheets?.map(t => ({
          id: t.id,
          employee_name: t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unknown",
          period_start: t.period_start,
          period_end: t.period_end,
          total_hours: t.total_hours,
          status: t.status,
        })) || []
      );
    } catch (error) {
      console.error("Error loading payroll data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      draft: { className: "bg-muted text-muted-foreground", label: "Draft" },
      approved: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Approved" },
      processed: { className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Processed" },
    };
    const v = variants[status] || variants.draft;
    return <Badge className={v.className}>{v.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Employees</p>
                <p className="text-3xl font-bold">{stats.activeEmployees}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalContractors} contractors
                </p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">YTD Gross Payroll</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.ytdGrossPay)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Net: {formatCurrency(stats.ytdNetPay)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">YTD Taxes</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.ytdTaxes)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Federal, State, FICA
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.upcomingPayDate ? "border-primary/50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next Pay Date</p>
                <p className="text-3xl font-bold">
                  {stats.upcomingPayDate
                    ? format(new Date(stats.upcomingPayDate), "MMM d")
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingRuns} pending run{stats.pendingRuns !== 1 ? "s" : ""}
                </p>
              </div>
              <Calendar className="h-10 w-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/payroll-runs">
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Run Payroll
              </Button>
            </Link>
            <Link to="/timesheets">
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Review Timesheets
                {pendingTimesheets.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingTimesheets.length}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link to="/pto-management">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                PTO Requests
              </Button>
            </Link>
            <Link to="/form-1099-history">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                1099 Forms
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payroll Runs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Payroll Runs</CardTitle>
              <Link to="/payroll-runs">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentRuns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No payroll runs yet</p>
                <Link to="/payroll-runs">
                  <Button variant="link" className="mt-2">
                    Create your first payroll run
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run Name</TableHead>
                    <TableHead>Pay Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">{run.run_name}</TableCell>
                      <TableCell>{format(new Date(run.pay_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{formatCurrency(run.total_gross_pay)}</TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Timesheets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pending Timesheet Approvals</CardTitle>
              <Link to="/timesheets">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingTimesheets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-50" />
                <p>All timesheets approved</p>
                <p className="text-sm mt-1">No pending approvals</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTimesheets.map((ts) => (
                    <TableRow key={ts.id}>
                      <TableCell className="font-medium">{ts.employee_name}</TableCell>
                      <TableCell>
                        {format(new Date(ts.period_start), "MMM d")} -{" "}
                        {format(new Date(ts.period_end), "MMM d")}
                      </TableCell>
                      <TableCell>{ts.total_hours.toFixed(1)}h</TableCell>
                      <TableCell>
                        <Link to="/timesheets">
                          <Button variant="ghost" size="sm">
                            Review
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Alerts */}
      {stats.activeEmployees > 0 && (
        <Card className="border-orange-500/30 bg-orange-50/50 dark:bg-orange-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Compliance Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Federal tax deposits due by the 15th of each month</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>Quarterly 941 forms due at end of each quarter</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>W-2 forms due to employees by January 31</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
