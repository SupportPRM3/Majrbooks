import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  ShoppingCart,
  CreditCard,
  Users,
  UserCheck,
  Car,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Edit,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ExcelImportDialog, ExcelRow } from "@/components/ExcelImportDialog";

type TabType = "overview" | "expenses" | "bills" | "purchase-orders" | "bill-payments" | "vendors" | "contractors" | "mileage" | "1099-filings";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  vendor?: string;
  status: string;
}

interface Bill {
  id: string;
  vendor: string;
  amount: number;
  due_date: string;
  status: string;
  description?: string;
}

interface PurchaseOrder {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  status: string;
  items?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  total_spent: number;
}

interface MileageEntry {
  id: string;
  date: string;
  purpose: string;
  miles: number;
  rate: number;
  amount: number;
}

const Expenses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [mileageEntries, setMileageEntries] = useState<MileageEntry[]>([]);
  
  // Dialog states
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showPurchaseOrderDialog, setShowPurchaseOrderDialog] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showMileageDialog, setShowMileageDialog] = useState(false);
  
  // Form states
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "", category: "Office Supplies", date: "", vendor: "" });
  const [billForm, setBillForm] = useState({ vendor: "", amount: "", due_date: "", description: "" });
  const [purchaseOrderForm, setPurchaseOrderForm] = useState({ vendor: "", amount: "", date: "", items: "" });
  const [vendorForm, setVendorForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [mileageForm, setMileageForm] = useState({ date: "", purpose: "", miles: "", rate: "0.67" });
  
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchExpenses(),
      fetchBills(),
      fetchPurchaseOrders(),
      fetchVendors(),
      fetchMileage(),
    ]);
    setLoading(false);
  };

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user?.id)
      .eq("type", "expense")
      .order("date", { ascending: false });
    
    if (!error && data) {
      setExpenses(data.map(t => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        category: "General",
        date: t.date,
        status: "recorded"
      })));
    }
  };

  const fetchBills = async () => {
    // Using invoices table for bills (payables)
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user?.id)
      .order("due_date", { ascending: true });
    
    if (!error && data) {
      setBills(data.map(i => ({
        id: i.id,
        vendor: i.client_name,
        amount: i.amount,
        due_date: i.due_date,
        status: i.status,
        description: i.notes || ""
      })));
    }
  };

  const fetchPurchaseOrders = async () => {
    // Mock data for purchase orders
    setPurchaseOrders([]);
  };

  const fetchVendors = async () => {
    // Get unique vendors from transactions
    const { data, error } = await supabase
      .from("transactions")
      .select("description, amount")
      .eq("user_id", user?.id)
      .eq("type", "expense");
    
    if (!error && data) {
      const vendorMap = new Map<string, number>();
      data.forEach(t => {
        const current = vendorMap.get(t.description) || 0;
        vendorMap.set(t.description, current + t.amount);
      });
      
      setVendors(Array.from(vendorMap.entries()).map(([name, total], idx) => ({
        id: `vendor-${idx}`,
        name,
        total_spent: total
      })));
    }
  };

  const fetchMileage = async () => {
    // Mock mileage data
    setMileageEntries([]);
  };

  const handleExcelImportExpenses = async (rows: ExcelRow[]) => {
    if (!user) throw new Error("Not authenticated");

    const parseAmount = (val: unknown): number => {
      const n = parseFloat(String(val ?? "0").replace(/[^0-9.-]/g, ""));
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
      return {
        user_id: user.id,
        type: "expense",
        amount: parseAmount(get(["amount", "total", "cost", "sum", "value"])),
        description: String(get(["description", "memo", "note", "details", "expense", "item"]) ?? "Imported expense"),
        date: parseDate(get(["date", "expense date", "transaction date", "posting date"])),
      };
    });

    const { error } = await supabase.from("transactions").insert(records);
    if (error) throw new Error(error.message);
    await fetchExpenses();
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.date) {
      toast.error("Please fill all required fields");
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user?.id,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      type: "expense",
      date: expenseForm.date,
    });

    if (error) {
      toast.error("Failed to add expense");
    } else {
      toast.success("Expense added");
      setShowExpenseDialog(false);
      setExpenseForm({ description: "", amount: "", category: "Office Supplies", date: "", vendor: "" });
      fetchExpenses();
    }
  };

  const handleAddBill = async () => {
    if (!billForm.vendor || !billForm.amount || !billForm.due_date) {
      toast.error("Please fill all required fields");
      return;
    }

    const { error } = await supabase.from("invoices").insert({
      user_id: user?.id,
      client_name: billForm.vendor,
      amount: parseFloat(billForm.amount),
      due_date: billForm.due_date,
      invoice_number: `BILL-${Date.now()}`,
      status: "pending",
      notes: billForm.description,
    });

    if (error) {
      toast.error("Failed to add bill");
    } else {
      toast.success("Bill added");
      setShowBillDialog(false);
      setBillForm({ vendor: "", amount: "", due_date: "", description: "" });
      fetchBills();
    }
  };

  const handleAddVendor = () => {
    if (!vendorForm.name) {
      toast.error("Please enter vendor name");
      return;
    }
    
    setVendors(prev => [...prev, {
      id: `vendor-${Date.now()}`,
      name: vendorForm.name,
      email: vendorForm.email,
      phone: vendorForm.phone,
      address: vendorForm.address,
      total_spent: 0
    }]);
    
    toast.success("Vendor added");
    setShowVendorDialog(false);
    setVendorForm({ name: "", email: "", phone: "", address: "" });
  };

  const handleAddMileage = () => {
    if (!mileageForm.date || !mileageForm.purpose || !mileageForm.miles) {
      toast.error("Please fill all required fields");
      return;
    }
    
    const miles = parseFloat(mileageForm.miles);
    const rate = parseFloat(mileageForm.rate);
    
    setMileageEntries(prev => [...prev, {
      id: `mileage-${Date.now()}`,
      date: mileageForm.date,
      purpose: mileageForm.purpose,
      miles,
      rate,
      amount: miles * rate
    }]);
    
    toast.success("Mileage entry added");
    setShowMileageDialog(false);
    setMileageForm({ date: "", purpose: "", miles: "", rate: "0.67" });
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete expense");
    } else {
      toast.success("Expense deleted");
      fetchExpenses();
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBills = bills.reduce((sum, b) => sum + b.amount, 0);
  const pendingBills = bills.filter(b => b.status === "pending").length;
  const totalMileage = mileageEntries.reduce((sum, m) => sum + m.amount, 0);

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "bills", label: "Bills", icon: FileText },
    { id: "purchase-orders", label: "Purchase orders", icon: ShoppingCart },
    { id: "bill-payments", label: "Bill payments", icon: CreditCard },
    { id: "vendors", label: "Vendors", icon: Users },
    { id: "contractors", label: "Contractors", icon: UserCheck },
    { id: "mileage", label: "Mileage", icon: Car },
    { id: "1099-filings", label: "1099 filings", icon: FileSpreadsheet },
  ] as const;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">{expenses.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBills)}</div>
            <p className="text-xs text-muted-foreground mt-1">{pendingBills} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mileage Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMileage)}</div>
            <p className="text-xs text-muted-foreground mt-1">{mileageEntries.reduce((s, m) => s + m.miles, 0)} miles</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No expenses recorded</p>
            ) : (
              <div className="space-y-3">
                {expenses.slice(0, 5).map(expense => (
                  <div key={expense.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(expense.date), "MMM d, yyyy")}</p>
                    </div>
                    <span className="font-semibold text-destructive">-{formatCurrency(expense.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {bills.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No bills due</p>
            ) : (
              <div className="space-y-3">
                {bills.filter(b => b.status === "pending").slice(0, 5).map(bill => (
                  <div key={bill.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{bill.vendor}</p>
                      <p className="text-sm text-muted-foreground">Due: {format(new Date(bill.due_date), "MMM d, yyyy")}</p>
                    </div>
                    <span className="font-semibold">{formatCurrency(bill.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <ExcelImportDialog
          title="Import Expenses from Excel"
          description="Upload an Excel file with columns: date, description, amount. All rows will be imported as expenses."
          onImport={handleExcelImportExpenses}
        />
        <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Description *</Label>
                <Input value={expenseForm.description} onChange={(e) => setExpenseForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <Label>Amount *</Label>
                <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Professional Services">Professional Services</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date *</Label>
                <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <Button onClick={handleAddExpense} className="w-full">Add Expense</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase())).map(expense => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderBills = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Bills & Payables</h2>
        <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Bill</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Bill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Vendor *</Label>
                <Input value={billForm.vendor} onChange={(e) => setBillForm(p => ({ ...p, vendor: e.target.value }))} />
              </div>
              <div>
                <Label>Amount *</Label>
                <Input type="number" value={billForm.amount} onChange={(e) => setBillForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input type="date" value={billForm.due_date} onChange={(e) => setBillForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={billForm.description} onChange={(e) => setBillForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <Button onClick={handleAddBill} className="w-full">Add Bill</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map(bill => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">{bill.vendor}</TableCell>
                <TableCell>{bill.description || "-"}</TableCell>
                <TableCell>{format(new Date(bill.due_date), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={bill.status === "paid" ? "default" : "secondary"}>
                    {bill.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(bill.amount)}</TableCell>
              </TableRow>
            ))}
            {bills.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No bills found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderVendors = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Vendors</h2>
        <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Vendor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Vendor Name *</Label>
                <Input value={vendorForm.name} onChange={(e) => setVendorForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={vendorForm.email} onChange={(e) => setVendorForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={vendorForm.phone} onChange={(e) => setVendorForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea value={vendorForm.address} onChange={(e) => setVendorForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <Button onClick={handleAddVendor} className="w-full">Add Vendor</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map(vendor => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell>{vendor.email || "-"}</TableCell>
                <TableCell>{vendor.phone || "-"}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(vendor.total_spent)}</TableCell>
              </TableRow>
            ))}
            {vendors.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No vendors found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderMileage = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Mileage Tracking</h2>
          <p className="text-sm text-muted-foreground">Track business miles for tax deductions (IRS rate: $0.67/mile for 2024)</p>
        </div>
        <Dialog open={showMileageDialog} onOpenChange={setShowMileageDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Mileage</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Mileage Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={mileageForm.date} onChange={(e) => setMileageForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <Label>Purpose *</Label>
                <Input placeholder="e.g., Client meeting" value={mileageForm.purpose} onChange={(e) => setMileageForm(p => ({ ...p, purpose: e.target.value }))} />
              </div>
              <div>
                <Label>Miles *</Label>
                <Input type="number" step="0.1" value={mileageForm.miles} onChange={(e) => setMileageForm(p => ({ ...p, miles: e.target.value }))} />
              </div>
              <div>
                <Label>Rate ($/mile)</Label>
                <Input type="number" step="0.01" value={mileageForm.rate} onChange={(e) => setMileageForm(p => ({ ...p, rate: e.target.value }))} />
              </div>
              <Button onClick={handleAddMileage} className="w-full">Add Entry</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead className="text-right">Miles</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Deduction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mileageEntries.map(entry => (
              <TableRow key={entry.id}>
                <TableCell>{format(new Date(entry.date), "MMM d, yyyy")}</TableCell>
                <TableCell className="font-medium">{entry.purpose}</TableCell>
                <TableCell className="text-right">{entry.miles}</TableCell>
                <TableCell className="text-right">${entry.rate}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(entry.amount)}</TableCell>
              </TableRow>
            ))}
            {mileageEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No mileage entries</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderContractors = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Contractors</h2>
        <Button onClick={() => navigate("/payroll")}><Plus className="h-4 w-4 mr-2" />Manage Contractors</Button>
      </div>
      <Card className="p-8">
        <p className="text-center text-muted-foreground">
          Contractor management is available in the Payroll section.
        </p>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => navigate("/payroll")}>Go to Payroll → Contractors</Button>
        </div>
      </Card>
    </div>
  );

  const render1099Filings = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">1099 Filings</h2>
        <Button onClick={() => navigate("/form-1099-history")}>View 1099 History</Button>
      </div>
      <Card className="p-8">
        <p className="text-center text-muted-foreground">
          Generate and manage 1099-NEC forms for contractors from the Payroll section.
        </p>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => navigate("/form-1099-history")}>Go to 1099 History</Button>
        </div>
      </Card>
    </div>
  );

  const renderPurchaseOrders = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Purchase Orders</h2>
        <Button disabled><Plus className="h-4 w-4 mr-2" />Create PO</Button>
      </div>
      <Card className="p-8">
        <p className="text-center text-muted-foreground">Purchase order management coming soon.</p>
      </Card>
    </div>
  );

  const renderBillPayments = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Bill Payments</h2>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Bill</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.filter(b => b.status === "paid").map(bill => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">{bill.vendor}</TableCell>
                <TableCell>{bill.description || "-"}</TableCell>
                <TableCell>{format(new Date(bill.due_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(bill.amount)}</TableCell>
              </TableRow>
            ))}
            {bills.filter(b => b.status === "paid").length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No payments recorded</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "expenses": return renderExpenses();
      case "bills": return renderBills();
      case "purchase-orders": return renderPurchaseOrders();
      case "bill-payments": return renderBillPayments();
      case "vendors": return renderVendors();
      case "contractors": return renderContractors();
      case "mileage": return renderMileage();
      case "1099-filings": return render1099Filings();
      default: return renderOverview();
    }
  };

  return (
    <Layout>
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  toast.info(`Switched to ${item.label}`);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                  activeTab === item.id 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-6">
            {sidebarItems.find(i => i.id === activeTab)?.label || "Expenses"}
          </h1>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Expenses;
