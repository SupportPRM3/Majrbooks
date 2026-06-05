import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, TrendingUp, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfitCalculator = () => {
  const navigate = useNavigate();
  const [revenue, setRevenue] = useState<string>("");
  const [costOfGoods, setCostOfGoods] = useState<string>("");
  const [operatingExpenses, setOperatingExpenses] = useState<string>("");
  const [otherIncome, setOtherIncome] = useState<string>("");
  const [otherExpenses, setOtherExpenses] = useState<string>("");

  const revenueNum = parseFloat(revenue) || 0;
  const cogsNum = parseFloat(costOfGoods) || 0;
  const opExpNum = parseFloat(operatingExpenses) || 0;
  const otherIncNum = parseFloat(otherIncome) || 0;
  const otherExpNum = parseFloat(otherExpenses) || 0;

  const grossProfit = revenueNum - cogsNum;
  const grossMargin = revenueNum > 0 ? (grossProfit / revenueNum) * 100 : 0;
  const operatingProfit = grossProfit - opExpNum;
  const operatingMargin = revenueNum > 0 ? (operatingProfit / revenueNum) * 100 : 0;
  const netProfit = operatingProfit + otherIncNum - otherExpNum;
  const netMargin = revenueNum > 0 ? (netProfit / revenueNum) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/resources")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resources
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profit Calculator</h1>
          <p className="text-muted-foreground mt-2">Calculate gross, operating, and net profit margins</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Income & Expenses
              </CardTitle>
              <CardDescription>Enter your financial data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="revenue">Total Revenue</Label>
                <Input
                  id="revenue"
                  type="number"
                  placeholder="0.00"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cogs">Cost of Goods Sold (COGS)</Label>
                <Input
                  id="cogs"
                  type="number"
                  placeholder="0.00"
                  value={costOfGoods}
                  onChange={(e) => setCostOfGoods(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opexp">Operating Expenses</Label>
                <Input
                  id="opexp"
                  type="number"
                  placeholder="0.00"
                  value={operatingExpenses}
                  onChange={(e) => setOperatingExpenses(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherinc">Other Income</Label>
                <Input
                  id="otherinc"
                  type="number"
                  placeholder="0.00"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherexp">Other Expenses</Label>
                <Input
                  id="otherexp"
                  type="number"
                  placeholder="0.00"
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Profit Analysis
              </CardTitle>
              <CardDescription>Your calculated profit metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gross Profit</span>
                  <span className={`font-semibold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gross Margin</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    {grossMargin.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Operating Profit</span>
                  <span className={`font-semibold ${operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(operatingProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Operating Margin</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    {operatingMargin.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Net Profit</span>
                  <span className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Net Margin</span>
                  <span className="text-xl font-bold flex items-center gap-1">
                    <Percent className="h-4 w-4" />
                    {netMargin.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Disclaimer:</strong> This calculator provides estimates for informational purposes only.
              Consult with a qualified accountant for accurate financial analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfitCalculator;
