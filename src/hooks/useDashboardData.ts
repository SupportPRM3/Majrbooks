import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, addDays, format } from 'date-fns';

export interface KPIData {
  totalRevenue: number;
  previousRevenue: number;
  revenueChange: number;
  totalExpenses: number;
  previousExpenses: number;
  expensesChange: number;
  netProfit: number;
  grossMargin: number;
  burnRate: number;
  cashRunway: number;
  monthlyTrend: { month: string; revenue: number; expenses: number; profit: number }[];
  // Additional metrics from invoices
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  reconciledTransactions: number;
  unreconciledTransactions: number;
}

export interface CashflowData {
  currentBalance: number;
  upcomingInflows: number;
  upcomingOutflows: number;
  projectedNet: number;
  dailyProjection: { date: string; inflow: number; outflow: number; balance: number }[];
  // Reconciliation summary
  reconciledAmount: number;
  unreconciledAmount: number;
}

export interface ProfitLossData {
  income: number;
  cogs: number;
  operatingExpenses: number;
  netIncome: number;
  categories: { name: string; amount: number; type: string }[];
  // Invoice-based revenue
  invoiceRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
}

export interface Alert {
  id: string;
  alert_type: string;
  title: string;
  message: string | null;
  severity: string;
  is_read: boolean;
  created_at: string;
  reference_type: string | null;
  reference_id: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  priority: string;
  status: string;
  client_id: string | null;
  client_name?: string;
}

export function useDashboardKPIs() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKPIs() {
      try {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const previousMonthStart = startOfMonth(subMonths(now, 1));
        const previousMonthEnd = endOfMonth(subMonths(now, 1));

        // Fetch current month transactions
        const { data: currentTransactions, error: currentError } = await supabase
          .from('transactions')
          .select('*')
          .gte('date', format(currentMonthStart, 'yyyy-MM-dd'))
          .lte('date', format(currentMonthEnd, 'yyyy-MM-dd'));

        if (currentError) throw currentError;

        // Fetch previous month transactions
        const { data: previousTransactions, error: previousError } = await supabase
          .from('transactions')
          .select('*')
          .gte('date', format(previousMonthStart, 'yyyy-MM-dd'))
          .lte('date', format(previousMonthEnd, 'yyyy-MM-dd'));

        if (previousError) throw previousError;

        // Fetch last 6 months for trend
        const sixMonthsAgo = subMonths(now, 5);
        const { data: trendTransactions, error: trendError } = await supabase
          .from('transactions')
          .select('*')
          .gte('date', format(startOfMonth(sixMonthsAgo), 'yyyy-MM-dd'))
          .lte('date', format(currentMonthEnd, 'yyyy-MM-dd'));

        if (trendError) throw trendError;

        // Fetch bank balances for cash calculation
        const { data: accounts, error: accountsError } = await supabase
          .from('chart_of_accounts')
          .select('*')
          .eq('account_type', 'Asset')
          .in('detail_type', ['Cash', 'Bank', 'Checking', 'Savings']);

        if (accountsError) throw accountsError;

        // Fetch ALL invoices for accurate revenue calculation
        const { data: allInvoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('*');

        if (invoicesError) throw invoicesError;

        // Fetch current month invoices for trend
        const { data: currentInvoices, error: currentInvError } = await supabase
          .from('invoices')
          .select('*')
          .gte('issue_date', format(currentMonthStart, 'yyyy-MM-dd'))
          .lte('issue_date', format(currentMonthEnd, 'yyyy-MM-dd'));

        if (currentInvError) throw currentInvError;

        // Fetch previous month invoices
        const { data: previousInvoices, error: prevInvError } = await supabase
          .from('invoices')
          .select('*')
          .gte('issue_date', format(previousMonthStart, 'yyyy-MM-dd'))
          .lte('issue_date', format(previousMonthEnd, 'yyyy-MM-dd'));

        if (prevInvError) throw prevInvError;

        // Calculate invoice-based metrics
        const totalInvoiced = (allInvoices || []).reduce((sum, inv) => sum + Number(inv.amount), 0);
        const totalPaid = (allInvoices || [])
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + Number(inv.amount), 0);
        const totalOutstanding = (allInvoices || [])
          .filter(inv => inv.status !== 'paid' && inv.status !== 'draft')
          .reduce((sum, inv) => sum + Number(inv.amount) - Number(inv.amount_paid || 0), 0);

        // Calculate revenue from BOTH transactions AND paid invoices
        const transactionRevenue = (currentTransactions || [])
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const invoiceRevenue = (currentInvoices || [])
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + Number(inv.amount), 0);

        // Use the higher value or combine unique sources
        const totalRevenue = Math.max(transactionRevenue, invoiceRevenue) || transactionRevenue + invoiceRevenue;

        const totalExpenses = (currentTransactions || [])
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Previous month revenue calculation
        const prevTransactionRevenue = (previousTransactions || [])
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const prevInvoiceRevenue = (previousInvoices || [])
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + Number(inv.amount), 0);

        const previousRevenue = Math.max(prevTransactionRevenue, prevInvoiceRevenue) || prevTransactionRevenue + prevInvoiceRevenue;

        const previousExpenses = (previousTransactions || [])
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const revenueChange = previousRevenue > 0 
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
          : totalRevenue > 0 ? 100 : 0;

        const expensesChange = previousExpenses > 0 
          ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 
          : totalExpenses > 0 ? 100 : 0;

        const netProfit = totalRevenue - totalExpenses;
        const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
        
        // Calculate burn rate (average monthly expenses over last 3 months)
        const threeMonthsAgo = subMonths(now, 2);
        const recentExpenses = (trendTransactions || [])
          .filter(t => t.type === 'expense' && new Date(t.date) >= threeMonthsAgo)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const burnRate = recentExpenses / 3;

        // Cash runway
        const totalCash = (accounts || []).reduce((sum, a) => sum + Number(a.quickbooks_balance || 0), 0);
        const cashRunway = burnRate > 0 ? totalCash / burnRate : 999;

        // Reconciliation counts
        const reconciledTransactions = (currentTransactions || []).filter(t => t.is_reconciled).length;
        const unreconciledTransactions = (currentTransactions || []).filter(t => !t.is_reconciled).length;

        // Monthly trend - Include invoice data
        const monthlyTrend: KPIData['monthlyTrend'] = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          
          const monthTransactions = (trendTransactions || []).filter(t => {
            const date = new Date(t.date);
            return date >= monthStart && date <= monthEnd;
          });

          // Get invoices for this month
          const monthInvoices = (allInvoices || []).filter(inv => {
            const date = new Date(inv.issue_date);
            return date >= monthStart && date <= monthEnd;
          });

          const transactionMonthRevenue = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const invoiceMonthRevenue = monthInvoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + Number(inv.amount), 0);

          const monthRevenue = Math.max(transactionMonthRevenue, invoiceMonthRevenue) || transactionMonthRevenue + invoiceMonthRevenue;

          const monthExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          monthlyTrend.push({
            month: format(monthDate, 'MMM'),
            revenue: monthRevenue,
            expenses: monthExpenses,
            profit: monthRevenue - monthExpenses
          });
        }

        setData({
          totalRevenue,
          previousRevenue,
          revenueChange,
          totalExpenses,
          previousExpenses,
          expensesChange,
          netProfit,
          grossMargin,
          burnRate,
          cashRunway,
          monthlyTrend,
          totalInvoiced,
          totalPaid,
          totalOutstanding,
          reconciledTransactions,
          unreconciledTransactions
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KPIs');
      } finally {
        setLoading(false);
      }
    }

    fetchKPIs();
  }, []);

  return { data, loading, error };
}

