import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankLinkingFlow, LinkedBankAccount } from "@/components/BankLinkingFlow";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Banknote,
  Link as LinkIcon,
  RefreshCw,
  Compass,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  ArrowRight,
  Search,
  Printer,
  Download,
  Settings as SettingsIcon,
  ChevronDown,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  MoreVertical,
  Info,
  Upload,
  Cloud,
  CalendarIcon,
  ChevronRight,
  Plus,
  MessageSquare,
  FileText,
  Eye,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AddTransactionDialog } from "@/components/bank-transactions/AddTransactionDialog";
import { DeleteTransactionDialog } from "@/components/bank-transactions/DeleteTransactionDialog";
import { TransactionSettingsDialog } from "@/components/bank-transactions/TransactionSettingsDialog";
import { ConnectAppDialog, appConfigs } from "@/components/bank-transactions/ConnectAppDialog";
import { ImportTransactionsDialog } from "@/components/bank-transactions/ImportTransactionsDialog";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  category_id: string | null;
  categories?: { name: string; color: string };
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface ChartAccount {
  id: string;
  name: string;
  accountType: string;
  detailType: string;
  quickbooksBalance: number;
  bankBalance: number | null;
  actionType: "register" | "report";
}

interface RecurringTransaction {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  type: string;
  category_id: string | null;
  categories?: { name: string; color: string };
  frequency: string;
  start_date: string;
  end_date: string | null;
  next_occurrence: string;
  is_active: boolean;
}

