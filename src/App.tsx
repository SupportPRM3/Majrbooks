import { Toaster } from "@/components/ui/toaster";
import DashboardTourGuide from "./pages/guides/DashboardTourGuide";
import RecurringInvoicesGuide from "./pages/guides/RecurringInvoicesGuide";
import GeneratingReportsGuide from "./pages/guides/GeneratingReportsGuide";
import FAQs from "./pages/help/FAQs";
import TroubleshootingGuide from "./pages/help/TroubleshootingGuide";
import ContactSupport from "./pages/help/ContactSupport";
import LiveWebinars from "./pages/help/LiveWebinars";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientRouteGuard from "@/components/ClientRouteGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ClientPortal from "./pages/ClientPortal";
import ClientInvoices from "./pages/ClientInvoices";
import ClientDetails from "./pages/ClientDetails";
import Transactions from "./pages/Transactions";
import BankTransactions from "./pages/BankTransactions";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import StandardReports from "./pages/StandardReports";
import ExpenseTracking from "./pages/ExpenseTracking";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import InvoiceTemplates from "./pages/InvoiceTemplates";
import TaxReturns from "./pages/TaxReturns";
import Team from "./pages/Team";
import BulkClientUpload from "./pages/BulkClientUpload";
import BulkClientNumbers from "./pages/BulkClientNumbers";
import Payroll from "./pages/Payroll";
import PayrollSetup from "./pages/PayrollSetup";
import PayrollRuns from "./pages/PayrollRuns";
import Timesheets from "./pages/Timesheets";
import PTOManagement from "./pages/PTOManagement";
import TimeTrackingDashboard from "./pages/TimeTrackingDashboard";
import TimeTrackingAnalytics from "./pages/TimeTrackingAnalytics";
import BillableHoursForecast from "./pages/BillableHoursForecast";
import Form1099History from "./pages/Form1099History";
import Projects from "./pages/Projects";
import FinancialPlanning from "./pages/FinancialPlanning";
import WorkflowAutomation from "./pages/WorkflowAutomation";
import Accounting from "./pages/Accounting";
import JournalEntries from "./pages/JournalEntries";
import JournalEntryReport from "./pages/JournalEntryReport";
import ProfitAndLoss from "./pages/ProfitAndLoss";
import BalanceSheet from "./pages/BalanceSheet";
import CashFlow from "./pages/CashFlow";
import GeneralLedger from "./pages/GeneralLedger";
import RevenueByClient from "./pages/RevenueByClient";
import TrialBalance from "./pages/TrialBalance";
import BankReconciliation from "./pages/BankReconciliation";
import SalesTaxSummary from "./pages/SalesTaxSummary";
import InvoiceEditor from "./pages/InvoiceEditor";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import ClientSubscriptions from "./pages/billing/ClientSubscriptions";
import ProductRecommendations from "./pages/billing/ProductRecommendations";
import DiscoverMore from "./pages/billing/DiscoverMore";
import FirmSubscriptions from "./pages/billing/FirmSubscriptions";
import BillingDetails from "./pages/billing/BillingDetails";
import RevenueShare from "./pages/billing/RevenueShare";
import ClientInvitations from "./pages/ClientInvitations";
import FinancialDashboard from "./pages/FinancialDashboard";
import Tasks from "./pages/Tasks";
import TaxMajrAi from "./pages/TaxMajrAi";
import TaxMajrAiLogin from "./pages/TaxMajrAiLogin";
import Resources from "./pages/Resources";
import GettingStartedGuide from "./pages/GettingStartedGuide";
import UserPermissions from "./pages/UserPermissions";
import AdminDashboard from "./pages/AdminDashboard";
import BookkeepingDashboard from "./pages/BookkeepingDashboard";
import PayrollDashboard from "./pages/PayrollDashboard";
import MultiEntity from "./pages/MultiEntity";
import InvoicesGuide from "./pages/guides/InvoicesGuide";
import ReconcileAccountsGuide from "./pages/guides/ReconcileAccountsGuide";
import ExpenseTrackingGuide from "./pages/guides/ExpenseTrackingGuide";
import EndOfMonthCloseGuide from "./pages/guides/EndOfMonthCloseGuide";
import CommonExpenseCategories from "./pages/resources/CommonExpenseCategories";
import TaxDeductionsCheatSheet from "./pages/resources/TaxDeductionsCheatSheet";
import YearEndTaxPrepGuide from "./pages/resources/YearEndTaxPrepGuide";
import BusinessStructureComparison from "./pages/resources/BusinessStructureComparison";
import FinancialStatementsGuide from "./pages/resources/FinancialStatementsGuide";
import InvoiceTemplate from "./pages/templates/InvoiceTemplate";
import ExpenseReportTemplate from "./pages/templates/ExpenseReportTemplate";
import BookkeepingChecklists from "./pages/templates/BookkeepingChecklists";
import CashFlowTemplate from "./pages/templates/CashFlowTemplate";
import PayrollSummaryTemplate from "./pages/templates/PayrollSummaryTemplate";
import TaxWithholdingCalculator from "./pages/calculators/TaxWithholdingCalculator";
import ProfitCalculator from "./pages/calculators/ProfitCalculator";
import BreakEvenCalculator from "./pages/calculators/BreakEvenCalculator";
import PayrollCostEstimator from "./pages/calculators/PayrollCostEstimator";
import NotFound from "./pages/NotFound";
import AcceptClientInvite from "./pages/AcceptClientInvite";
import ClientSettings from "./pages/ClientSettings";
import ClientBookkeepingAI from "./pages/ClientBookkeepingAI";
import ClientOnboarding from "./pages/ClientOnboarding";
import ClientSupport from "./pages/ClientSupport";
import ClientDocuments from "./pages/ClientDocuments";
import Training from "./pages/Training";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ── Public (no auth required) ── */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/accept-client-invite" element={<AcceptClientInvite />} />

            {/* ── Client-only routes ── */}
            <Route element={<ClientRouteGuard requireClient />}>
              <Route path="/client-portal" element={<ClientPortal />} />
              <Route path="/client-invoices" element={<ClientInvoices />} />
              <Route path="/client-documents" element={<ClientDocuments />} />
              <Route path="/client-settings" element={<ClientSettings />} />
              <Route path="/client-support" element={<ClientSupport />} />
              <Route path="/client-onboarding" element={<ClientOnboarding />} />
              <Route path="/client-ai" element={<ClientBookkeepingAI />} />
            </Route>

            {/* ── Admin-only routes ── */}
            <Route element={<ClientRouteGuard requireAdmin />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/team" element={<Team />} />
              <Route path="/user-permissions" element={<UserPermissions />} />
              <Route path="/bulk-client-upload" element={<BulkClientUpload />} />
              <Route path="/bulk-client-numbers" element={<BulkClientNumbers />} />
            </Route>

            {/* ── Staff routes (user + admin, clients blocked) ── */}
            <Route element={<ClientRouteGuard requireStaff />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/client/:id" element={<ClientDetails />} />
              <Route path="/client-invitations" element={<ClientInvitations />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/bank-transactions" element={<BankTransactions />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoice-templates" element={<InvoiceTemplates />} />
              <Route path="/invoice/:id?" element={<InvoiceEditor />} />
              <Route path="/tax-returns" element={<TaxReturns />} />
              <Route path="/tax-majr-ai" element={<TaxMajrAiLogin />} />
              <Route path="/tax-majr-ai-dashboard" element={<TaxMajrAi />} />
              <Route path="/bookkeeping" element={<BookkeepingDashboard />} />
              <Route path="/payroll-setup" element={<PayrollSetup />} />
              <Route path="/payroll-runs" element={<PayrollRuns />} />
              <Route path="/payroll-dashboard" element={<PayrollDashboard />} />
              <Route path="/payroll/:id" element={<Payroll />} />
              <Route path="/timesheets" element={<Timesheets />} />
              <Route path="/time-tracking-dashboard" element={<TimeTrackingDashboard />} />
              <Route path="/time-tracking-analytics" element={<TimeTrackingAnalytics />} />
              <Route path="/billable-forecast" element={<BillableHoursForecast />} />
              <Route path="/pto-management" element={<PTOManagement />} />
              <Route path="/1099-history" element={<Form1099History />} />
              <Route path="/multi-entity" element={<MultiEntity />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/standard-reports" element={<StandardReports />} />
              <Route path="/expense-tracking" element={<ExpenseTracking />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/training" element={<Training />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/financial-planning" element={<FinancialPlanning />} />
              <Route path="/workflow-automation" element={<WorkflowAutomation />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="/journal-entries" element={<JournalEntries />} />
              <Route path="/journal-entry-report" element={<JournalEntryReport />} />
              <Route path="/profit-and-loss" element={<ProfitAndLoss />} />
              <Route path="/balance-sheet" element={<BalanceSheet />} />
              <Route path="/cash-flow" element={<CashFlow />} />
              <Route path="/general-ledger" element={<GeneralLedger />} />
              <Route path="/revenue-by-client" element={<RevenueByClient />} />
              <Route path="/trial-balance" element={<TrialBalance />} />
              <Route path="/bank-reconciliation" element={<BankReconciliation />} />
              <Route path="/sales-tax-summary" element={<SalesTaxSummary />} />
              <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="/financial-dashboard" element={<FinancialDashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/billing/client-subscriptions" element={<ClientSubscriptions />} />
              <Route path="/billing/product-recommendations" element={<ProductRecommendations />} />
              <Route path="/billing/discover-more" element={<DiscoverMore />} />
              <Route path="/billing/firm-subscriptions" element={<FirmSubscriptions />} />
              <Route path="/billing/billing-details" element={<BillingDetails />} />
              <Route path="/billing/revenue-share" element={<RevenueShare />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/resources/getting-started" element={<GettingStartedGuide />} />
              <Route path="/resources/invoices-guide" element={<InvoicesGuide />} />
              <Route path="/resources/reconcile-accounts" element={<ReconcileAccountsGuide />} />
              <Route path="/resources/expense-tracking" element={<ExpenseTrackingGuide />} />
              <Route path="/resources/end-of-month-close" element={<EndOfMonthCloseGuide />} />
              <Route path="/resources/expense-categories" element={<CommonExpenseCategories />} />
              <Route path="/resources/tax-deductions" element={<TaxDeductionsCheatSheet />} />
              <Route path="/resources/year-end-tax-prep" element={<YearEndTaxPrepGuide />} />
              <Route path="/resources/business-structure" element={<BusinessStructureComparison />} />
              <Route path="/resources/financial-statements" element={<FinancialStatementsGuide />} />
              <Route path="/templates/invoice" element={<InvoiceTemplate />} />
              <Route path="/templates/expense-report" element={<ExpenseReportTemplate />} />
              <Route path="/templates/bookkeeping-checklists" element={<BookkeepingChecklists />} />
              <Route path="/templates/cash-flow" element={<CashFlowTemplate />} />
              <Route path="/templates/payroll-summary" element={<PayrollSummaryTemplate />} />
              <Route path="/resources/dashboard-tour" element={<DashboardTourGuide />} />
              <Route path="/resources/recurring-invoices" element={<RecurringInvoicesGuide />} />
              <Route path="/resources/generating-reports" element={<GeneratingReportsGuide />} />
              <Route path="/resources/faqs" element={<FAQs />} />
              <Route path="/resources/troubleshooting" element={<TroubleshootingGuide />} />
              <Route path="/resources/contact-support" element={<ContactSupport />} />
              <Route path="/resources/live-webinars" element={<LiveWebinars />} />
              <Route path="/calculators/tax-withholding" element={<TaxWithholdingCalculator />} />
              <Route path="/calculators/profit" element={<ProfitCalculator />} />
              <Route path="/calculators/break-even" element={<BreakEvenCalculator />} />
              <Route path="/calculators/payroll-cost" element={<PayrollCostEstimator />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
