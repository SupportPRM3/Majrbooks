import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { Clock, TrendingUp, Users, Briefcase } from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function TimeTrackingDashboard() {
  // Fetch weekly summary data
  const { data: weeklySummary, isLoading: loadingSummary } = useQuery({
    queryKey: ["weekly-time-summary"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      const { data, error } = await supabase
        .from("timesheets")
        .select(`
          *,
          employees!inner(first_name, last_name)
        `)
        .eq("user_id", user.id)
        .gte("period_start", weekStart.toISOString().split('T')[0])
        .lte("period_end", weekEnd.toISOString().split('T')[0]);

      if (error) throw error;

      const totalRegular = data?.reduce((sum, ts) => sum + Number(ts.regular_hours), 0) || 0;
      const totalOvertime = data?.reduce((sum, ts) => sum + Number(ts.overtime_hours), 0) || 0;
      const totalHours = data?.reduce((sum, ts) => sum + Number(ts.total_hours), 0) || 0;
      const activeEmployees = new Set(data?.map(ts => ts.employee_id)).size;

      return {
        totalRegular,
        totalOvertime,
        totalHours,
        activeEmployees,
        timesheets: data || []
      };
    }
  });

  // Fetch time by employee
  const { data: employeeData } = useQuery({
    queryKey: ["time-by-employee"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      const { data, error } = await supabase
        .from("timesheets")
        .select(`
          employee_id,
          regular_hours,
          overtime_hours,
          total_hours,
          employees!inner(first_name, last_name)
        `)
        .eq("user_id", user.id)
        .gte("period_start", weekStart.toISOString().split('T')[0])
        .lte("period_end", weekEnd.toISOString().split('T')[0]);

      if (error) throw error;

      const grouped = data?.reduce((acc: any, ts: any) => {
        const name = `${ts.employees.first_name} ${ts.employees.last_name}`;
        if (!acc[name]) {
          acc[name] = { name, regular: 0, overtime: 0, total: 0 };
        }
        acc[name].regular += Number(ts.regular_hours);
        acc[name].overtime += Number(ts.overtime_hours);
        acc[name].total += Number(ts.total_hours);
        return acc;
      }, {});

      return Object.values(grouped || {});
    }
  });

  // Fetch time by project
  const { data: projectData } = useQuery({
    queryKey: ["time-by-project"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          total_hours,
          project_id,
          projects(name)
        `)
        .gte("entry_date", weekStart.toISOString().split('T')[0])
        .lte("entry_date", weekEnd.toISOString().split('T')[0])
        .not("project_id", "is", null);

      if (error) throw error;

      const grouped = data?.reduce((acc: any, entry: any) => {
        const name = entry.projects?.name || "Unassigned";
        if (!acc[name]) {
          acc[name] = { name, hours: 0 };
        }
        acc[name].hours += Number(entry.total_hours);
        return acc;
      }, {});

      return Object.values(grouped || {});
    }
  });

  // Fetch weekly trend (last 4 weeks)
  const { data: trendData } = useQuery({
    queryKey: ["weekly-trend"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const weeks = Array.from({ length: 4 }, (_, i) => {
        const weekStart = startOfWeek(subWeeks(new Date(), 3 - i));
        const weekEnd = endOfWeek(subWeeks(new Date(), 3 - i));
        return { start: weekStart, end: weekEnd };
      });

      const weeklyData = await Promise.all(
        weeks.map(async ({ start, end }) => {
          const { data, error } = await supabase
            .from("timesheets")
            .select("regular_hours, overtime_hours")
            .eq("user_id", user.id)
            .gte("period_start", start.toISOString().split('T')[0])
            .lte("period_end", end.toISOString().split('T')[0]);

          if (error) throw error;

          const regular = data?.reduce((sum, ts) => sum + Number(ts.regular_hours), 0) || 0;
          const overtime = data?.reduce((sum, ts) => sum + Number(ts.overtime_hours), 0) || 0;

          return {
            week: format(start, "MMM d"),
            regular,
            overtime,
            total: regular + overtime
          };
        })
      );

      return weeklyData;
    }
  });

  const chartConfig = {
    regular: { label: "Regular Hours", color: "hsl(var(--primary))" },
    overtime: { label: "Overtime Hours", color: "hsl(var(--accent))" },
    total: { label: "Total Hours", color: "hsl(var(--secondary))" }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Time Tracking Dashboard</h1>
          <p className="text-muted-foreground">Weekly summaries and analytics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklySummary?.totalHours.toFixed(1) || 0}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regular Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklySummary?.totalRegular.toFixed(1) || 0}</div>
              <p className="text-xs text-muted-foreground">Standard time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklySummary?.totalOvertime.toFixed(1) || 0}</div>
              <p className="text-xs text-muted-foreground">Extra time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklySummary?.activeEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">Working this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trend" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trend">Weekly Trend</TabsTrigger>
            <TabsTrigger value="employees">By Employee</TabsTrigger>
            <TabsTrigger value="projects">By Project</TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>4-Week Trend</CardTitle>
                <CardDescription>Regular vs Overtime hours over the last 4 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={trendData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="regular" stroke="hsl(var(--primary))" name="Regular" strokeWidth={2} />
                    <Line type="monotone" dataKey="overtime" stroke="hsl(var(--accent))" name="Overtime" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Time by Employee</CardTitle>
                <CardDescription>Hours worked by each employee this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={employeeData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="regular" fill="hsl(var(--primary))" name="Regular" />
                    <Bar dataKey="overtime" fill="hsl(var(--accent))" name="Overtime" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Time by Project</CardTitle>
                <CardDescription>Hours allocated to each project this week</CardDescription>
              </CardHeader>
              <CardContent>
                {projectData && projectData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <PieChart>
                      <Pie
                        data={projectData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${entry.hours.toFixed(1)}h`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="hours"
                      >
                        {projectData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No project time tracked this week</p>
                      <p className="text-sm">Assign projects to time entries to see data here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
