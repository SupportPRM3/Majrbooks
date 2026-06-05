import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { useCashflowData } from '@/hooks/useDashboardData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';

export function CashflowSnapshot() {
  const { data, loading, error } = useCashflowData();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load cashflow data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  const metrics = [
    {
      title: 'Current Balance',
      value: data.currentBalance,
      icon: Wallet,
      color: 'text-primary'
    },
    {
      title: 'Upcoming Inflows',
      value: data.upcomingInflows,
      subtitle: 'Next 30 days',
      icon: ArrowUpRight,
      color: 'text-emerald-500'
    },
    {
      title: 'Upcoming Outflows',
      value: data.upcomingOutflows,
      subtitle: 'Next 30 days',
      icon: ArrowDownRight,
      color: 'text-destructive'
    },
    {
      title: 'Projected Net',
      value: data.projectedNet,
      icon: TrendingUp,
      color: data.projectedNet >= 0 ? 'text-emerald-500' : 'text-destructive'
    }
  ];

  const totalReconciled = data.reconciledAmount + data.unreconciledAmount;
  const reconciliationPercent = totalReconciled > 0 
    ? (data.reconciledAmount / totalReconciled) * 100 
    : 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.value < 0 ? 'text-destructive' : ''}`}>
                {formatCurrency(metric.value)}
              </div>
              {metric.subtitle && (
                <p className="text-sm text-muted-foreground">{metric.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reconciliation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Bank Reconciliation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reconciled Amount</span>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-500">{formatCurrency(data.reconciledAmount)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unreconciled Amount</span>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-500">{formatCurrency(data.unreconciledAmount)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reconciliation Progress</span>
                <span className="font-medium">{reconciliationPercent.toFixed(1)}%</span>
              </div>
              <Progress value={reconciliationPercent} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>30-Day Cash Projection</CardTitle>
        </CardHeader>
        <CardContent>
          {data.dailyProjection.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyProjection}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    interval={4}
                  />
                  <YAxis 
                    className="text-xs" 
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name === 'balance' ? 'Balance' : name]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#balanceGradient)"
                    strokeWidth={2}
                    name="Projected Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No cashflow data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
