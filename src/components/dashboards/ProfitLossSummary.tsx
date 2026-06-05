import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfitLossData } from '@/hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ArrowUp, ArrowDown, Minus, FileText, CheckCircle, Clock } from 'lucide-react';

export function ProfitLossSummary() {
  const { data, loading, error } = useProfitLossData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load P&L data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  const summaryItems = [
    { label: 'Total Income', value: data.income, type: 'income' },
    { label: 'Cost of Goods Sold', value: -data.cogs, type: 'expense' },
    { label: 'Operating Expenses', value: -data.operatingExpenses, type: 'expense' },
    { label: 'Net Income', value: data.netIncome, type: 'result', highlight: true }
  ];

  const chartData = [
    { name: 'Income', value: data.income, fill: '#10b981' },
    { name: 'COGS', value: data.cogs, fill: '#f59e0b' },
    { name: 'Op. Expenses', value: data.operatingExpenses, fill: '#ef4444' },
    { name: 'Net Income', value: Math.abs(data.netIncome), fill: data.netIncome >= 0 ? '#3b82f6' : '#ef4444' }
  ];

  const topCategories = data.categories
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Invoice breakdown for pie chart
  const invoiceData = [
    { name: 'Paid', value: data.paidInvoices, fill: '#10b981' },
    { name: 'Pending', value: data.pendingInvoices, fill: '#f59e0b' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Invoice Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Invoice Revenue
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.invoiceRevenue)}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Invoices
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{data.paidInvoices}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Invoices
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{data.pendingInvoices}</div>
            <p className="text-sm text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>P&L Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summaryItems.map((item, index) => (
                <div 
                  key={item.label}
                  className={`flex items-center justify-between py-2 ${
                    item.highlight ? 'border-t pt-4 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.type === 'income' && <ArrowUp className="h-4 w-4 text-emerald-500" />}
                    {item.type === 'expense' && <ArrowDown className="h-4 w-4 text-destructive" />}
                    {item.type === 'result' && <Minus className="h-4 w-4 text-primary" />}
                    <span className={item.highlight ? 'text-lg' : ''}>{item.label}</span>
                  </div>
                  <span className={`${
                    item.highlight 
                      ? item.value >= 0 ? 'text-emerald-500 text-lg' : 'text-destructive text-lg'
                      : item.type === 'income' ? 'text-emerald-500' : 'text-destructive'
                  }`}>
                    {formatCurrency(Math.abs(item.value))}
                  </span>
                </div>
              ))}
            </div>

            {topCategories.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">Top Categories</h4>
                <div className="space-y-2">
                  {topCategories.map((cat) => (
                    <div key={cat.name} className="flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span className={cat.type === 'income' ? 'text-emerald-500' : 'text-muted-foreground'}>
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>P&L Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Status Chart */}
      {invoiceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={invoiceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {invoiceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${value} invoices`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {invoiceData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm">
                      {item.name}: <span className="font-medium">{item.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
