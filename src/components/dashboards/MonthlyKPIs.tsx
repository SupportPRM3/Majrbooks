import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Percent, Flame, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useDashboardKPIs } from '@/hooks/useDashboardData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Progress } from '@/components/ui/progress';

export function MonthlyKPIs() {
  const { data, loading, error } = useDashboardKPIs();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load KPIs: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const kpis = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      change: data.revenueChange,
      previous: formatCurrency(data.previousRevenue),
      icon: DollarSign,
      positive: data.revenueChange >= 0
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(data.totalExpenses),
      change: data.expensesChange,
      previous: formatCurrency(data.previousExpenses),
      icon: DollarSign,
      positive: data.expensesChange <= 0
    },
    {
      title: 'Net Profit',
      value: formatCurrency(data.netProfit),
      icon: data.netProfit >= 0 ? TrendingUp : TrendingDown,
      positive: data.netProfit >= 0
    },
    {
      title: 'Gross Margin',
      value: `${data.grossMargin.toFixed(1)}%`,
      icon: Percent,
      positive: data.grossMargin >= 20
    },
    {
      title: 'Burn Rate',
      value: formatCurrency(data.burnRate),
      subtitle: 'per month',
      icon: Flame,
      positive: true
    },
    {
      title: 'Cash Runway',
      value: data.cashRunway >= 999 ? '∞' : `${data.cashRunway.toFixed(1)} months`,
      icon: Clock,
      positive: data.cashRunway >= 6
    }
  ];

  // Invoice metrics
  const invoiceMetrics = [
    {
      title: 'Total Invoiced',
      value: formatCurrency(data.totalInvoiced),
      icon: FileText,
      positive: true
    },
    {
      title: 'Paid Invoices',
      value: formatCurrency(data.totalPaid),
      icon: CheckCircle,
      positive: true
    },
    {
      title: 'Outstanding',
      value: formatCurrency(data.totalOutstanding),
      icon: AlertCircle,
      positive: data.totalOutstanding === 0
    }
  ];

  const totalTransactions = data.reconciledTransactions + data.unreconciledTransactions;
  const reconciliationPercent = totalTransactions > 0 
    ? (data.reconciledTransactions / totalTransactions) * 100 
    : 100;

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.positive ? 'text-emerald-500' : 'text-destructive'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.change !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className={kpi.positive ? 'text-emerald-500' : 'text-destructive'}>
                    {formatPercent(kpi.change)}
                  </span>
                  <span className="text-muted-foreground">vs {kpi.previous}</span>
                </div>
              )}
              {kpi.subtitle && (
                <p className="text-sm text-muted-foreground">{kpi.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoice Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {invoiceMetrics.map((metric) => (
            <Card key={metric.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.icon className={`h-4 w-4 ${metric.positive ? 'text-emerald-500' : 'text-amber-500'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Reconciliation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Reconciliation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {data.reconciledTransactions} of {totalTransactions} transactions reconciled
              </span>
              <span className="font-medium">{reconciliationPercent.toFixed(1)}%</span>
            </div>
            <Progress value={reconciliationPercent} className="h-2" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm">Reconciled: {data.reconciledTransactions}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm">Pending: {data.unreconciledTransactions}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  name="Expenses"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
