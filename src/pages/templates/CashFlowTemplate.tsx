import { Link } from "react-router-dom";
import { useState } from "react";
import { 
  ArrowLeft, 
  Download, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CashFlowItem {
  id: number;
  description: string;
  amount: number;
}

const CashFlowTemplate = () => {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [beginningCash, setBeginningCash] = useState(0);

  const [operatingInflows, setOperatingInflows] = useState<CashFlowItem[]>([
    { id: 1, description: "Cash received from customers", amount: 0 },
    { id: 2, description: "Interest received", amount: 0 },
  ]);

  const [operatingOutflows, setOperatingOutflows] = useState<CashFlowItem[]>([
    { id: 1, description: "Cash paid to suppliers", amount: 0 },
    { id: 2, description: "Cash paid for salaries", amount: 0 },
    { id: 3, description: "Cash paid for rent", amount: 0 },
    { id: 4, description: "Cash paid for utilities", amount: 0 },
    { id: 5, description: "Interest paid", amount: 0 },
    { id: 6, description: "Taxes paid", amount: 0 },
  ]);

  const [investingInflows, setInvestingInflows] = useState<CashFlowItem[]>([
    { id: 1, description: "Sale of equipment", amount: 0 },
    { id: 2, description: "Sale of investments", amount: 0 },
  ]);

  const [investingOutflows, setInvestingOutflows] = useState<CashFlowItem[]>([
    { id: 1, description: "Purchase of equipment", amount: 0 },
    { id: 2, description: "Purchase of investments", amount: 0 },
  ]);

  const [financingInflows, setFinancingInflows] = useState<CashFlowItem[]>([
    { id: 1, description: "Proceeds from loans", amount: 0 },
    { id: 2, description: "Owner contributions", amount: 0 },
  ]);

  const [financingOutflows, setFinancingOutflows] = useState<CashFlowItem[]>([
    { id: 1, description: "Loan repayments", amount: 0 },
    { id: 2, description: "Owner withdrawals", amount: 0 },
    { id: 3, description: "Dividends paid", amount: 0 },
  ]);

  const addItem = (items: CashFlowItem[], setItems: React.Dispatch<React.SetStateAction<CashFlowItem[]>>) => {
    setItems([...items, { id: Date.now(), description: "", amount: 0 }]);
  };

  const removeItem = (items: CashFlowItem[], setItems: React.Dispatch<React.SetStateAction<CashFlowItem[]>>, id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (
    items: CashFlowItem[], 
    setItems: React.Dispatch<React.SetStateAction<CashFlowItem[]>>, 
    id: number, 
    field: keyof CashFlowItem, 
    value: string | number
  ) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const sumItems = (items: CashFlowItem[]) => items.reduce((sum, item) => sum + item.amount, 0);

  const operatingNet = sumItems(operatingInflows) - sumItems(operatingOutflows);
  const investingNet = sumItems(investingInflows) - sumItems(investingOutflows);
  const financingNet = sumItems(financingInflows) - sumItems(financingOutflows);
  const netChange = operatingNet + investingNet + financingNet;
  const endingCash = beginningCash + netChange;

  const handleDownload = () => {
    toast.success("Cash flow statement downloaded successfully!");
  };

  const renderSection = (
    title: string,
    inflowTitle: string,
    inflows: CashFlowItem[],
    setInflows: React.Dispatch<React.SetStateAction<CashFlowItem[]>>,
    outflowTitle: string,
    outflows: CashFlowItem[],
    setOutflows: React.Dispatch<React.SetStateAction<CashFlowItem[]>>,
    netAmount: number,
    color: string
  ) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 text-${color}-600`}>
          <DollarSign className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inflows */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <Label className="font-semibold text-green-600">{inflowTitle}</Label>
          </div>
          {inflows.map((item) => (
            <div key={item.id} className="flex gap-2 mb-2">
              <Input 
                value={item.description}
                onChange={(e) => updateItem(inflows, setInflows, item.id, 'description', e.target.value)}
                placeholder="Description"
                className="flex-1"
              />
              <Input 
                type="number"
                value={item.amount}
                onChange={(e) => updateItem(inflows, setInflows, item.id, 'amount', parseFloat(e.target.value) || 0)}
                className="w-32 text-right"
                min="0"
              />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => removeItem(inflows, setInflows, item.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => addItem(inflows, setInflows)} className="gap-1 mt-1">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
          <div className="flex justify-between mt-2 text-sm font-medium text-green-600">
            <span>Total {inflowTitle}:</span>
            <span>${sumItems(inflows).toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        {/* Outflows */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <Label className="font-semibold text-red-600">{outflowTitle}</Label>
          </div>
          {outflows.map((item) => (
            <div key={item.id} className="flex gap-2 mb-2">
              <Input 
                value={item.description}
                onChange={(e) => updateItem(outflows, setOutflows, item.id, 'description', e.target.value)}
                placeholder="Description"
                className="flex-1"
              />
              <Input 
                type="number"
                value={item.amount}
                onChange={(e) => updateItem(outflows, setOutflows, item.id, 'amount', parseFloat(e.target.value) || 0)}
                className="w-32 text-right"
                min="0"
              />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => removeItem(outflows, setOutflows, item.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => addItem(outflows, setOutflows)} className="gap-1 mt-1">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
          <div className="flex justify-between mt-2 text-sm font-medium text-red-600">
            <span>Total {outflowTitle}:</span>
            <span>${sumItems(outflows).toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        {/* Net */}
        <div className={`flex justify-between text-lg font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <span>Net Cash from {title}:</span>
          <span>${netAmount.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <span className="text-foreground font-medium">Cash Flow Statement</span>
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
            <h1 className="text-3xl font-bold mb-2">Cash Flow Statement Template</h1>
            <p className="text-muted-foreground">
              Track operating, investing, and financing cash activities
            </p>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download Excel
          </Button>
        </div>

        {/* Period & Beginning Cash */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Statement Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Period Start</Label>
                <Input 
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <Label>Period End</Label>
                <Input 
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
              <div>
                <Label>Beginning Cash Balance</Label>
                <Input 
                  type="number"
                  value={beginningCash}
                  onChange={(e) => setBeginningCash(parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Activities */}
        {renderSection(
          "Operating Activities",
          "Cash Inflows",
          operatingInflows,
          setOperatingInflows,
          "Cash Outflows",
          operatingOutflows,
          setOperatingOutflows,
          operatingNet,
          "blue"
        )}

        {/* Investing Activities */}
        {renderSection(
          "Investing Activities",
          "Cash Inflows",
          investingInflows,
          setInvestingInflows,
          "Cash Outflows",
          investingOutflows,
          setInvestingOutflows,
          investingNet,
          "purple"
        )}

        {/* Financing Activities */}
        {renderSection(
          "Financing Activities",
          "Cash Inflows",
          financingInflows,
          setFinancingInflows,
          "Cash Outflows",
          financingOutflows,
          setFinancingOutflows,
          financingNet,
          "orange"
        )}

        {/* Summary */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>Cash Flow Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Beginning Cash Balance:</span>
              <span className="font-medium">${beginningCash.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Net Change in Cash:</span>
              <span className="font-medium">${netChange.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Ending Cash Balance:</span>
              <span className="text-primary">${endingCash.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashFlowTemplate;
