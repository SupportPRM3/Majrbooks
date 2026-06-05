import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  Calculator,
  Lightbulb,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import CreateFinancialGoalDialog from "@/components/CreateFinancialGoalDialog";
import EditFinancialGoalDialog from "@/components/EditFinancialGoalDialog";
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from "date-fns";

interface FinancialGoal {
  id: string;
  name: string;
  description: string | null;
  category: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  due_date: string;
  status: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

const FinancialPlanning = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch goals and transactions in parallel
      const [goalsResult, transactionsResult] = await Promise.all([
        supabase
          .from("financial_goals")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user?.id)
          .order("date", { ascending: false })
      ]);

      if (goalsResult.error) throw goalsResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      
      if (goalsResult.data) setGoals(goalsResult.data);
      if (transactionsResult.data) setTransactions(transactionsResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const handleEditGoal = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setIsEditDialogOpen(true);
  };

  // Calculate monthly data from transactions
  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expenses: number }> = {};
    
    transactions.forEach((t) => {
      const monthKey = format(new Date(t.date), "yyyy-MM");
      if (!data[monthKey]) {
        data[monthKey] = { income: 0, expenses: 0 };
      }
      if (t.type === "income") {
        data[monthKey].income += Number(t.amount);
      } else {
        data[monthKey].expenses += Number(t.amount);
      }
    });
    
    return data;
  }, [transactions]);

  // Generate forecasts based on historical data
  const forecasts = useMemo(() => {
    const months = Object.keys(monthlyData).sort().slice(-3);
    
    if (months.length === 0) {
      // Return placeholder forecast if no data
      return Array.from({ length: 4 }, (_, i) => {
        const date = addMonths(new Date(), i + 1);
        return {
          month: format(date, "MMM yyyy"),
          income: 0,
          expenses: 0,
          profit: 0,
          trend: "up" as const,
        };
      });
    }

    // Calculate averages for forecasting
    const avgIncome = months.reduce((sum, m) => sum + monthlyData[m].income, 0) / months.length;
    const avgExpenses = months.reduce((sum, m) => sum + monthlyData[m].expenses, 0) / months.length;
    
    // Calculate growth rates
    let incomeGrowth = 0;
    let expenseGrowth = 0;
    if (months.length >= 2) {
      const lastMonth = monthlyData[months[months.length - 1]];
      const prevMonth = monthlyData[months[months.length - 2]];
      incomeGrowth = prevMonth.income > 0 ? (lastMonth.income - prevMonth.income) / prevMonth.income : 0;
      expenseGrowth = prevMonth.expenses > 0 ? (lastMonth.expenses - prevMonth.expenses) / prevMonth.expenses : 0;
    }

    return Array.from({ length: 4 }, (_, i) => {
      const date = addMonths(new Date(), i + 1);
      const growthFactor = 1 + (incomeGrowth * 0.5 * (i + 1));
      const expenseFactor = 1 + (expenseGrowth * 0.3 * (i + 1));
      
      const income = Math.round(avgIncome * growthFactor);
      const expenses = Math.round(avgExpenses * expenseFactor);
      const profit = income - expenses;
      
      return {
        month: format(date, "MMM yyyy"),
        income,
        expenses,
        profit,
        trend: profit > 0 ? "up" as const : "down" as const,
      };
    });
  }, [monthlyData]);

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalAssets = totalIncome - totalExpenses;
    
    // Calculate this month's savings
    const thisMonth = format(new Date(), "yyyy-MM");
    const thisMonthData = monthlyData[thisMonth] || { income: 0, expenses: 0 };
    const monthlySavings = thisMonthData.income - thisMonthData.expenses;
    
    // Calculate last month for comparison
    const lastMonth = format(subMonths(new Date(), 1), "yyyy-MM");
    const lastMonthData = monthlyData[lastMonth] || { income: 0, expenses: 0 };
    const lastMonthSavings = lastMonthData.income - lastMonthData.expenses;
    
    const savingsChange = lastMonthSavings > 0 
      ? ((monthlySavings - lastMonthSavings) / lastMonthSavings * 100).toFixed(1)
      : "0";
    
    const activeGoals = goals.filter((g) => g.status === "active").length;
    
    // Calculate projected growth based on goal progress
    const goalProgress = goals.reduce((sum, g) => {
      return sum + (g.current_amount / g.target_amount);
    }, 0);
    const avgProgress = goals.length > 0 ? (goalProgress / goals.length * 100) : 0;

    return [
      {
        label: "Total Assets",
        value: `$${Math.abs(totalAssets).toLocaleString()}`,
        change: totalAssets >= 0 ? "+12.5%" : "-",
        icon: DollarSign,
        trend: totalAssets >= 0 ? "up" : "down",
      },
      {
        label: "Monthly Savings",
        value: `$${Math.abs(monthlySavings).toLocaleString()}`,
        change: `${Number(savingsChange) >= 0 ? "+" : ""}${savingsChange}%`,
        icon: PiggyBank,
        trend: monthlySavings >= 0 ? "up" : "down",
      },
      {
        label: "Active Goals",
        value: activeGoals.toString(),
        change: `+${activeGoals}`,
        icon: Target,
        trend: "up",
      },
      {
        label: "Goal Progress",
        value: `${avgProgress.toFixed(1)}%`,
        change: avgProgress > 50 ? "On track" : "In progress",
        icon: TrendingUp,
        trend: avgProgress > 50 ? "up" : "down",
      },
    ];
  }, [transactions, monthlyData, goals]);

  // Generate dynamic insights based on real data
  const insights = useMemo(() => {
    const result: Array<{
      title: string;
      description: string;
      type: string;
      impact: string;
      icon: typeof CheckCircle;
    }> = [];

    // Check goals progress
    const behindGoals = goals.filter((g) => {
      const progress = g.current_amount / g.target_amount;
      const dueDate = new Date(g.due_date);
      const startDate = new Date(g.start_date);
      const now = new Date();
      const totalDays = (dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const expectedProgress = elapsedDays / totalDays;
      return progress < expectedProgress && g.status === "active";
    });

    if (behindGoals.length > 0) {
      result.push({
        title: "Goals Behind Schedule",
        description: `${behindGoals.length} goal(s) are behind their expected progress. Consider increasing contributions to: ${behindGoals.map((g) => g.name).join(", ")}.`,
        type: "warning",
        impact: "High",
        icon: AlertTriangle,
      });
    }

    // Check expense trends
    const months = Object.keys(monthlyData).sort().slice(-3);
    if (months.length >= 2) {
      const lastMonth = monthlyData[months[months.length - 1]];
      const prevMonth = monthlyData[months[months.length - 2]];
      
      if (lastMonth && prevMonth && lastMonth.expenses > prevMonth.expenses * 1.15) {
        result.push({
          title: "Expense Increase Alert",
          description: `Your expenses increased by ${((lastMonth.expenses / prevMonth.expenses - 1) * 100).toFixed(0)}% compared to last month. Review your spending categories.`,
          type: "warning",
          impact: "Medium",
          icon: AlertTriangle,
        });
      }

      if (lastMonth && prevMonth && lastMonth.income > prevMonth.income * 1.1) {
        result.push({
          title: "Income Growth",
          description: `Great news! Your income increased by ${((lastMonth.income / prevMonth.income - 1) * 100).toFixed(0)}% compared to last month.`,
          type: "success",
          impact: "High",
          icon: CheckCircle,
        });
      }
    }

    // Check savings rate
    const thisMonth = format(new Date(), "yyyy-MM");
    const thisMonthData = monthlyData[thisMonth];
    if (thisMonthData && thisMonthData.income > 0) {
      const savingsRate = (thisMonthData.income - thisMonthData.expenses) / thisMonthData.income * 100;
      if (savingsRate < 10) {
        result.push({
          title: "Low Savings Rate",
          description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income.`,
          type: "opportunity",
          impact: "High",
          icon: Info,
        });
      } else if (savingsRate >= 20) {
        result.push({
          title: "Excellent Savings",
          description: `Your savings rate of ${savingsRate.toFixed(1)}% exceeds recommended targets. Consider investing the surplus.`,
          type: "success",
          impact: "High",
          icon: CheckCircle,
        });
      }
    }

    // Default insight if no data
    if (result.length === 0) {
      result.push({
        title: "Start Tracking",
        description: "Add transactions and financial goals to receive personalized insights and recommendations.",
        type: "info",
        impact: "Medium",
        icon: Info,
      });
    }

    return result;
  }, [goals, monthlyData]);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lightbulb className="h-8 w-8 text-primary" />
              Financial Planning
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan, forecast, and explore strategies for your financial future
            </p>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Financial Goal
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {stat.trend === "up" ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span
                          className={`text-xs ${
                            stat.trend === "up"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Financial Goals</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  {goals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No financial goals yet. Create your first goal to get started.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {goals.slice(0, 3).map((goal) => {
                        const progress = Math.round((goal.current_amount / goal.target_amount) * 100);
                        return (
                          <div
                            key={goal.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:border-primary cursor-pointer transition-colors"
                            onClick={() => handleEditGoal(goal)}
                          >
                            <div>
                              <p className="font-medium">{goal.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ${goal.current_amount.toLocaleString()} / ${goal.target_amount.toLocaleString()}
                              </p>
                            </div>
                            <Badge variant={progress >= 75 ? "default" : "secondary"}>
                              {progress}%
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Add more data to receive personalized insights.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {insights.slice(0, 3).map((insight, index) => {
                        const Icon = insight.icon;
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                            <Icon className={`h-5 w-5 mt-0.5 ${
                              insight.type === "success" ? "text-green-600" :
                              insight.type === "warning" ? "text-yellow-600" :
                              "text-blue-600"
                            }`} />
                            <div>
                              <p className="font-medium text-sm">{insight.title}</p>
                              <p className="text-xs text-muted-foreground">{insight.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Financial Goals</CardTitle>
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No financial goals yet. Create your first goal to start planning.
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Goal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {goals.map((goal) => {
                      const progress = Math.round((goal.current_amount / goal.target_amount) * 100);
                      return (
                        <div
                          key={goal.id}
                          className="space-y-2 p-4 rounded-lg border hover:border-primary cursor-pointer transition-colors"
                          onClick={() => handleEditGoal(goal)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{goal.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                ${goal.current_amount.toLocaleString()} of $
                                {goal.target_amount.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={goal.status === "active" ? "default" : "secondary"}>
                                {goal.status}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(goal.due_date), "MMM d, yyyy")}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {progress}% complete
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Add transactions to generate accurate forecasts based on your spending patterns.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Projected Income</TableHead>
                        <TableHead>Projected Expenses</TableHead>
                        <TableHead>Projected Profit</TableHead>
                        <TableHead>Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecasts.map((forecast) => (
                        <TableRow key={forecast.month}>
                          <TableCell className="font-medium">
                            {forecast.month}
                          </TableCell>
                          <TableCell className="text-green-600">
                            ${forecast.income.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-red-600">
                            ${forecast.expenses.toLocaleString()}
                          </TableCell>
                          <TableCell className={`font-semibold ${forecast.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ${forecast.profit.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {forecast.trend === "up" ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        insight.type === "success" ? "bg-green-100 dark:bg-green-900" :
                        insight.type === "warning" ? "bg-yellow-100 dark:bg-yellow-900" :
                        "bg-blue-100 dark:bg-blue-900"
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          insight.type === "success" ? "text-green-600" :
                          insight.type === "warning" ? "text-yellow-600" :
                          "text-blue-600"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{insight.title}</h3>
                          <Badge variant="outline">{insight.impact} Impact</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>

      <CreateFinancialGoalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchData}
      />

      <EditFinancialGoalDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={fetchData}
        goal={selectedGoal}
      />
    </Layout>
  );
};

export default FinancialPlanning;
