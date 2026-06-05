import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthlyKPIs } from '@/components/dashboards/MonthlyKPIs';
import { CashflowSnapshot } from '@/components/dashboards/CashflowSnapshot';
import { ProfitLossSummary } from '@/components/dashboards/ProfitLossSummary';
import { AlertsCenter } from '@/components/dashboards/AlertsCenter';
import { TasksDueSoon } from '@/components/dashboards/TasksDueSoon';
import { 
  BarChart3, 
  Wallet, 
  FileText, 
  Bell, 
  CheckSquare,
  LayoutDashboard
} from 'lucide-react';

export default function FinancialDashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <LayoutDashboard className="h-8 w-8 text-primary" />
              Financial Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time overview of your business financials
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">KPIs</span>
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Cashflow</span>
            </TabsTrigger>
            <TabsTrigger value="pnl" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">P&L</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <MonthlyKPIs />
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-6">
            <CashflowSnapshot />
          </TabsContent>

          <TabsContent value="pnl" className="space-y-6">
            <ProfitLossSummary />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertsCenter />
              <TasksDueSoon />
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TasksDueSoon />
          </TabsContent>
        </Tabs>

        {/* Quick Overview Section - Always visible */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <AlertsCenter />
          </div>
          <div>
            <TasksDueSoon />
          </div>
        </div>
      </div>
    </Layout>
  );
}
