import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreVertical, FileText, TrendingUp, Trash2, Download, Upload } from "lucide-react";
import AddEditAccountDialog from "@/components/AddEditAccountDialog";

interface ChartAccount {
  id: string;
  name: string;
  account_type: string;
  detail_type: string;
  action_type: string;
  quickbooks_balance: number;
  bank_balance: number | null;
  is_active: boolean;
}

const ChartOfAccounts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, accountTypeFilter, statusFilter]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("user_id", user?.id)
        .order("account_type", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(
        (account) =>
          account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.detail_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (accountTypeFilter !== "all") {
      filtered = filtered.filter((account) => account.account_type === accountTypeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((account) =>
        statusFilter === "active" ? account.is_active : !account.is_active
      );
    }

    setFilteredAccounts(filtered);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("chart_of_accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBatchDelete = async () => {
    try {
      const { error } = await supabase
        .from("chart_of_accounts")
        .delete()
        .in("id", selectedAccounts)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedAccounts.length} accounts deleted successfully`,
      });
      setSelectedAccounts([]);
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBatchToggleStatus = async (activate: boolean) => {
    try {
      const { error } = await supabase
        .from("chart_of_accounts")
        .update({ is_active: activate })
        .in("id", selectedAccounts)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedAccounts.length} accounts ${activate ? "activated" : "deactivated"} successfully`,
      });
      setSelectedAccounts([]);
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateBalance = async (id: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from("chart_of_accounts")
        .update({ quickbooks_balance: newBalance })
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Balance updated successfully",
      });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewRegister = (accountId: string) => {
    toast({ title: "Opening account register..." });
    navigate(`/general-ledger?account=${accountId}`);
  };

  const handleRunReport = (accountType: string) => {
    if (accountType === "Asset" || accountType === "Liability" || accountType === "Equity") {
      toast({ title: "Opening Balance Sheet..." });
      navigate("/balance-sheet");
    } else {
      toast({ title: "Opening Profit and Loss..." });
      navigate("/profit-and-loss");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const accountTypes = ["Asset", "Liability", "Equity", "Income", "Expense"];

  const toggleSelectAll = () => {
    if (selectedAccounts.length === filteredAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(filteredAccounts.map((a) => a.id));
    }
  };

  const toggleSelectAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    try {
      // Create CSV content
      const headers = ["Name", "Account Type", "Detail Type", "Action Type", "Balance", "Bank Balance", "Status"];
      const rows = filteredAccounts.map(account => [
        account.name,
        account.account_type,
        account.detail_type,
        account.action_type,
        account.quickbooks_balance,
        account.bank_balance || "",
        account.is_active ? "Active" : "Inactive"
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chart-of-accounts-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Accounts exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV file is empty or invalid");
      }

      // Skip header row
      const dataRows = lines.slice(1);
      const accountsToImport = [];

      for (const line of dataRows) {
        const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, "").trim());
        
        if (!values || values.length < 4) continue;

        const [name, account_type, detail_type, action_type, balance, bank_balance, status] = values;

        if (!name || !account_type || !detail_type) continue;

        accountsToImport.push({
          user_id: user?.id,
          name,
          account_type,
          detail_type,
          action_type: action_type || "report",
          quickbooks_balance: parseFloat(balance) || 0,
          bank_balance: bank_balance ? parseFloat(bank_balance) : null,
          is_active: status?.toLowerCase() === "active"
        });
      }

      if (accountsToImport.length === 0) {
        throw new Error("No valid accounts found in CSV");
      }

      const { error } = await supabase
        .from("chart_of_accounts")
        .insert(accountsToImport);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${accountsToImport.length} accounts imported successfully`,
      });
      
      fetchAccounts();
      event.target.value = ""; // Reset file input
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      event.target.value = ""; // Reset file input
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Chart of Accounts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your business accounts and track balances
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>
            </Button>
            <Button onClick={() => {
              toast({ title: "Opening add account form..." });
              setEditingAccount(null);
              setIsAddEditOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {accountTypes.map((type) => {
            const typeAccounts = accounts.filter((a) => a.account_type === type);
            const totalBalance = typeAccounts.reduce(
              (sum, a) => sum + a.quickbooks_balance,
              0
            );
            return (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{type}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {typeAccounts.length} accounts
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Account Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {accountTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Batch Actions */}
        {selectedAccounts.length > 0 && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedAccounts.length} account(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchToggleStatus(true)}
                  >
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchToggleStatus(false)}
                  >
                    Deactivate
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">Loading accounts...</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No accounts found. Create your first account to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAccounts.length === filteredAccounts.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Detail Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAccounts.includes(account.id)}
                          onCheckedChange={() => toggleSelectAccount(account.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.account_type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {account.detail_type}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(account.quickbooks_balance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.is_active ? "default" : "secondary"}>
                          {account.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingAccount(account);
                                setIsAddEditOpen(true);
                              }}
                            >
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewRegister(account.id)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Register
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRunReport(account.account_type)}>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Run Report
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setAccountToDelete(account.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <AddEditAccountDialog
        open={isAddEditOpen}
        onOpenChange={setIsAddEditOpen}
        account={editingAccount}
        onSuccess={() => {
          setIsAddEditOpen(false);
          setEditingAccount(null);
          fetchAccounts();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (accountToDelete) {
                  handleDelete(accountToDelete);
                  setIsDeleteDialogOpen(false);
                  setAccountToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default ChartOfAccounts;
