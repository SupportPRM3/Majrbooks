import { Link } from "react-router-dom";
import { useState } from "react";
import { 
  ArrowLeft, 
  Download, 
  ChevronRight,
  Users,
  Plus,
  Trash2,
  DollarSign,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface PayrollEntry {
  id: number;
  employeeName: string;
  payType: string;
  hoursWorked: number;
  payRate: number;
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  otherDeductions: number;
  netPay: number;
}

const PayrollSummaryTemplate = () => {
  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [companyName, setCompanyName] = useState("Your Company Name");

  const [entries, setEntries] = useState<PayrollEntry[]>([
    { 
      id: 1, 
      employeeName: "", 
      payType: "hourly",
      hoursWorked: 0, 
      payRate: 0, 
      grossPay: 0,
      federalTax: 0,
      stateTax: 0,
      socialSecurity: 0,
      medicare: 0,
      otherDeductions: 0,
      netPay: 0
    }
  ]);

  const calculatePayroll = (entry: PayrollEntry): PayrollEntry => {
    const grossPay = entry.payType === "hourly" 
      ? entry.hoursWorked * entry.payRate 
      : entry.payRate;
    
    // Simplified tax calculations (for demo purposes)
    const federalTax = grossPay * 0.12; // 12% federal
    const stateTax = grossPay * 0.05; // 5% state
    const socialSecurity = grossPay * 0.062; // 6.2% SS
    const medicare = grossPay * 0.0145; // 1.45% Medicare
    
    const totalDeductions = federalTax + stateTax + socialSecurity + medicare + entry.otherDeductions;
    const netPay = grossPay - totalDeductions;

    return {
      ...entry,
      grossPay,
      federalTax,
      stateTax,
      socialSecurity,
      medicare,
      netPay
    };
  };

  const addEntry = () => {
    setEntries([...entries, { 
      id: Date.now(), 
      employeeName: "", 
      payType: "hourly",
      hoursWorked: 0, 
      payRate: 0, 
      grossPay: 0,
      federalTax: 0,
      stateTax: 0,
      socialSecurity: 0,
      medicare: 0,
      otherDeductions: 0,
      netPay: 0
    }]);
  };

  const removeEntry = (id: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: number, field: keyof PayrollEntry, value: string | number) => {
    setEntries(entries.map(entry => {
      if (entry.id === id) {
        const updated = { ...entry, [field]: value };
        return calculatePayroll(updated);
      }
      return entry;
    }));
  };

  const totals = entries.reduce((acc, entry) => ({
    grossPay: acc.grossPay + entry.grossPay,
    federalTax: acc.federalTax + entry.federalTax,
    stateTax: acc.stateTax + entry.stateTax,
    socialSecurity: acc.socialSecurity + entry.socialSecurity,
    medicare: acc.medicare + entry.medicare,
    otherDeductions: acc.otherDeductions + entry.otherDeductions,
    netPay: acc.netPay + entry.netPay,
  }), {
    grossPay: 0,
    federalTax: 0,
    stateTax: 0,
    socialSecurity: 0,
    medicare: 0,
    otherDeductions: 0,
    netPay: 0
  });

  const handleDownload = () => {
    toast.success("Payroll summary downloaded successfully!");
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
          <span className="text-foreground font-medium">Payroll Summary Sheet</span>
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
            <h1 className="text-3xl font-bold mb-2">Payroll Summary Sheet</h1>
            <p className="text-muted-foreground">
              Organize employee payroll data with automatic calculations
            </p>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download Excel
          </Button>
        </div>

        {/* Payroll Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Pay Period Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <Label>Pay Period Start</Label>
                <Input 
                  type="date"
                  value={payPeriodStart}
                  onChange={(e) => setPayPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <Label>Pay Period End</Label>
                <Input 
                  type="date"
                  value={payPeriodEnd}
                  onChange={(e) => setPayPeriodEnd(e.target.value)}
                />
              </div>
              <div>
                <Label>Pay Date</Label>
                <Input 
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Entries */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Employee Payroll Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[1000px]">
                <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-muted-foreground px-2">
                  <div className="col-span-2">Employee</div>
                  <div className="col-span-1">Type</div>
                  <div className="col-span-1">Hours</div>
                  <div className="col-span-1">Rate</div>
                  <div className="col-span-1">Gross</div>
                  <div className="col-span-1">Fed Tax</div>
                  <div className="col-span-1">State Tax</div>
                  <div className="col-span-1">SS/Med</div>
                  <div className="col-span-1">Other</div>
                  <div className="col-span-1">Net Pay</div>
                  <div className="col-span-1"></div>
                </div>
                <Separator className="mb-4" />
                
                {entries.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-12 gap-2 mb-3 items-center">
                    <div className="col-span-2">
                      <Input 
                        value={entry.employeeName}
                        onChange={(e) => updateEntry(entry.id, 'employeeName', e.target.value)}
                        placeholder="Name"
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Select 
                        value={entry.payType}
                        onValueChange={(value) => updateEntry(entry.id, 'payType', value)}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="salary">Salary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Input 
                        type="number"
                        value={entry.hoursWorked}
                        onChange={(e) => updateEntry(entry.id, 'hoursWorked', parseFloat(e.target.value) || 0)}
                        className="text-sm text-center"
                        disabled={entry.payType === "salary"}
                      />
                    </div>
                    <div className="col-span-1">
                      <Input 
                        type="number"
                        value={entry.payRate}
                        onChange={(e) => updateEntry(entry.id, 'payRate', parseFloat(e.target.value) || 0)}
                        className="text-sm text-right"
                      />
                    </div>
                    <div className="col-span-1 text-right text-sm font-medium">
                      ${entry.grossPay.toFixed(0)}
                    </div>
                    <div className="col-span-1 text-right text-sm text-red-500">
                      ${entry.federalTax.toFixed(0)}
                    </div>
                    <div className="col-span-1 text-right text-sm text-red-500">
                      ${entry.stateTax.toFixed(0)}
                    </div>
                    <div className="col-span-1 text-right text-sm text-red-500">
                      ${(entry.socialSecurity + entry.medicare).toFixed(0)}
                    </div>
                    <div className="col-span-1">
                      <Input 
                        type="number"
                        value={entry.otherDeductions}
                        onChange={(e) => updateEntry(entry.id, 'otherDeductions', parseFloat(e.target.value) || 0)}
                        className="text-sm text-right"
                      />
                    </div>
                    <div className="col-span-1 text-right text-sm font-bold text-primary">
                      ${entry.netPay.toFixed(0)}
                    </div>
                    <div className="col-span-1 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeEntry(entry.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Button variant="outline" onClick={addEntry} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Payroll Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Gross Pay:</span>
                  <span className="font-medium">${totals.grossPay.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-red-500">
                  <span>Federal Tax Withheld:</span>
                  <span>-${totals.federalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>State Tax Withheld:</span>
                  <span>-${totals.stateTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Social Security:</span>
                  <span>-${totals.socialSecurity.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Medicare:</span>
                  <span>-${totals.medicare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Other Deductions:</span>
                  <span>-${totals.otherDeductions.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="p-6 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Net Payroll</p>
                  <p className="text-4xl font-bold text-primary">${totals.netPay.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {entries.length} employee{entries.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayrollSummaryTemplate;
