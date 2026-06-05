import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, Target } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, addWeeks, startOfWeek, endOfWeek } from "date-fns";

export default function BillableHoursForecast() {
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .in("status", ["active", "planning"]);
      if (error) throw error;
      return data;
    },
  });

  const { data: timeEntries } = useQuery({
    queryKey: ["time_entries_forecast"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("time_entries")
        .select("*, employees(first_name, last_name, pay_rate, target_utilization), projects(name, billing_rate, budget, spent)")
        .gte("entry_date", thirtyDaysAgo.toISOString().split('T')[0])
        .eq("approval_status", "approved");
      if (error) throw error;
      return data;
    },
  });

  // Calculate current utilization rates
  const calculateUtilization = () => {
    if (!employees || !timeEntries) return [];

    return employees.map(emp => {
      const empEntries = timeEntries.filter((e: any) => e.employee_id === emp.id);
      const totalHours = empEntries.reduce((sum: number, e: any) => sum + e.total_hours, 0);
      const billableHours = empEntries.filter((e: any) => e.is_billable).reduce((sum: number, e: any) => sum + e.total_hours, 0);
      const utilizationRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

      return {
        name: `${emp.first_name} ${emp.last_name}`,
        utilization: utilizationRate,
        target: (emp.target_utilization || 0.8) * 100,
        totalHours,
        billableHours,
      };
    });
  };

  // Project revenue forecast
  const calculateRevenueForecast = () => {
    if (!timeEntries || !projects) return [];

    const weeklyData = [];
    for (let i = 0; i < 8; i++) {
      const weekStart = startOfWeek(addWeeks(new Date(), i));
      const weekEnd = endOfWeek(weekStart);

      // Calculate average billable hours per week from historical data
      const historicalEntries = timeEntries.filter((e: any) => e.is_billable);
      const avgBillableHours = historicalEntries.length > 0
        ? historicalEntries.reduce((sum: number, e: any) => sum + e.total_hours, 0) / 4
        : 0;

      // Calculate projected revenue based on average billing rate
      const avgBillingRate = projects.reduce((sum: number, p: any) => sum + (p.billing_rate || 0), 0) / (projects.length || 1);
      const projectedRevenue = avgBillableHours * avgBillingRate;

      weeklyData.push({
        week: format(weekStart, "MMM d"),
        projected: Math.round(projectedRevenue),
        billableHours: Math.round(avgBillableHours),
      });
    }

    return weeklyData;
  };

  // Calculate metrics
  const utilizationData = calculateUtilization();
  const forecastData = calculateRevenueForecast();

  const totalProjectedRevenue = forecastData.reduce((sum, week) => sum + week.projected, 0);
  const avgUtilization = utilizationData.length > 0
    ? utilizationData.reduce((sum, emp) => sum + emp.utilization, 0) / utilizationData.length
    : 0;
  const totalBillableHours = utilizationData.reduce((sum, emp) => sum + emp.billableHours, 0);
  const projectCapacity = projects?.reduce((sum: number, p: any) => sum + (p.budget - p.spent), 0) || 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billable Hours Forecast</h1>
          <p className="text-muted-foreground">Revenue projections based on utilization and project pipeline</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Revenue (8 weeks)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalProjectedRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Based on current utilization</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Team average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billable Hours (30d)</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBillableHours.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Approved hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Capacity</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${projectCapacity.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Remaining budget</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast (8 Weeks)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="projected" stroke="hsl(var(--primary))" name="Projected Revenue ($)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projected Billable Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="billableHours" fill="hsl(var(--primary))" name="Billable Hours" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Utilization vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="utilization" fill="hsl(var(--primary))" name="Current Utilization (%)" />
                <Bar dataKey="target" fill="hsl(var(--muted))" name="Target Utilization (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {utilizationData.filter(emp => emp.utilization < emp.target).length > 0 && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h4 className="font-semibold mb-2">⚠️ Below Target Utilization</h4>
                  <p className="text-sm text-muted-foreground">
                    {utilizationData.filter(emp => emp.utilization < emp.target).length} employee(s) below target utilization rate.
                    Consider reviewing project assignments and billable opportunities.
                  </p>
                </div>
              )}
              
              {projectCapacity > 100000 && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h4 className="font-semibold mb-2">✓ Strong Project Pipeline</h4>
                  <p className="text-sm text-muted-foreground">
                    ${projectCapacity.toLocaleString()} in remaining project budgets. Revenue forecast is strong for upcoming weeks.
                  </p>
                </div>
              )}

              {avgUtilization > 75 && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h4 className="font-semibold mb-2">✓ Healthy Utilization Rate</h4>
                  <p className="text-sm text-muted-foreground">
                    Team is maintaining a healthy {avgUtilization.toFixed(1)}% utilization rate. Continue current project assignments.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}