interface TransactionRule {
  id: string;
  rule_name: string;
  priority: number;
  applied_to: string | null;
  conditions: any;
  settings: any;
  auto_add: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

const BankTransactions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusTab, setStatusTab] = useState("review");
  const [selectedAccount, setSelectedAccount] = useState("checking");
  const [showBankLinking, setShowBankLinking] = useState(false);
  const [linkedBankAccounts, setLinkedBankAccounts] = useState<LinkedBankAccount[]>([]);
  
  // Reconcile form state
  const [reconcileAccount, setReconcileAccount] = useState("checking");
  const [beginningBalance] = useState("0.00");
  const [endingBalance, setEndingBalance] = useState("");
  const [endingDate, setEndingDate] = useState<Date>();
  const [serviceChargeDate, setServiceChargeDate] = useState<Date>();
  const [serviceCharge, setServiceCharge] = useState("");
  const [expenseAccount, setExpenseAccount] = useState("");
  const [interestDate, setInterestDate] = useState<Date>();
  const [interestEarned, setInterestEarned] = useState("");
  const [incomeAccount, setIncomeAccount] = useState("");
  const [isReconciling, setIsReconciling] = useState(false);
  const [clearedTransactions, setClearedTransactions] = useState<Set<string>>(new Set());
  
  // Adjusting entry dialog state
  const [showAdjustingEntry, setShowAdjustingEntry] = useState(false);
  const [adjustingType, setAdjustingType] = useState<"income" | "expense">("expense");
  const [adjustingAmount, setAdjustingAmount] = useState("");
  const [adjustingDescription, setAdjustingDescription] = useState("");
  const [adjustingDate, setAdjustingDate] = useState<Date>(new Date());
  const [adjustingCategory, setAdjustingCategory] = useState("");
  
  // Chart of accounts state
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [chartSearch, setChartSearch] = useState("");
  const [chartFilter, setChartFilter] = useState("all");
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  
  // Account register state
  const [showAccountRegister, setShowAccountRegister] = useState(false);
  const [selectedAccountForRegister, setSelectedAccountForRegister] = useState<ChartAccount | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>([]);
  
  // Recurring transactions state
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [recurringName, setRecurringName] = useState("");
  const [recurringDescription, setRecurringDescription] = useState("");
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringType, setRecurringType] = useState<"income" | "expense">("expense");
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [recurringCategory, setRecurringCategory] = useState("");
  const [recurringStartDate, setRecurringStartDate] = useState<Date>();
  const [recurringEndDate, setRecurringEndDate] = useState<Date>();

  // Transaction rules state
  const [transactionRules, setTransactionRules] = useState<TransactionRule[]>([]);
  const [rulesSearchQuery, setRulesSearchQuery] = useState("");

  // Add/Edit/Delete transaction dialog state
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [showDeleteTransaction, setShowDeleteTransaction] = useState(false);
  const [appTransactionsSearch, setAppTransactionsSearch] = useState("");

  // Connected apps state
  const [connectedApps, setConnectedApps] = useState<Set<string>>(new Set());
  const [showConnectAppDialog, setShowConnectAppDialog] = useState(false);
  const [selectedAppToConnect, setSelectedAppToConnect] = useState<string | null>(null);

  // Receipts state
  interface Receipt {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number | null;
    file_type: string | null;
    description: string | null;
    amount: number | null;
    receipt_date: string | null;
    status: string;
    created_at: string;
    merchant_name: string | null;
    tax_amount: number | null;
    payment_method: string | null;
    category: string | null;
    ai_confidence: number | null;
    ai_processed_at: string | null;
  }
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [uploadingReceipts, setUploadingReceipts] = useState(false);
  const [showReceiptSettings, setShowReceiptSettings] = useState(false);
  const [autoMatchReceipts, setAutoMatchReceipts] = useState(true);
  const [defaultReceiptCategory, setDefaultReceiptCategory] = useState("");
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Transaction settings dialog state
  const [showTransactionSettings, setShowTransactionSettings] = useState(false);

  // Import transactions dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleConnectApp = (appId: string) => {
    setSelectedAppToConnect(appId);
    setShowConnectAppDialog(true);
  };

  const handleAppConnected = (appId: string) => {
    setConnectedApps((prev) => new Set([...prev, appId]));
  };

  const handleDisconnectApp = (appId: string) => {
    setConnectedApps((prev) => {
      const newSet = new Set(prev);
      newSet.delete(appId);
      return newSet;
    });
    toast.success(`${appConfigs[appId]?.name || "App"} disconnected`);
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchCategories();
      fetchChartAccounts();
      fetchRecurringTransactions();
      fetchTransactionRules();
      fetchReceipts();
      fetchLinkedBankAccounts();
    }
  }, [user]);

  const fetchLinkedBankAccounts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("client_bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setLinkedBankAccounts(data as LinkedBankAccount[]);
    } catch (error) {
      console.error("Error fetching linked bank accounts:", error);
    }
  };

  const handleBankLinkingSuccess = (accounts: LinkedBankAccount[]) => {
    setLinkedBankAccounts(prev => [...accounts, ...prev]);
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0].id);
    }
  };

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setReceipts(data);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    }
  };

  const handleUploadReceipts = async (files: FileList) => {
    if (!user) return;
    
    setUploadingReceipts(true);
    const uploadedReceipts: Receipt[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Create receipt record with 'analyzing' status
        const { data: receiptData, error: receiptError } = await supabase
          .from("receipts")
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_type: file.type,
            status: 'analyzing',
          })
          .select()
          .single();

        if (receiptError) {
          console.error("Receipt record error:", receiptError);
          toast.error(`Failed to save ${file.name} record`);
          continue;
        }

        if (receiptData) {
          uploadedReceipts.push(receiptData);
        }
      }

      if (uploadedReceipts.length > 0) {
        toast.success(`${uploadedReceipts.length} receipt(s) uploaded. AI is analyzing...`);
        fetchReceipts();
        
        // Trigger AI analysis for each uploaded receipt
        for (const receipt of uploadedReceipts) {
          analyzeReceiptWithAI(receipt);
        }
      }
    } catch (error) {
      console.error("Error uploading receipts:", error);
      toast.error("Failed to upload receipts");
    } finally {
      setUploadingReceipts(false);
    }
  };

  const analyzeReceiptWithAI = async (receipt: Receipt) => {
    try {
      // Get a signed URL for the receipt image
      const { data: signedUrlData } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receipt.file_path, 3600);
      
      if (!signedUrlData?.signedUrl) {
        console.error("Failed to get signed URL for receipt");
        return;
      }

      // Call the AI analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-receipt', {
        body: {
          receiptId: receipt.id,
          imageUrl: signedUrlData.signedUrl
        }
      });

      if (error) {
        console.error("AI analysis error:", error);
        toast.error(`Failed to analyze ${receipt.file_name}`);
        
        // Update status to failed
        await supabase
          .from("receipts")
          .update({ status: 'failed' })
          .eq("id", receipt.id);
        return;
      }

      if (data?.success) {
        toast.success(`📸 AI extracted data from ${receipt.file_name}`, {
          description: `${data.data.merchant_name || 'Unknown'} - $${data.data.total_amount?.toFixed(2) || '0.00'}`
        });
        fetchReceipts();
      }
    } catch (error) {
      console.error("Error in AI analysis:", error);
    }
  };


  const handleDeleteReceipt = async (receipt: Receipt) => {
    if (!confirm("Are you sure you want to delete this receipt?")) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('receipts')
        .remove([receipt.file_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // Delete record
      const { error } = await supabase
        .from("receipts")
        .delete()
        .eq("id", receipt.id);

      if (error) throw error;

      toast.success("Receipt deleted");
      fetchReceipts();
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast.error("Failed to delete receipt");
    }
  };

  const getReceiptUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from('receipts')
        .createSignedUrl(filePath, 3600);
      
      return data?.signedUrl || null;
    } catch (error) {
      console.error("Error getting receipt URL:", error);
      return null;
    }
  };

  // Print transactions
  const handlePrintTransactions = () => {
    const printContent = transactions.map(t => ({
      date: format(new Date(t.date), "MMM dd, yyyy"),
      description: t.description,
      type: t.type,
      category: t.categories?.name || "Uncategorized",
      amount: t.type === "income" 
        ? `+$${t.amount.toLocaleString()}` 
        : `-$${t.amount.toLocaleString()}`
    }));

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bank Transactions</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              tr:nth-child(even) { background-color: #fafafa; }
              .income { color: #16a34a; }
              .expense { color: #dc2626; }
              .footer { margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <h1>Bank Transactions</h1>
            <p>Generated on ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}</p>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${printContent.map(t => `
                  <tr>
                    <td>${t.date}</td>
                    <td>${t.description}</td>
                    <td style="text-transform: capitalize;">${t.type}</td>
                    <td>${t.category}</td>
                    <td class="${t.type}">${t.amount}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="footer">
              <p>Total Transactions: ${transactions.length}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Download transactions as CSV
  const handleDownloadTransactions = () => {
    const headers = ["Date", "Description", "Type", "Category", "Amount"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => [
        format(new Date(t.date), "yyyy-MM-dd"),
        `"${t.description.replace(/"/g, '""')}"`,
        t.type,
        t.categories?.name || "Uncategorized",
        t.type === "income" ? t.amount : -t.amount
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transactions exported successfully");
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, categories(name, color)")
        .eq("user_id", user?.id)
        .order("date", { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchChartAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      
      if (data && data.length === 0) {
        // Initialize default accounts if none exist
        await initializeDefaultAccounts();
      } else if (data) {
        const mappedAccounts: ChartAccount[] = data.map(acc => ({
          id: acc.id,
          name: acc.name,
          accountType: acc.account_type,
          detailType: acc.detail_type,
          quickbooksBalance: Number(acc.quickbooks_balance),
          bankBalance: acc.bank_balance ? Number(acc.bank_balance) : null,
          actionType: acc.action_type as "register" | "report",
        }));
        setChartAccounts(mappedAccounts);
      }
    } catch (error) {
      console.error("Error fetching chart accounts:", error);
    }
  };

  const initializeDefaultAccounts = async () => {
    const defaultAccounts = [
      { name: "Checking", account_type: "Bank", detail_type: "Checking", action_type: "register", bank_balance: 0 },
      { name: "QuickBooks Checking Account", account_type: "Bank", detail_type: "Checking", action_type: "register", bank_balance: 0 },
      { name: "Inventory Asset", account_type: "Other Current Assets", detail_type: "Inventory", action_type: "register" },
      { name: "Uncategorized Asset", account_type: "Other Current Assets", detail_type: "Other Current Assets", action_type: "register" },
      { name: "Undeposited Funds", account_type: "Other Current Assets", detail_type: "Undeposited Funds", action_type: "register" },
      { name: "Opening Balance Equity", account_type: "Equity", detail_type: "Opening Balance Equity", action_type: "register" },
      { name: "Retained Earnings", account_type: "Equity", detail_type: "Retained Earnings", action_type: "report" },
      { name: "Billable Expense Income", account_type: "Income", detail_type: "Service/Fee Income", action_type: "report" },
      { name: "Sales of Product Income", account_type: "Income", detail_type: "Sales of Product Income", action_type: "report" },
      { name: "Services", account_type: "Income", detail_type: "Service/Fee Income", action_type: "report" },
      { name: "Uncategorized Income", account_type: "Income", detail_type: "Service/Fee Income", action_type: "report" },
      { name: "Cost of Goods Sold", account_type: "Cost of Goods Sold", detail_type: "Supplies & Materials - COGS", action_type: "report" },
      { name: "Purchases", account_type: "Expenses", detail_type: "Supplies & Materials", action_type: "report" },
      { name: "Uncategorized Expense", account_type: "Expenses", detail_type: "Other Miscellaneous Service Cost", action_type: "report" },
      { name: "Reconciliation Discrepancies", account_type: "Other Expenses", detail_type: "Other Miscellaneous Expense", action_type: "report" },
    ];

    try {
      const accountsToInsert = defaultAccounts.map(acc => ({
        user_id: user?.id,
        name: acc.name,
        account_type: acc.account_type,
        detail_type: acc.detail_type,
        action_type: acc.action_type,
        bank_balance: acc.bank_balance !== undefined ? acc.bank_balance : null,
        quickbooks_balance: 0,
      }));

      const { error } = await supabase
        .from("chart_of_accounts")
        .insert(accountsToInsert);

      if (error) throw error;

      // Refetch after initialization
      fetchChartAccounts();
    } catch (error) {
      console.error("Error initializing default accounts:", error);
    }
  };

  const fetchAccountTransactions = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, categories(name, color)")
        .eq("user_id", user?.id)
        .eq("account_id", accountId)
        .order("date", { ascending: false });

      if (error) throw error;
      if (data) setAccountTransactions(data);
    } catch (error) {
      console.error("Error fetching account transactions:", error);
    }
  };

  const openAccountRegister = (account: ChartAccount) => {
    setSelectedAccountForRegister(account);
    fetchAccountTransactions(account.id);
    setShowAccountRegister(true);
  };

  const toggleAccountSelection = (accountId: string) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccounts(newSelected);
  };

  const toggleAllAccounts = () => {
    if (selectedAccounts.size === filteredChartAccounts.length) {
      setSelectedAccounts(new Set());
    } else {
      setSelectedAccounts(new Set(filteredChartAccounts.map(acc => acc.id)));
    }
  };

  const filteredChartAccounts = chartAccounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(chartSearch.toLowerCase()) ||
                         account.accountType.toLowerCase().includes(chartSearch.toLowerCase());
    const matchesFilter = chartFilter === "all" || account.accountType.toLowerCase() === chartFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const fetchRecurringTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("*, categories(name, color)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setRecurringTransactions(data);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
    }
  };

  const fetchTransactionRules = async () => {
    try {
      const { data, error } = await supabase
        .from("transaction_rules")
        .select("*")
        .eq("user_id", user?.id)
        .order("priority", { ascending: true });

      if (error) throw error;
      if (data) setTransactionRules(data);
    } catch (error) {
      console.error("Error fetching transaction rules:", error);
    }
  };

  const handleCreateRecurring = async () => {
    if (!recurringName || !recurringAmount || !recurringStartDate || !recurringCategory) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const nextOccurrence = recurringStartDate;
      
      const payload = {
        user_id: user?.id,
        name: recurringName,
        description: recurringDescription || null,
        amount: parseFloat(recurringAmount),
        type: recurringType,
        category_id: recurringCategory,
        frequency: recurringFrequency,
        start_date: format(recurringStartDate, "yyyy-MM-dd"),
        end_date: recurringEndDate ? format(recurringEndDate, "yyyy-MM-dd") : null,
        next_occurrence: format(nextOccurrence, "yyyy-MM-dd"),
        is_active: true,
      };

      const { error } = await supabase
        .from("recurring_transactions")
        .insert(payload);

      if (error) throw error;

      toast.success("Recurring transaction created successfully");
      setShowRecurringDialog(false);
      resetRecurringForm();
      fetchRecurringTransactions();
    } catch (error) {
      console.error("Error creating recurring transaction:", error);
      toast.error("Failed to create recurring transaction");
    }
  };

  const handleUpdateRecurring = async () => {
    if (!editingRecurring || !recurringName || !recurringAmount || !recurringStartDate || !recurringCategory) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({
          name: recurringName,
          description: recurringDescription || null,
          amount: parseFloat(recurringAmount),
          type: recurringType,
          category_id: recurringCategory,
          frequency: recurringFrequency,
          start_date: format(recurringStartDate, "yyyy-MM-dd"),
          end_date: recurringEndDate ? format(recurringEndDate, "yyyy-MM-dd") : null,
        })
        .eq("id", editingRecurring.id);

      if (error) throw error;

      toast.success("Recurring transaction updated successfully");
      setShowRecurringDialog(false);
      setEditingRecurring(null);
      resetRecurringForm();
      fetchRecurringTransactions();
    } catch (error) {
      console.error("Error updating recurring transaction:", error);
      toast.error("Failed to update recurring transaction");
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recurring transaction?")) return;

    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Recurring transaction deleted successfully");
      fetchRecurringTransactions();
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      toast.error("Failed to delete recurring transaction");
    }
  };

  const handleToggleRecurring = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Recurring transaction ${!isActive ? "activated" : "paused"}`);
      fetchRecurringTransactions();
    } catch (error) {
      console.error("Error toggling recurring transaction:", error);
      toast.error("Failed to update recurring transaction");
    }
  };

  const openEditRecurring = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring);
    setRecurringName(recurring.name);
    setRecurringDescription(recurring.description || "");
    setRecurringAmount(recurring.amount.toString());
    setRecurringType(recurring.type as "income" | "expense");
    setRecurringFrequency(recurring.frequency);
    setRecurringCategory(recurring.category_id || "");
    setRecurringStartDate(new Date(recurring.start_date));
    setRecurringEndDate(recurring.end_date ? new Date(recurring.end_date) : undefined);
    setShowRecurringDialog(true);
  };

  const resetRecurringForm = () => {
    setRecurringName("");
    setRecurringDescription("");
    setRecurringAmount("");
    setRecurringType("expense");
    setRecurringFrequency("monthly");
    setRecurringCategory("");
    setRecurringStartDate(undefined);
    setRecurringEndDate(undefined);
    setEditingRecurring(null);
  };

  const calculateBalance = () => {
    const balance = transactions.reduce((acc, transaction) => {
      if (transaction.type === "income") {
        return acc + transaction.amount;
      } else {
        return acc - transaction.amount;
      }
    }, 0);
    return balance;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleStartReconciling = () => {
    if (!endingBalance || !endingDate) {
      toast.error("Please fill in the required fields: Statement ending balance and date");
      return;
    }
    
    setIsReconciling(true);
    setClearedTransactions(new Set());
  };

  const toggleTransactionCleared = (transactionId: string) => {
    const newCleared = new Set(clearedTransactions);
    if (newCleared.has(transactionId)) {
      newCleared.delete(transactionId);
    } else {
      newCleared.add(transactionId);
    }
    setClearedTransactions(newCleared);
  };

  const calculateClearedBalance = () => {
    let cleared = parseFloat(beginningBalance);
    transactions.forEach((transaction) => {
      if (clearedTransactions.has(transaction.id)) {
        if (transaction.type === "income") {
          cleared += transaction.amount;
        } else {
          cleared -= transaction.amount;
        }
      }
    });
    return cleared;
  };

  const calculateDifference = () => {
    const cleared = calculateClearedBalance();
    const ending = parseFloat(endingBalance || "0");
    return ending - cleared;
  };

  const handleFinishReconciliation = () => {
    const difference = calculateDifference();
    if (Math.abs(difference) < 0.01) {
      toast.success("Reconciliation complete! Your books match the bank statement.");
      setIsReconciling(false);
      setClearedTransactions(new Set());
    } else {
      toast.error(`Reconciliation incomplete. Difference: ${formatCurrency(Math.abs(difference))}`);
    }
  };

  const handleCancelReconciliation = () => {
    setIsReconciling(false);
    setClearedTransactions(new Set());
  };

  const handleAddAdjustingEntry = async () => {
    if (!adjustingAmount || !adjustingDescription || !adjustingCategory) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user?.id,
          type: adjustingType,
          amount: parseFloat(adjustingAmount),
          description: adjustingDescription,
          date: format(adjustingDate, "yyyy-MM-dd"),
          category_id: adjustingCategory,
        })
        .select("*, categories(name, color)")
        .single();

      if (error) throw error;

      // Add to transactions list and mark as cleared
      if (data) {
        setTransactions([data, ...transactions]);
        const newCleared = new Set(clearedTransactions);
        newCleared.add(data.id);
        setClearedTransactions(newCleared);
      }

      toast.success("Adjusting entry added successfully");
      setShowAdjustingEntry(false);
      
      // Reset form
      setAdjustingAmount("");
      setAdjustingDescription("");
      setAdjustingCategory("");
      setAdjustingType("expense");
      setAdjustingDate(new Date());
    } catch (error) {
      console.error("Error adding adjusting entry:", error);
      toast.error("Failed to add adjusting entry");
    }
  };

  const reviewCount = 0;
  const balance = calculateBalance();

  return (
    <Layout>
      <BankLinkingFlow open={showBankLinking} onOpenChange={setShowBankLinking} onSuccess={handleBankLinkingSuccess} />
      
      {/* Import Transactions Dialog */}
      <ImportTransactionsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => fetchTransactions()}
      />

      {/* Add/Edit Transaction Dialog */}
      <AddTransactionDialog
        open={showAddTransaction}
        onOpenChange={(open) => {
          setShowAddTransaction(open);
          if (!open) setEditingTransaction(null);
        }}
        onSuccess={fetchTransactions}
        categories={categories}
        accounts={chartAccounts.map(acc => ({ id: acc.id, name: acc.name, accountType: acc.accountType }))}
        editingTransaction={editingTransaction}
      />

      {/* Delete Transaction Dialog */}
      <DeleteTransactionDialog
        open={showDeleteTransaction}
        onOpenChange={setShowDeleteTransaction}
        transactionId={deleteTransactionId}
        onSuccess={fetchTransactions}
      />
      
      {/* Adjusting Entry Dialog */}
      <Dialog open={showAdjustingEntry} onOpenChange={setShowAdjustingEntry}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Adjusting Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={adjustingType} onValueChange={(value: "income" | "expense") => setAdjustingType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Input
                placeholder="e.g., Bank fee, Interest earned"
                value={adjustingDescription}
                onChange={(e) => setAdjustingDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={adjustingAmount}
                onChange={(e) => setAdjustingAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !adjustingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {adjustingDate ? format(adjustingDate, "MM/dd/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border border-border z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={adjustingDate}
                    onSelect={(date) => date && setAdjustingDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={adjustingCategory} onValueChange={setAdjustingCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  {categories
                    .filter((cat) => cat.type === adjustingType)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustingEntry(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdjustingEntry} className="bg-green-600 hover:bg-green-700">
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Transaction Dialog */}
      <Dialog open={showRecurringDialog} onOpenChange={(open) => {
        setShowRecurringDialog(open);
        if (!open) {
          setEditingRecurring(null);
          resetRecurringForm();
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingRecurring ? "Edit" : "Create"} Recurring Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g., Monthly Rent, Weekly Payroll"
                value={recurringName}
                onChange={(e) => setRecurringName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={recurringDescription}
                onChange={(e) => setRecurringDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={recurringType} onValueChange={(value: "income" | "expense") => setRecurringType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border z-50">
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={recurringAmount}
                  onChange={(e) => setRecurringAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency *</Label>
                <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border z-50">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={recurringCategory} onValueChange={setRecurringCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border z-50">
                    {categories
                      .filter((cat) => cat.type === recurringType)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !recurringStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurringStartDate ? format(recurringStartDate, "MM/dd/yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border border-border z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={recurringStartDate}
                      onSelect={(date) => date && setRecurringStartDate(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !recurringEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurringEndDate ? format(recurringEndDate, "MM/dd/yyyy") : "No end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border border-border z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={recurringEndDate}
                      onSelect={setRecurringEndDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRecurringDialog(false);
              setEditingRecurring(null);
              resetRecurringForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={editingRecurring ? handleUpdateRecurring : handleCreateRecurring}
              className="bg-green-600 hover:bg-green-700"
            >
              {editingRecurring ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Account Register Dialog */}
      <Dialog open={showAccountRegister} onOpenChange={setShowAccountRegister}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedAccountForRegister?.name} - Account Register
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-auto max-h-[70vh]">
            {selectedAccountForRegister && (
              <div className="space-y-4">
                {/* Account Info */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Account Type</div>
                    <div className="font-medium">{selectedAccountForRegister.accountType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Detail Type</div>
                    <div className="font-medium">{selectedAccountForRegister.detailType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Balance</div>
                    <div className="font-medium">{formatCurrency(selectedAccountForRegister.quickbooksBalance)}</div>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>DATE</TableHead>
                        <TableHead>DESCRIPTION</TableHead>
                        <TableHead>CATEGORY</TableHead>
                        <TableHead className="text-right">AMOUNT</TableHead>
                        <TableHead className="text-right">BALANCE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No transactions found for this account
                          </TableCell>
                        </TableRow>
                      ) : (
                        accountTransactions.map((transaction, index) => {
                          // Calculate running balance
                          let runningBalance = selectedAccountForRegister.quickbooksBalance;
                          for (let i = 0; i <= index; i++) {
                            const txn = accountTransactions[i];
                            if (txn.type === "income") {
                              runningBalance += txn.amount;
                            } else {
                              runningBalance -= txn.amount;
                            }
                          }

                          return (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {new Date(transaction.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>
                                {transaction.categories ? (
                                  <Badge
                                    style={{ backgroundColor: transaction.categories.color }}
                                    className="text-white"
                                  >
                                    {transaction.categories.name}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">Uncategorized</span>
                                )}
                              </TableCell>
                              <TableCell className={cn(
                                "text-right font-medium",
                                transaction.type === "income" ? "text-green-600" : "text-destructive"
                              )}>
                                {transaction.type === "income" ? "+" : "-"}
                                {formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(runningBalance)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccountRegister(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bank transactions</h1>
        </div>

        <Tabs defaultValue="bank" className="space-y-4">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0">
            <TabsTrigger
              value="bank"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Bank transactions
            </TabsTrigger>
            <TabsTrigger
              value="app"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              App transactions
            </TabsTrigger>
            <TabsTrigger
              value="receipts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Receipts
            </TabsTrigger>
            <TabsTrigger
              value="reconcile"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Reconcile
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Rules
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Chart of accounts
            </TabsTrigger>
            <TabsTrigger
              value="recurring"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Recurring transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="space-y-4">
            {/* Account Selector and Actions */}
            <div className="flex items-center justify-between">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-[300px]">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    <SelectValue placeholder="Select an account" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  {linkedBankAccounts.length === 0 ? (
                    <SelectItem value="checking">MAJR BOOKS checking</SelectItem>
                  ) : (
                    linkedBankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.institution_name} - {account.account_name} (****{account.account_number_last4})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setShowImportDialog(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Transactions
                </Button>
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => navigate("/bank-reconciliation")}
                >
                  Try new banking page
                </Button>
                <Button variant="outline" onClick={() => setShowBankLinking(true)}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link account
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border border-border z-50">
                    <DropdownMenuItem>Account details</DropdownMenuItem>
                    <DropdownMenuItem>Edit account</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Compass className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Balance Card */}
            {(() => {
              const currentAccount = linkedBankAccounts.find(acc => acc.id === selectedAccount);
              const accountName = currentAccount 
                ? `${currentAccount.institution_name} - ${currentAccount.account_name}` 
                : "MAJR BOOKS checking";
              const accountBalance = currentAccount ? currentAccount.balance : balance;
              const lastSynced = currentAccount?.last_synced 
                ? `Updated ${format(new Date(currentAccount.last_synced), "PPp")}`
                : "Updated 23 hours ago";
              
              return (
                <Card className="bg-[#0077C8] text-white p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{accountName}</h3>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{formatCurrency(accountBalance)}</div>
                      <div className="text-sm opacity-90">BANK BALANCE</div>
                      <div className="text-xs opacity-75 mt-1">{lastSynced}</div>
                    </div>
                    <div className="border-t border-white/20 pt-3 flex items-center justify-between">
                      <div>
                        <div className="text-xl font-semibold">{formatCurrency(accountBalance)}</div>
                        <div className="text-sm opacity-90">{currentAccount?.institution_name || "MAJR BOOKS"}</div>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                </Card>
              );
            })()}

            {/* Status Tabs */}
            <div className="flex items-center gap-2">
              <Button
                variant={statusTab === "review" ? "default" : "outline"}
                onClick={() => setStatusTab("review")}
                className={cn(
                  statusTab === "review" && "bg-secondary text-secondary-foreground"
                )}
              >
                For review ({reviewCount})
              </Button>
              <Button
                variant={statusTab === "categorized" ? "default" : "outline"}
                onClick={() => setStatusTab("categorized")}
              >
                Categorized
              </Button>
              <Button
                variant={statusTab === "excluded" ? "default" : "outline"}
                onClick={() => setStatusTab("excluded")}
              >
                Excluded
              </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border z-50">
                    <SelectItem value="all">All dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border z-50">
                    <SelectItem value="all">All transactions</SelectItem>
                    <SelectItem value="income">Income only</SelectItem>
                    <SelectItem value="expense">Expenses only</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by description, check number, or amount"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-[350px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  variant="link" 
                  className="text-blue-600 gap-1"
                  onClick={() => navigate("/bank-reconciliation")}
                >
                  Go to bank register
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Empty State */}
            {transactions.length === 0 ? (
              <div className="border border-border rounded-lg p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">
                      You reviewed all your transactions. Check out your{" "}
                      <Button variant="link" className="p-0 h-auto text-blue-600">
                        profit and loss
                      </Button>{" "}
                      to see how your business is doing.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Transaction Table */
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>DATE</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>PAYEE</TableHead>
                      <TableHead>CATEGORIZE OR MATCH</TableHead>
                      <TableHead className="text-right">SPENT</TableHead>
                      <TableHead className="text-right">RECEIVED</TableHead>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell>
                          {transaction.categories ? (
                            <Badge
                              style={{ backgroundColor: transaction.categories.color }}
                              className="text-white"
                            >
                              {transaction.categories.name}
                            </Badge>
                          ) : (
                            <Button variant="outline" size="sm">
                              Categorize
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-destructive font-medium">
                          {transaction.type === "expense" && formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {transaction.type === "income" && formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border border-border z-50">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingTransaction(transaction);
                                  setShowAddTransaction(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setDeleteTransactionId(transaction.id);
                                  setShowDeleteTransaction(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between p-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handlePrintTransactions}
                      title="Print transactions"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleDownloadTransactions}
                      title="Download as CSV"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowTransactionSettings(true)}
                      title="Transaction settings"
                    >
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="app" className="space-y-6">
            {/* Available Apps Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Connect Your Apps</h2>
                  <p className="text-sm text-muted-foreground">
                    Link your sales channels to automatically import transactions
                  </p>
                </div>
              </div>

              {/* Apps Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(appConfigs).map((app) => {
                  const isConnected = connectedApps.has(app.id);
                  return (
                    <Card 
                      key={app.id} 
                      className={cn(
                        "border border-border hover:shadow-lg transition-all duration-200 hover:-translate-y-1",
                        isConnected && "border-green-500/50 bg-green-50/30 dark:bg-green-900/10"
                      )}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{app.icon}</div>
                            <div>
                              <h3 className="font-semibold">{app.name}</h3>
                              <Badge 
                                variant={isConnected ? "default" : "outline"} 
                                className={cn(
                                  "mt-1",
                                  isConnected && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                                )}
                              >
                                {isConnected ? "Connected" : "Not Connected"}
                              </Badge>
                            </div>
                          </div>
                          {isConnected && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toast.info("Syncing transactions...")}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Sync Now
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDisconnectApp(app.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Disconnect
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {app.description}
                        </p>
                        {isConnected ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Last synced: Just now</span>
                          </div>
                        ) : (
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90"
                            onClick={() => handleConnectApp(app.id)}
                          >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Transactions Management Section */}
            <div className="space-y-4 mt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Transactions</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your income and expense transactions
                  </p>
                </div>
                <Button onClick={() => setShowAddTransaction(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={appTransactionsSearch}
                    onChange={(e) => setAppTransactionsSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>DATE</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead>TYPE</TableHead>
                      <TableHead className="text-right">AMOUNT</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions
                      .filter((t) =>
                        t.description.toLowerCase().includes(appTransactionsSearch.toLowerCase())
                      )
                      .slice(0, 20)
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{format(new Date(transaction.date), "MM/dd/yyyy")}</TableCell>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell>
                            {transaction.categories ? (
                              <Badge
                                style={{ backgroundColor: transaction.categories.color }}
                                className="text-white"
                              >
                                {transaction.categories.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-medium",
                              transaction.type === "income" ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border border-border z-50">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingTransaction(transaction);
                                    setShowAddTransaction(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setDeleteTransactionId(transaction.id);
                                    setShowDeleteTransaction(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    {transactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No transactions yet. Add your first transaction to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="receipts">
            <div className="space-y-6">
              {/* Receipts Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Receipts</h2>
                  <Info className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => setShowReceiptSettings(true)}
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Manage settings
                  </Button>
                  <input
                    type="file"
                    ref={receiptInputRef}
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleUploadReceipts(files);
                      }
                      e.target.value = '';
                    }}
                  />
                  <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    disabled={uploadingReceipts}
                    onClick={() => receiptInputRef.current?.click()}
                  >
                    {uploadingReceipts ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload receipts
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Receipts Content */}
              {receipts.length === 0 ? (
                <div className="border border-border rounded-lg p-12">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">No receipts yet</h3>
                      <p className="text-muted-foreground">
                        Upload your receipts to keep track of your expenses
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Merchant / File</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {receipt.file_type?.includes('pdf') ? (
                                <FileText className="h-4 w-4 text-red-500" />
                              ) : (
                                <Upload className="h-4 w-4 text-blue-500" />
                              )}
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {receipt.merchant_name || receipt.file_name}
                                </span>
                                {receipt.merchant_name && (
                                  <span className="text-xs text-muted-foreground">
                                    {receipt.file_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {receipt.receipt_date 
                              ? format(new Date(receipt.receipt_date), "MMM dd, yyyy")
                              : format(new Date(receipt.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            {receipt.amount ? (
                              <div className="flex flex-col">
                                <span className="font-medium">${receipt.amount.toFixed(2)}</span>
                                {receipt.tax_amount && (
                                  <span className="text-xs text-muted-foreground">
                                    Tax: ${receipt.tax_amount.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {receipt.category ? (
                              <Badge variant="outline">{receipt.category}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  receipt.status === 'processed' ? 'default' : 
                                  receipt.status === 'analyzing' ? 'secondary' :
                                  receipt.status === 'failed' ? 'destructive' : 
                                  'outline'
                                }
                                className={receipt.status === 'analyzing' ? 'animate-pulse' : ''}
                              >
                                {receipt.status === 'analyzing' && '🔍 '}
                                {receipt.status === 'processed' && '✅ '}
                                {receipt.status}
                              </Badge>
                              {receipt.ai_confidence && receipt.ai_confidence > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(receipt.ai_confidence * 100)}% confident
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  const url = await getReceiptUrl(receipt.file_path);
                                  if (url) window.open(url, '_blank');
                                  else toast.error("Could not load document");
                                }}
                                title="View document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border border-border z-50">
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      const url = await getReceiptUrl(receipt.file_path);
                                      if (url) window.open(url, '_blank');
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  {receipt.status === 'failed' && (
                                    <DropdownMenuItem
                                      onClick={() => analyzeReceiptWithAI(receipt)}
                                    >
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Retry Analysis
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteReceipt(receipt)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reconcile">
            <div className="space-y-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <button className="hover:underline">Chart of accounts</button>
                <ChevronRight className="h-4 w-4" />
                <button className="hover:underline">Bank register</button>
                <ChevronRight className="h-4 w-4" />
                <span className="text-muted-foreground">Reconcile</span>
              </div>

              {/* Reconcile Header */}
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Reconcile</h2>
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>

              {!isReconciling ? (
                /* Reconcile Form */
                <div className="max-w-2xl space-y-6">
                {/* Account Selection */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Which account do you want to reconcile?</h3>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Account</label>
                    <Select value={reconcileAccount} onValueChange={setReconcileAccount}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border z-50">
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Beginning Balance Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Add the following information*</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Beginning balance</label>
                      <Input
                        type="text"
                        value={beginningBalance}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Statement ending balance</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={endingBalance}
                        onChange={(e) => setEndingBalance(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Statement ending date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endingDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endingDate ? format(endingDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border border-border z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={endingDate}
                            onSelect={setEndingDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Service Charge and Interest Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Enter the service charge or interest earned, if necessary</h3>
                  
                  {/* Service Charge Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !serviceChargeDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {serviceChargeDate ? format(serviceChargeDate, "MM/dd/yyyy") : ""}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border border-border z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={serviceChargeDate}
                            onSelect={setServiceChargeDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Service charge</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={serviceCharge}
                        onChange={(e) => setServiceCharge(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Expense account</label>
                      <Select value={expenseAccount} onValueChange={setExpenseAccount}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Account" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border z-50">
                          <SelectItem value="bank-fees">Bank Fees</SelectItem>
                          <SelectItem value="service-charges">Service Charges</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Interest Earned Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !interestDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {interestDate ? format(interestDate, "MM/dd/yyyy") : ""}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border border-border z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={interestDate}
                            onSelect={setInterestDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Interest earned</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={interestEarned}
                        onChange={(e) => setInterestEarned(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Income account</label>
                      <Select value={incomeAccount} onValueChange={setIncomeAccount}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Account" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border z-50">
                          <SelectItem value="interest-income">Interest Income</SelectItem>
                          <SelectItem value="other-income">Other Income</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                  {/* Start Reconciling Button */}
                  <Button
                    onClick={handleStartReconciling}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Start reconciling
                  </Button>
                </div>
              ) : (
                /* Reconciliation View */
                <div className="space-y-6">
                  {/* Reconciliation Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Reconciling {reconcileAccount}</h3>
                      <p className="text-sm text-muted-foreground">
                        Statement ending date: {endingDate ? format(endingDate, "MM/dd/yyyy") : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowAdjustingEntry(true)}>
                        Add adjusting entry
                      </Button>
                      <Button variant="outline" onClick={handleCancelReconciliation}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleFinishReconciliation}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Finish reconciliation
                      </Button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Beginning Balance</div>
                        <div className="text-2xl font-bold">{formatCurrency(parseFloat(beginningBalance))}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Statement Ending Balance</div>
                        <div className="text-2xl font-bold">{formatCurrency(parseFloat(endingBalance))}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Cleared Balance</div>
                        <div className="text-2xl font-bold">{formatCurrency(calculateClearedBalance())}</div>
                      </CardContent>
                    </Card>
                    <Card className={cn(
                      Math.abs(calculateDifference()) < 0.01 ? "bg-green-50" : "bg-orange-50"
                    )}>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">Difference</div>
                        <div className={cn(
                          "text-2xl font-bold",
                          Math.abs(calculateDifference()) < 0.01 ? "text-green-600" : "text-orange-600"
                        )}>
                          {formatCurrency(Math.abs(calculateDifference()))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Transactions Table */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-12">
                            <Checkbox />
                          </TableHead>
                          <TableHead>DATE</TableHead>
                          <TableHead>DESCRIPTION</TableHead>
                          <TableHead>CATEGORY</TableHead>
                          <TableHead className="text-right">SPENT</TableHead>
                          <TableHead className="text-right">RECEIVED</TableHead>
                          <TableHead className="text-center">CLEARED</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <Checkbox />
                              </TableCell>
                              <TableCell>
                                {new Date(transaction.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>
                                {transaction.categories ? (
                                  <Badge
                                    style={{ backgroundColor: transaction.categories.color }}
                                    className="text-white"
                                  >
                                    {transaction.categories.name}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">Uncategorized</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-destructive font-medium">
                                {transaction.type === "expense" && formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                {transaction.type === "income" && formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={clearedTransactions.has(transaction.id)}
                                  onCheckedChange={() => toggleTransactionCleared(transaction.id)}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary Footer */}
                  <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">{clearedTransactions.size}</span> of{" "}
                      <span className="font-medium">{transactions.length}</span> transactions cleared
                    </div>
                    {Math.abs(calculateDifference()) < 0.01 ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Ready to finish reconciliation</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">
                          Please clear more transactions to match the statement
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Rules</h2>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Learn about bank rules
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      New rule
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      Create new rule
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Search and Settings */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or conditions"
                  className="pl-10"
                  value={rulesSearchQuery}
                  onChange={(e) => setRulesSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon">
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Rules Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead className="w-32">
                      <div className="flex items-center gap-1">
                        PRIORITY
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>RULE NAME</TableHead>
                    <TableHead>APPLIED TO</TableHead>
                    <TableHead>CONDITIONS</TableHead>
                    <TableHead>SETTINGS</TableHead>
                    <TableHead>AUTO-ADD</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="w-24">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionRules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <h3 className="text-xl font-semibold mb-2">
                            Use rules to save time
                          </h3>
                          <p className="text-muted-foreground mb-4 max-w-2xl">
                            Make rules for your frequently occurring transactions and tell QuickBooks exactly what should happen when conditions are met.{" "}
                            <Button
                              variant="link"
                              className="p-0 h-auto text-primary"
                            >
                              Create a rule
                            </Button>
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactionRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell className="font-medium">{rule.rule_name}</TableCell>
                        <TableCell>{rule.applied_to || "-"}</TableCell>
                        <TableCell>
                          {Object.keys(rule.conditions).length > 0 
                            ? JSON.stringify(rule.conditions).slice(0, 50) + "..." 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {Object.keys(rule.settings).length > 0 
                            ? JSON.stringify(rule.settings).slice(0, 50) + "..." 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {rule.auto_add ? (
                            <Badge variant="secondary">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={rule.status === "active" ? "default" : "secondary"}
                          >
                            {rule.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {transactionRules.length === 0 
                  ? "0-0 of 0 items" 
                  : `1-${transactionRules.length} of ${transactionRules.length} items`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled
                  className="h-8 w-8"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled
                  className="h-8 w-8"
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chart" className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Chart of accounts</h1>
                  <Button variant="link" className="text-primary p-0 h-auto hover:underline">
                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                    All lists
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Feedback
                  </Button>
                  <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                    Run report
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 gap-2">
                        New account
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border border-border z-50">
                      <DropdownMenuItem>Bank account</DropdownMenuItem>
                      <DropdownMenuItem>Income account</DropdownMenuItem>
                      <DropdownMenuItem>Expense account</DropdownMenuItem>
                      <DropdownMenuItem>Asset account</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        Batch actions
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-card border border-border z-50">
                      <DropdownMenuItem>Make inactive</DropdownMenuItem>
                      <DropdownMenuItem>Print list</DropdownMenuItem>
                      <DropdownMenuItem>Export</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter by name or number"
                      value={chartSearch}
                      onChange={(e) => setChartSearch(e.target.value)}
                      className="pl-10 w-[250px]"
                    />
                  </div>

                  <Select value={chartFilter} onValueChange={setChartFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border z-50">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expenses">Expenses</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chart of Accounts Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAccounts.size === filteredChartAccounts.length && filteredChartAccounts.length > 0}
                        onCheckedChange={toggleAllAccounts}
                      />
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 hover:bg-transparent font-semibold text-xs">
                        NAME
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent font-semibold text-xs">
                          ACCOUNT TYPE
                          <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 hover:bg-transparent font-semibold text-xs">
                        DETAIL TYPE
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 hover:bg-transparent font-semibold text-xs">
                        QUICKBOOKS BALANCE
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="h-auto p-0 hover:bg-transparent font-semibold text-xs">
                        BANK BALANCE
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChartAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChartAccounts.map((account) => (
                      <TableRow key={account.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedAccounts.has(account.id)}
                            onCheckedChange={() => toggleAccountSelection(account.id)}
                          />
                        </TableCell>
                        <TableCell className="text-blue-600 hover:underline cursor-pointer font-medium">
                          {account.name}
                        </TableCell>
                        <TableCell>{account.accountType}</TableCell>
                        <TableCell>{account.detailType}</TableCell>
                        <TableCell>{formatCurrency(account.quickbooksBalance)}</TableCell>
                        <TableCell>
                          {account.bankBalance !== null ? formatCurrency(account.bankBalance) : ""}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "gap-1 hover:bg-transparent p-0 h-auto font-medium text-sm",
                                  account.actionType === "register" ? "text-cyan-600 hover:text-cyan-700" : "text-green-600 hover:text-green-700"
                                )}
                              >
                                {account.actionType === "register" ? "View register" : "Run report"}
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border border-border z-50">
                              {account.actionType === "register" ? (
                                <>
                                  <DropdownMenuItem onClick={() => openAccountRegister(account)}>
                                    View register
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Run report</DropdownMenuItem>
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>Make inactive</DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem>Run report</DropdownMenuItem>
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>Make inactive</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" disabled className="gap-1">
                <ChevronRight className="h-4 w-4 rotate-180" />
                Previous
              </Button>
              <div>
                1 - {filteredChartAccounts.length}
              </div>
              <Button variant="ghost" size="sm" disabled className="gap-1">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recurring Transactions</h2>
              <Button 
                onClick={() => setShowRecurringDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Recurring Transaction
              </Button>
            </div>

            {/* Recurring Transactions Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>NAME</TableHead>
                    <TableHead>TYPE</TableHead>
                    <TableHead>AMOUNT</TableHead>
                    <TableHead>FREQUENCY</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>NEXT DATE</TableHead>
                    <TableHead>STATUS</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="h-12 w-12 text-muted-foreground" />
                          <div>
                            <p className="font-medium">No recurring transactions yet</p>
                            <p className="text-sm text-muted-foreground">
                              Create your first recurring transaction to automate your bookkeeping
                            </p>
                          </div>
                          <Button 
                            onClick={() => setShowRecurringDialog(true)}
                            className="bg-green-600 hover:bg-green-700 mt-2"
                          >
                            Create Recurring Transaction
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recurringTransactions.map((recurring) => (
                      <TableRow key={recurring.id}>
                        <TableCell className="font-medium">{recurring.name}</TableCell>
                        <TableCell>
                          <Badge variant={recurring.type === "income" ? "default" : "secondary"}>
                            {recurring.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={cn(
                          "font-medium",
                          recurring.type === "income" ? "text-green-600" : "text-destructive"
                        )}>
                          {formatCurrency(recurring.amount)}
                        </TableCell>
                        <TableCell className="capitalize">{recurring.frequency}</TableCell>
                        <TableCell>
                          {recurring.categories ? (
                            <Badge
                              style={{ backgroundColor: recurring.categories.color }}
                              className="text-white"
                            >
                              {recurring.categories.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Uncategorized</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(recurring.next_occurrence).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={recurring.is_active ? "default" : "secondary"}>
                            {recurring.is_active ? "Active" : "Paused"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border border-border z-50">
                              <DropdownMenuItem onClick={() => openEditRecurring(recurring)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleRecurring(recurring.id, recurring.is_active)}>
                                <Clock className="h-4 w-4 mr-2" />
                                {recurring.is_active ? "Pause" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRecurring(recurring.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Connect App Dialog */}
      <ConnectAppDialog
        open={showConnectAppDialog}
        onOpenChange={setShowConnectAppDialog}
        appId={selectedAppToConnect}
        onConnected={handleAppConnected}
      />

      {/* Receipt Settings Dialog */}
      <Dialog open={showReceiptSettings} onOpenChange={setShowReceiptSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Receipt Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-match receipts</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically match uploaded receipts with transactions based on amount and date
                  </p>
                </div>
                <Checkbox
                  checked={autoMatchReceipts}
                  onCheckedChange={(checked) => setAutoMatchReceipts(checked as boolean)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Default category for receipts</Label>
                <Select value={defaultReceiptCategory} onValueChange={setDefaultReceiptCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border z-50">
                    <SelectItem value="none">None</SelectItem>
                    {categories.filter(c => c.type === 'expense').map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  New receipts will be automatically assigned to this category
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Settings saved");
              setShowReceiptSettings(false);
            }}>
              Save settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Settings Dialog */}
      <TransactionSettingsDialog
        open={showTransactionSettings}
        onOpenChange={setShowTransactionSettings}
      />
    </Layout>
  );
};

export default BankTransactions;
