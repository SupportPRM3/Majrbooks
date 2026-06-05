import { Link } from "react-router-dom";
import { useState } from "react";
import { 
  ArrowLeft, 
  Download, 
  Plus, 
  Trash2, 
  ChevronRight,
  Receipt,
  Calendar,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ExpenseItem {
  id: number;
  date: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  receipt: boolean;
}

const categories = [
  "Meals & Entertainment",
  "Office Supplies",
  "Travel",
  "Utilities",
  "Software & Subscriptions",
  "Professional Services",
  "Marketing",
  "Equipment",
  "Insurance",
  "Other"
];

const ExpenseReportTemplate = () => {
  const [reportTitle, setReportTitle] = useState("Monthly Expense Report");
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [reportPeriod, setReportPeriod] = useState("");
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 1, date: "", vendor: "", category: "", description: "", amount: 0, receipt: false }
  ]);

  const addExpense = () => {
    setExpenses([...expenses, { 
      id: Date.now(), 
      date: "", 
      vendor: "", 
      category: "", 
      description: "", 
      amount: 0,
      receipt: false
    }]);
  };

  const removeExpense = (id: number) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter(item => item.id !== id));
    }
  };

  const updateExpense = (id: number, field: keyof ExpenseItem, value: string | number | boolean) => {
    setExpenses(expenses.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = categories.map(cat => ({
    category: cat,
    total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.total > 0);

  const handleDownload = () => {
    toast.success("Expense report template downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/resources" className="hover:text-foreground transition-colors">
            Resources
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/resources" className="hover:text-foreground transition-colors">
            Templates
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Expense Report Template</span>
        </nav>

        {/* Back Button */}
        <Link to="/resources">
          <Button variant="ghost" className="mb-6 -ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Expense Report Template</h1>
            <p className="text-muted-foreground">
              Track and categorize business expenses with automatic totals
            </p>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download Excel
          </Button>
        </div>

        {/* Report Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Report Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Report Title</Label>
                <Input 
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Monthly Expense Report"
                />
              </div>
              <div>
                <Label>Employee Name</Label>
                <Input 
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Department</Label>
                <Input 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Sales"
                />
              </div>
              <div>
                <Label>Report Period</Label>
                <Input 
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  placeholder="December 2024"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Expense Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-semibold text-muted-foreground px-2">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Vendor</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-1 text-right">Amount</div>
                  <div className="col-span-1 text-center">Receipt</div>
                  <div className="col-span-1"></div>
                </div>
                <Separator className="mb-4" />
                
                {expenses.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 mb-3 items-center">
                    <div className="col-span-2">
                      <Input 
                        type="date"
                        value={item.date}
                        onChange={(e) => updateExpense(item.id, 'date', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        value={item.vendor}
                        onChange={(e) => updateExpense(item.id, 'vendor', e.target.value)}
                        placeholder="Vendor"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Select 
                        value={item.category}
                        onValueChange={(value) => updateExpense(item.id, 'category', value)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input 
                        value={item.description}
                        onChange={(e) => updateExpense(item.id, 'description', e.target.value)}
                        placeholder="Description"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input 
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateExpense(item.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="text-right text-sm"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button 
                        variant={item.receipt ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateExpense(item.id, 'receipt', !item.receipt)}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeExpense(item.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Button variant="outline" onClick={addExpense} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryTotals.length > 0 ? (
                <div className="space-y-3">
                  {categoryTotals.map(({ category, total }) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{category}</span>
                      <span className="font-medium">${total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Add expenses to see category breakdown
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Expenses:</span>
                  <span className="font-medium">{expenses.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Receipts Attached:</span>
                  <span className="font-medium">{expenses.filter(e => e.receipt).length}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-primary">${totalExpenses.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExpenseReportTemplate;
