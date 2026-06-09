import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, Loader2, Trash2, Calendar, Edit } from "lucide-react";
import { ExcelImportDialog, ExcelRow } from "@/components/ExcelImportDialog";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  category_id: string | null;
  account_id: string | null;
  categories?: { name: string; color: string };
  chart_of_accounts?: { name: string };
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
  account_type: string;
}

const Transactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    category_id: "",
    account_id: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [transactionsRes, categoriesRes, accountsRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("*, categories(name, color), chart_of_accounts(name)")
          .eq("user_id", user?.id)
          .order("date", { ascending: false }),
        supabase.from("categories").select("*").eq("user_id", user?.id),
        supabase
          .from("chart_of_accounts")
          .select("id, name, account_type")
          .eq("user_id", user?.id)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (accountsRes.data) setAccounts(accountsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = async (rows: ExcelRow[]) => {
    if (!user) throw new Error("Not authenticated");

    const parseAmount = (val: unknown): number => {
      if (val === null || val === undefined || val === "") return 0;
      const cleaned = String(val).replace(/[^0-9.-]/g, "");
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : Math.abs(n);
    };

    const parseDate = (val: unknown): string => {
      if (!val) return new Date().toISOString().split("T")[0];
      if (val instanceof Date) return val.toISOString().split("T")[0];
      const d = new Date(String(val));
      return isNaN(d.getTime()) ? new Date().toISOString().split("T")[0] : d.toISOString().split("T")[0];
    };

    const records = rows.map((row) => {
      const keys = Object.keys(row).map((k) => k.toLowerCase().trim());
      const get = (names: string[]) => {
        for (const n of names) {
          const idx = keys.findIndex((k) => k.includes(n));
          if (idx !== -1) return row[Object.keys(row)[idx]];
        }
        return null;
      };

      // Try to get amount from multiple possible column names
      const rawAmount = get(["amount", "total", "sum", "value", "debit", "credit", "charge", "payment"]);
      const amount = parseAmount(rawAmount);

      // Try to detect type from column or amount sign
      const typeVal = String(get(["type", "transaction type", "txn type"]) ?? "");
      const type = typeVal.toLowerCase().includes("income") || typeVal.toLowerCase().includes("deposit") || typeVal.toLowerCase().includes("credit")
        ? "income" : "expense";

      return {
        user_id: user.id,
        type,
        amount,
        description: String(get(["description", "memo", "note", "details", "narration", "payee", "merchant", "name"]) ?? "Imported transaction"),
        date: parseDate(get(["date", "transaction date", "txn date", "posting date", "trans date"])),
      };
    })
    // ✅ Skip rows with zero or invalid amounts — prevents database constraint errors
    .filter(r => r.amount > 0);

    if (records.length === 0) {
      throw new Error("No valid transactions found. Make sure your Excel file has columns for date, description, and amount with numeric values greater than 0.");
    }

    // Import in batches of 100 to avoid timeouts
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase.from("transactions").insert(batch);
      if (error) throw new Error(`Import failed at row ${i + 1}: ${error.message}`);
    }

    await fetchData();
    return records.length;
  };

  const handleAICategorize = async () => {
    if (!formData.description.trim()) {
      toast({
        variant: "destructive",
        title: "Description required",
        description: "Please enter a transaction description for AI categorization",
      });
      return;
    }

    setAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("categorize-transaction", {
        body: { description: formData.description },
      });

      if (error) {
        throw error;
      }

      if (data?.category) {
        const matchedCategory = categories.find((cat) => cat.name === data.category);
        if (matchedCategory) {
          setFormData({ ...formData, category_id: matchedCategory.id });
          toast({
            title: "Category suggested!",
            description: `AI suggests: ${data.category}`,
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "AI Categorization failed",
        description: error.message || "Failed to categorize transaction",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from("transactions")
          .update({
            type: formData.type,
            amount: parseFloat(formData.amount),
            description: formData.description,
            date: formData.date,
            category_id: formData.category_id || null,
            account_id: formData.account_id || null,
          })
          .eq("id", editingTransaction.id);

        if (error) throw error;

        toast({
          title: "Transaction updated!",
          description: "Your transaction has been updated successfully.",
        });
      } else {
        // Insert new transaction
        const { error } = await supabase.from("transactions").insert({
          user_id: user?.id,
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          category_id: formData.category_id || null,
          account_id: formData.account_id || null,
        });

        if (error) throw error;

        toast({
          title: "Transaction added!",
          description: "Your transaction has been recorded successfully.",
        });
      }

      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date,
      category_id: transaction.category_id || "",
      account_id: transaction.account_id || "",
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingTransaction(null);
    setFormData({
      type: "expense",
      amount: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      category_id: "",
      account_id: "",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Transaction deleted",
        description: "Transaction removed successfully.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const filteredCategories = categories.filter((cat) => cat.type === formData.type);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Transactions</h1>
            <p className="text-muted-foreground">Manage your income and expenses</p>
          </div>

          <div className="flex items-center gap-2">
            <ExcelImportDialog
              title="Import Transactions from Excel"
              description="Upload an Excel file with columns: date, description, amount, type (income/expense). All other columns are optional."
              onImport={handleExcelImport}
            />
          <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleCloseDialog();
            else setOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingTransaction ? "Edit Transaction" : "New Transaction"}</DialogTitle>
                <DialogDescription>
                  {editingTransaction ? "Update the transaction details" : "Add a new income or expense transaction"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, category_id: "" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="flex gap-2">
                    <Input
                      id="description"
                      placeholder="What was this transaction for?"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAICategorize}
                      disabled={aiLoading || !formData.description.trim()}
                      title="AI Categorize"
                    >
                      {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Account (Optional)</Label>
                  <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border z-50">
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  {editingTransaction ? "Update Transaction" : "Add Transaction"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No transactions yet. Add your first transaction to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          {transaction.categories ? (
                            <Badge style={{ backgroundColor: transaction.categories.color }}>
                              {transaction.categories.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.chart_of_accounts ? (
                            <span className="text-sm">{transaction.chart_of_accounts.name}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === "income" ? "default" : "destructive"}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            transaction.type === "income" ? "text-success" : "text-destructive"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(transaction)}
                              title="Edit transaction"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(transaction.id)}
                              title="Delete transaction"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Transactions;
