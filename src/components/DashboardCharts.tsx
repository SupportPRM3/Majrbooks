import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyData {
  month: string;
  outstandingInvoices: number;
  outstandingBills: number;
  amountReceived: number;
  amountSpent: number;
  profit: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  categories?: { name: string } | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  issue_date: string;
  amount: number;
  status: string;
}

type DateRange = '30d' | '3m' | '6m' | '1y' | 'custom';

export const DashboardCharts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('6m');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [revenueExpensesData, setRevenueExpensesData] = useState<MonthlyData[]>([]);
  const [totalProfitData, setTotalProfitData] = useState<{ month: string; profit: number }[]>([]);
  const [revenueStreamsData, setRevenueStreamsData] = useState<CategoryData[]>([]);
  const [spendingData, setSpendingData] = useState<CategoryData[]>([]);
  const [summaryData, setSummaryData] = useState({
    totalRevenue: 0,
    outstandingInvoices: 0,
    totalExpenses: 0,
    outstandingBills: 0,
  });
  
  // Dialog state for drill-down details
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogType, setDialogType] = useState<'revenue' | 'spending'>('revenue');
  const [selectedName, setSelectedName] = useState("");
  const [detailedTransactions, setDetailedTransactions] = useState<Transaction[]>([]);
  const [detailedInvoices, setDetailedInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, dateRange, customStartDate, customEndDate]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const invoicesChannel = supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invoicesChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [user]);

  const getDateRangeParams = () => {
    const today = new Date();
    
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      const daysDiff = Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthCount = Math.max(1, Math.ceil(daysDiff / 30));
      
      return {
        startDate: customStartDate,
        endDate: customEndDate,
        monthCount,
        formatLabel: (date: Date) => format(date, monthCount > 6 ? 'MMM' : 'MMM d'),
      };
    }
    
    switch (dateRange) {
      case '30d':
        return {
          startDate: subDays(today, 30),
          endDate: today,
          monthCount: 1,
          formatLabel: (date: Date) => format(date, 'MMM d'),
        };
      case '3m':
        return {
          startDate: subMonths(today, 3),
          endDate: today,
          monthCount: 3,
          formatLabel: (date: Date) => format(date, 'MMM').toUpperCase(),
        };
      case '6m':
        return {
          startDate: subMonths(today, 6),
          endDate: today,
          monthCount: 6,
          formatLabel: (date: Date) => format(date, 'MMM').toUpperCase(),
        };
      case '1y':
        return {
          startDate: subMonths(today, 12),
          endDate: today,
          monthCount: 12,
          formatLabel: (date: Date) => format(date, 'MMM').toUpperCase(),
        };
      default:
        return {
          startDate: subMonths(today, 6),
          endDate: today,
          monthCount: 6,
          formatLabel: (date: Date) => format(date, 'MMM').toUpperCase(),
        };
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const rangeParams = getDateRangeParams();
      const months = Array.from({ length: rangeParams.monthCount }, (_, i) => {
        const monthsBack = rangeParams.monthCount - 1 - i;
        const date = dateRange === '30d' 
          ? subDays(new Date(), monthsBack) 
          : subMonths(new Date(), monthsBack);
        return {
          date,
          start: dateRange === '30d' ? date : startOfMonth(date),
          end: dateRange === '30d' ? date : endOfMonth(date),
          label: rangeParams.formatLabel(date),
        };
      });
      
      // Fetch invoices within date range
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .gte('issue_date', rangeParams.startDate.toISOString())
        .lte('issue_date', rangeParams.endDate.toISOString());

      // Fetch transactions within date range
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .gte('date', rangeParams.startDate.toISOString())
        .lte('date', rangeParams.endDate.toISOString());

      // Calculate monthly data
      const monthlyData: MonthlyData[] = months.map(({ start, end, label }) => {
        const monthInvoices = invoices?.filter(inv => {
          const date = new Date(inv.issue_date);
          return date >= start && date <= end;
        }) || [];

        const monthTransactions = transactions?.filter(tx => {
          const date = new Date(tx.date);
          return date >= start && date <= end;
        }) || [];

        const paidInvoices = monthInvoices.filter(inv => inv.status === 'paid');
        const unpaidInvoices = monthInvoices.filter(inv => inv.status === 'sent' || inv.status === 'draft');
        
        const expenses = monthTransactions.filter(tx => tx.type === 'expense');
        const income = monthTransactions.filter(tx => tx.type === 'income');

        const amountReceived = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const outstandingInvoices = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const amountSpent = expenses.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const outstandingBills = 0; // You can add bills table later

        return {
          month: label,
          outstandingInvoices: Number((outstandingInvoices / 1000).toFixed(2)),
          outstandingBills: Number((outstandingBills / 1000).toFixed(2)),
          amountReceived: Number((amountReceived / 1000).toFixed(2)),
          amountSpent: Number((amountSpent / 1000).toFixed(2)),
          profit: Number(((amountReceived - amountSpent) / 1000).toFixed(2)),
        };
      });

      setRevenueExpensesData(monthlyData);
      setTotalProfitData(monthlyData.map(d => ({ month: d.month, profit: d.profit })));

      // Calculate summary
      const allPaidInvoices = invoices?.filter(inv => inv.status === 'paid') || [];
      const allUnpaidInvoices = invoices?.filter(inv => inv.status === 'sent' || inv.status === 'draft') || [];
      const allExpenses = transactions?.filter(tx => tx.type === 'expense') || [];
      
      setSummaryData({
        totalRevenue: allPaidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
        outstandingInvoices: allUnpaidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
        totalExpenses: allExpenses.reduce((sum, tx) => sum + Number(tx.amount), 0),
        outstandingBills: 0,
      });

      // Calculate revenue streams by client
      const clientRevenue = new Map<string, number>();
      invoices?.forEach(inv => {
        if (inv.status === 'paid') {
          const current = clientRevenue.get(inv.client_name) || 0;
          clientRevenue.set(inv.client_name, current + Number(inv.amount));
        }
      });

      const sortedClients = Array.from(clientRevenue.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const revenueChartColors = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
      ];

      setRevenueStreamsData(
        sortedClients.map(([name, value], index) => ({
          name,
          value: Number(value.toFixed(2)),
          color: revenueChartColors[index],
        }))
      );

      // Calculate spending by category
      const categorySpending = new Map<string, number>();
      allExpenses.forEach(tx => {
        const categoryName = tx.categories?.name || 'Uncategorized';
        const current = categorySpending.get(categoryName) || 0;
        categorySpending.set(categoryName, current + Number(tx.amount));
      });

      const sortedCategories = Array.from(categorySpending.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      setSpendingData(
        sortedCategories.map(([name, value], index) => ({
          name,
          value: Number(value.toFixed(2)),
          color: revenueChartColors[index],
        }))
      );

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevenueClick = async (data: CategoryData) => {
    if (!user || data.name === "No data") return;
    
    setDialogType('revenue');
    setSelectedName(data.name);
    setDialogTitle(`Revenue from ${data.name}`);
    setLoading(true);
    setDialogOpen(true);

    try {
      const rangeParams = getDateRangeParams();
      
      // Fetch invoices for this client
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_name', data.name)
        .gte('issue_date', rangeParams.startDate.toISOString())
        .lte('issue_date', new Date().toISOString())
        .order('issue_date', { ascending: false });

      setDetailedInvoices(invoices || []);
    } catch (error) {
      console.error('Error loading detailed invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpendingClick = async (data: CategoryData) => {
    if (!user || data.name === "No data") return;
    
    setDialogType('spending');
    setSelectedName(data.name);
    setDialogTitle(`Spending on ${data.name}`);
    setLoading(true);
    setDialogOpen(true);

    try {
      const rangeParams = getDateRangeParams();
      
      // Fetch transactions for this category
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', rangeParams.startDate.toISOString())
        .lte('date', new Date().toISOString())
        .order('date', { ascending: false });

      // Filter by category name
      const filtered = transactions?.filter(tx => 
        tx.categories?.name === data.name
      ) || [];

      setDetailedTransactions(filtered);
    } catch (error) {
      console.error('Error loading detailed transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const revenueExpensesDataDisplay = revenueExpensesData.length > 0 ? revenueExpensesData : [
  { month: "JUN", outstandingInvoices: 2.5, outstandingBills: 1.8, amountReceived: 3.2, amountSpent: 2.1 },
  { month: "JUL", outstandingInvoices: 3.1, outstandingBills: 2.2, amountReceived: 2.8, amountSpent: 2.5 },
  { month: "AUG", outstandingInvoices: 2.8, outstandingBills: 1.9, amountReceived: 3.5, amountSpent: 2.8 },
  { month: "SEP", outstandingInvoices: 3.5, outstandingBills: 2.5, amountReceived: 3.8, amountSpent: 3.2 },
  { month: "OCT", outstandingInvoices: 3.2, outstandingBills: 2.1, amountReceived: 4.1, amountSpent: 3.5 },
    { month: "NOV", outstandingInvoices: 3.8, outstandingBills: 2.8, amountReceived: 4.5, amountSpent: 3.8, profit: 0.7 },
  ];

  const totalProfitDataDisplay = totalProfitData.length > 0 ? totalProfitData : [
    { month: "JUN", profit: 1.2 },
    { month: "JUL", profit: 1.5 },
    { month: "AUG", profit: 1.8 },
    { month: "SEP", profit: 2.2 },
    { month: "OCT", profit: 2.8 },
    { month: "NOV", profit: 3.5 },
  ];

  const revenueStreamsDataDisplay = revenueStreamsData.length > 0 ? revenueStreamsData : [
    { name: "No data", value: 1, color: "hsl(var(--muted))" },
  ];

  const spendingDataDisplay = spendingData.length > 0 ? spendingData : [
    { name: "No data", value: 1, color: "hsl(var(--muted))" },
  ];

  const chartConfig = {
    outstandingInvoices: {
      label: "Outstanding Invoices",
      color: "hsl(var(--chart-1))",
    },
    outstandingBills: {
      label: "Outstanding Bills",
      color: "hsl(var(--chart-2))",
    },
    amountReceived: {
      label: "Amount Received",
      color: "hsl(var(--chart-3))",
    },
    amountSpent: {
      label: "Amount Spent",
      color: "hsl(var(--chart-4))",
    },
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6">
        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center justify-end gap-4">
          <Tabs value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <TabsList>
              <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
              <TabsTrigger value="3m">3 Months</TabsTrigger>
              <TabsTrigger value="6m">6 Months</TabsTrigger>
              <TabsTrigger value="1y">1 Year</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "PPP") : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "PPP") : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Revenue and Expenses Chart */}
        <Card>
        <CardHeader>
          <CardTitle>Revenue and Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={revenueExpensesDataDisplay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="outstandingInvoices" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Outstanding Invoices"
                    dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="outstandingBills" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Outstanding Bills"
                    dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amountReceived" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    name="Amount Received"
                    dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amountSpent" 
                    stroke="hsl(var(--chart-4))" 
                    strokeWidth={2}
                    name="Amount Spent"
                    dot={{ fill: "hsl(var(--chart-4))", r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
            <div className="lg:w-64 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Summary of the past 6 months</p>
                <div className="space-y-3 mt-4">
                  <div>
                    <p className="text-sm font-medium text-primary">Revenue</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">Amount Received</span>
                      <span className="text-sm font-semibold">${summaryData.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">Outstanding Invoices</span>
                      <span className="text-sm font-semibold">${summaryData.outstandingInvoices.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <p className="text-sm font-medium text-primary">Expenses</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">Amount Spent</span>
                      <span className="text-sm font-semibold">${summaryData.totalExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">Outstanding Bills</span>
                      <span className="text-sm font-semibold">${summaryData.outstandingBills.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Profit Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Total Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ profit: { label: "Profit", color: "hsl(var(--chart-3))" } }} className="h-[300px] w-full">
            <AreaChart data={totalProfitDataDisplay}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                fill="url(#colorProfit)" 
                name="Profit"
              />
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-sm font-medium fill-primary"
              >
                watch your profit grow
              </text>
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Revenue Streams and Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Streams */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Streams</CardTitle>
            <CardDescription>see where your money's coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={revenueStreamsDataDisplay}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(data) => handleRevenueClick(data)}
                  cursor="pointer"
                >
                  {revenueStreamsDataDisplay.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Spending */}
        <Card>
          <CardHeader>
            <CardTitle>Spending</CardTitle>
            <CardDescription>see where your money's going</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={spendingDataDisplay}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(data) => handleSpendingClick(data)}
                  cursor="pointer"
                >
                  {spendingDataDisplay.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Drill-down Dialog */}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Detailed breakdown for the selected {dialogType === 'revenue' ? 'client' : 'category'}
          </DialogDescription>
        </DialogHeader>

        {dialogType === 'revenue' ? (
          <div className="mt-4">
            {detailedInvoices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No invoices found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          className={invoice.status === 'paid' ? 'bg-green-500' : ''}
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${Number(invoice.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">
                      ${detailedInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <div className="mt-4">
            {detailedTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.categories?.name || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${Number(transaction.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">
                      ${detailedTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};