export function useCashflowData() {
  const [data, setData] = useState<CashflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCashflow() {
      try {
        const now = new Date();
        const thirtyDaysFromNow = addDays(now, 30);

        // Fetch bank balances
        const { data: accounts, error: accountsError } = await supabase
          .from('chart_of_accounts')
          .select('*')
          .eq('account_type', 'Asset')
          .in('detail_type', ['Cash', 'Bank', 'Checking', 'Savings']);

        if (accountsError) throw accountsError;

        // Fetch upcoming invoices (inflows)
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .in('status', ['pending', 'sent'])
          .gte('due_date', format(now, 'yyyy-MM-dd'))
          .lte('due_date', format(thirtyDaysFromNow, 'yyyy-MM-dd'));

        if (invoicesError) throw invoicesError;

        // Fetch upcoming bills (outflows)
        const { data: bills, error: billsError } = await supabase
          .from('bills')
          .select('*')
          .eq('status', 'pending')
          .gte('due_date', format(now, 'yyyy-MM-dd'))
          .lte('due_date', format(thirtyDaysFromNow, 'yyyy-MM-dd'));

        if (billsError) throw billsError;

        // Fetch upcoming payroll
        const { data: payrollRuns, error: payrollError } = await supabase
          .from('payroll_runs')
          .select('*')
          .in('status', ['draft', 'approved'])
          .gte('pay_date', format(now, 'yyyy-MM-dd'))
          .lte('pay_date', format(thirtyDaysFromNow, 'yyyy-MM-dd'));

        if (payrollError) throw payrollError;

        // Fetch reconciliation data
        const { data: bankTransactions, error: bankTxError } = await supabase
          .from('bank_transactions')
          .select('*');

        if (bankTxError) throw bankTxError;

        const reconciledAmount = (bankTransactions || [])
          .filter(t => t.is_reconciled)
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

        const unreconciledAmount = (bankTransactions || [])
          .filter(t => !t.is_reconciled)
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

        const currentBalance = (accounts || []).reduce((sum, a) => sum + Number(a.quickbooks_balance || 0), 0);
        const upcomingInflows = (invoices || []).reduce((sum, i) => sum + Number(i.amount) - Number(i.amount_paid || 0), 0);
        const billsOutflow = (bills || []).reduce((sum, b) => sum + Number(b.amount), 0);
        const payrollOutflow = (payrollRuns || []).reduce((sum, p) => sum + Number(p.total_net_pay), 0);
        const upcomingOutflows = billsOutflow + payrollOutflow;
        const projectedNet = currentBalance + upcomingInflows - upcomingOutflows;

        // Generate daily projection
        const dailyProjection: CashflowData['dailyProjection'] = [];
        let runningBalance = currentBalance;
        
        for (let i = 0; i <= 30; i++) {
          const date = addDays(now, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          const dayInflows = (invoices || [])
            .filter(inv => inv.due_date === dateStr)
            .reduce((sum, inv) => sum + Number(inv.amount) - Number(inv.amount_paid || 0), 0);

          const dayBills = (bills || [])
            .filter(b => b.due_date === dateStr)
            .reduce((sum, b) => sum + Number(b.amount), 0);

          const dayPayroll = (payrollRuns || [])
            .filter(p => p.pay_date === dateStr)
            .reduce((sum, p) => sum + Number(p.total_net_pay), 0);

          const dayOutflows = dayBills + dayPayroll;
          runningBalance = runningBalance + dayInflows - dayOutflows;

          dailyProjection.push({
            date: format(date, 'MMM dd'),
            inflow: dayInflows,
            outflow: dayOutflows,
            balance: runningBalance
          });
        }

        setData({
          currentBalance,
          upcomingInflows,
          upcomingOutflows,
          projectedNet,
          dailyProjection,
          reconciledAmount,
          unreconciledAmount
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cashflow data');
      } finally {
        setLoading(false);
      }
    }

    fetchCashflow();
  }, []);

  return { data, loading, error };
}

export function useProfitLossData() {
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfitLoss() {
      try {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Fetch transactions with categories
        const { data: transactions, error: transError } = await supabase
          .from('transactions')
          .select(`
            *,
            categories (
              id,
              name,
              type
            )
          `)
          .gte('date', format(monthStart, 'yyyy-MM-dd'))
          .lte('date', format(monthEnd, 'yyyy-MM-dd'));

        if (transError) throw transError;

        // Fetch invoices for this month
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .gte('issue_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('issue_date', format(monthEnd, 'yyyy-MM-dd'));

        if (invoicesError) throw invoicesError;

        // Calculate invoice-based revenue
        const invoiceRevenue = (invoices || []).reduce((sum, inv) => sum + Number(inv.amount), 0);
        const paidInvoices = (invoices || []).filter(inv => inv.status === 'paid').length;
        const pendingInvoices = (invoices || []).filter(inv => inv.status !== 'paid' && inv.status !== 'draft').length;

        const transactionIncome = (transactions || [])
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Use invoice revenue if higher, otherwise use transaction income
        const income = Math.max(invoiceRevenue, transactionIncome) || transactionIncome + invoiceRevenue;

        const expenses = (transactions || [])
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Calculate COGS from expense transactions categorized as COGS
        const cogsTransactions = (transactions || [])
          .filter(t => t.type === 'expense' && t.categories?.name?.toLowerCase().includes('cost'))
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const cogs = cogsTransactions > 0 ? cogsTransactions : income * 0.3;
        const operatingExpenses = expenses - cogsTransactions;
        const netIncome = income - cogs - operatingExpenses;

        // Group by category
        const categoryMap = new Map<string, { amount: number; type: string }>();
        (transactions || []).forEach(t => {
          const categoryName = t.categories?.name || 'Uncategorized';
          const existing = categoryMap.get(categoryName) || { amount: 0, type: t.type };
          categoryMap.set(categoryName, {
            amount: existing.amount + Number(t.amount),
            type: t.type
          });
        });

        // Add invoice revenue as a category if significant
        if (invoiceRevenue > 0) {
          const existing = categoryMap.get('Invoice Revenue') || { amount: 0, type: 'income' };
          categoryMap.set('Invoice Revenue', {
            amount: existing.amount + invoiceRevenue,
            type: 'income'
          });
        }

        const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
          name,
          amount: data.amount,
          type: data.type
        }));

        setData({
          income,
          cogs,
          operatingExpenses,
          netIncome,
          categories,
          invoiceRevenue,
          paidInvoices,
          pendingInvoices
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load P&L data');
      } finally {
        setLoading(false);
      }
    }

    fetchProfitLoss();
  }, []);

  return { data, loading, error };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const { data, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false })
          .limit(20);

        if (alertsError) throw alertsError;
        setAlerts(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  const markAsRead = async (alertId: string) => {
    await supabase.from('alerts').update({ is_read: true }).eq('id', alertId);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
  };

  const dismissAlert = async (alertId: string) => {
    await supabase.from('alerts').update({ is_dismissed: true }).eq('id', alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  return { alerts, loading, error, markAsRead, dismissAlert };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const now = new Date();
        const sevenDaysFromNow = addDays(now, 7);

        const { data, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            *,
            clients (
              client_name
            )
          `)
          .in('status', ['pending', 'in_progress'])
          .lte('due_date', format(sevenDaysFromNow, 'yyyy-MM-dd'))
          .order('due_date', { ascending: true });

        if (tasksError) throw tasksError;

        const tasksWithClient = (data || []).map(t => ({
          ...t,
          client_name: t.clients?.client_name
        }));

        setTasks(tasksWithClient);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  const completeTask = async (taskId: string) => {
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return { tasks, loading, error, completeTask };
}
