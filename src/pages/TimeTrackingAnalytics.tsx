import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, Users, Clock } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function TimeTrackingAnalytics() {
  // Fetch billable vs non-billable hours
  const { data: billableData } = useQuery({
    queryKey: ["billable-hours"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());

      const { data, error } = await supabase
        .from("time_entries")
        .select("total_hours, is_billable")
        .gte("entry_date", monthStart.toISOString().split('T')[0])
        .lte("entry_date", monthEnd.toISOString().split('T')[0]);

      if (error) throw error;

      const billable = data?.filter(e => e.is_billable).reduce((sum, e) => sum + Number(e.total_hours), 0) || 0;
      const nonBillable = data?.filter(e => !e.is_billable).reduce((sum, e) => sum + Number(e.total_hours), 0) || 0;

      return [
        { name: "Billable", hours: billable, value: billable },
        { name: "Non-Billable", hours: nonBillable, value: nonBillable }
      ];
    }
  });

  // Fetch project profitability
  const { data: projectProfitability } = useQuery({
    queryKey: ["project-profitability"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: projects, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          budget,
          billing_rate
        `)
        .eq("user_id", user.id)
        .not("billing_rate", "is", null);

      if (error) throw error;

      const profitabilityData = await Promise.all(
        (projects || []).map(async (project) => {
          const { data: timeEntries } = await supabase
            .from("time_entries")
            .select(`
              total_hours,
              is_billable,
              employee_id,
              employees!inner(pay_rate)
            `)
            .eq("project_id", project.id);

          const totalHours = timeEntries?.reduce((sum, e) => sum + Number(e.total_hours), 0) || 0;
          const billableHours = timeEntries?.filter(e => e.is_billable).reduce((sum, e) => sum + Number(e.total_hours), 0) || 0;
          const revenue = billableHours * Number(project.billing_rate);
          const cost = timeEntries?.reduce((sum, e) => sum + (Number(e.total_hours) * Number(e.employees.pay_rate)), 0) || 0;
          const profit = revenue - cost;
          const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

          return {
            name: project.name,
            revenue,
            cost,
            profit,
            margin,
            hours: totalHours
          };
        })
      );

      return profitabilityData;
    }
  });

  // Fetch employee utilization
  const { data: utilizationData } = useQuery({
    queryKey: ["employee-utilization"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());

      const { data: employees, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, target_utilization")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;

      const utilizationRates = await Promise.all(
        (employees || []).map(async (employee) => {
          const { data: timeEntries } = await supabase
            .from("time_entries")
            .select("total_hours, is_billable")
            .eq("employee_id", employee.id)
            .gte("entry_date", monthStart.toISOString().split('T')[0])
            .lte("entry_date", monthEnd.toISOString().split('T')[0]);

          const totalHours = timeEntries?.reduce((sum, e) => sum + Number(e.total_hours), 0) || 0;
          const billableHours = timeEntries?.filter(e => e.is_billable).reduce((sum, e) => sum + Number(e.total_hours), 0) || 0;
          
          // Standard work month = 160 hours (40hrs/week * 4 weeks)
          const standardHours = 160;
          const utilization = (billableHours / standardHours) * 100;
          const target = Number(employee.target_utilization) * 100;

          return {
            name: `${employee.first_name} ${employee.last_name}`,
            utilization: utilization.toFixed(1),
            target: target,
            actual: utilization,
            totalHours,
            billableHours
          };
        })
      );

      return utilizationRates;
    }
  });

  // Fetch utilization trend (last 3 months)
  const { data: trendData } = useQuery({
    queryKey: ["utilization-trend"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const months = Array.from({ length: 3 }, (_, i) => {
        const date = subMonths(new Date(), 2 - i);
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, "MMM")
        };
      });

      const trendData = await Promise.all(
        months.map(async ({ start, end, label }) => {
          const { data: timeEntries } = await supabase
            .from("time_entries")
            .select("total_hours, is_billable")
            .gte("entry_date", start.toISOString().split('T')[0])
            .lte("entry_date", end.toISOString().split('T')[0]);

          const billableHours = timeEntries?.filter(e => e.is_billable).reduce((sum, e) => sum + Number(e.total_hours), 0) || 0;
          const totalHours = timeEntries?.reduce((sum, e) => sum + Number(e.total_hours), 0) || 0;
          const utilization = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

          return {
            month: label,
            utilization: utilization.toFixed(1),
            billableHours,
            totalHours
          };
        })
      );

      return trendData;
    }
  });

  const chartConfig = {
    billable: { label: "Billable", color: "hsl(var(--primary))" },
    nonBillable: { label: "Non-Billable", color: "hsl(var(--muted))" },
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    cost: { label: "Cost", color: "hsl(var(--accent))" },
    utilization: { label: "Utilization", color: "hsl(var(--secondary))" }
  };

  const totalBillable = billableData?.find(d => d.name === "Billable")?.hours || 0;
  const totalNonBillable = billableData?.find(d => d.name === "Non-Billable")?.hours || 0;
  const totalHours = totalBillable + totalNonBillable;
  const billablePercentage = totalHours > 0 ? ((totalBillable / totalHours) * 100).toFixed(1) : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Time Tracking Analytics</h1>
          <p className="text-muted-foreground">Billable hours, profitability, and utilization metrics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBillable.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">{billablePercentage}% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${projectProfitability?.reduce((sum, p) => sum + p.revenue, 0).toFixed(0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {utilizationData?.length ? (utilizationData.reduce((sum, e) => sum + e.actual, 0) / utilizationData.length).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Employee average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectProfitability?.length || 0}</div>
              <p className="text-xs text-muted-foreground">With billing rates</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="billable" className="space-y-4">
          <TabsList>
            <TabsTrigger value="billable">Billable vs Non-Billable</TabsTrigger>
            <TabsTrigger value="profitability">Project Profitability</TabsTrigger>
            <TabsTrigger value="utilization">Employee Utilization</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="billable" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billable vs Non-Billable Hours</CardTitle>
                <CardDescription>Hours breakdown for current month</CardDescription>
              </CardHeader>
              <CardContent>
                {billableData && billableData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <PieChart>
                      <Pie
                        data={billableData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${entry.hours.toFixed(1)}h`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {billableData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <p>No time entries for current month</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profitability" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Profitability Analysis</CardTitle>
                <CardDescription>Revenue vs cost by project</CardDescription>
              </CardHeader>
              <CardContent>
                {projectProfitability && projectProfitability.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={projectProfitability}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
                      <Bar dataKey="cost" fill="hsl(var(--accent))" name="Cost" />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <p>No projects with billing rates configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utilization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee Utilization Rates</CardTitle>
                <CardDescription>Actual vs target utilization</CardDescription>
              </CardHeader>
              <CardContent>
                {utilizationData && utilizationData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={utilizationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="actual" fill="hsl(var(--secondary))" name="Actual %" />
                      <Bar dataKey="target" fill="hsl(var(--muted))" name="Target %" />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <p>No active employees found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilization Trend</CardTitle>
                <CardDescription>3-month utilization percentage trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={trendData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="utilization" stroke="hsl(var(--secondary))" name="Utilization %" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
