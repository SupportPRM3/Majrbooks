import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, DollarSign, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BreakEvenCalculator = () => {
  const navigate = useNavigate();
  const [fixedCosts, setFixedCosts] = useState<string>("");
  const [pricePerUnit, setPricePerUnit] = useState<string>("");
  const [variableCostPerUnit, setVariableCostPerUnit] = useState<string>("");
  const [targetProfit, setTargetProfit] = useState<string>("");

  const fixedNum = parseFloat(fixedCosts) || 0;
  const priceNum = parseFloat(pricePerUnit) || 0;
  const variableNum = parseFloat(variableCostPerUnit) || 0;
  const targetNum = parseFloat(targetProfit) || 0;

  const contributionMargin = priceNum - variableNum;
  const contributionMarginRatio = priceNum > 0 ? (contributionMargin / priceNum) * 100 : 0;
  
  const breakEvenUnits = contributionMargin > 0 ? Math.ceil(fixedNum / contributionMargin) : 0;
  const breakEvenRevenue = breakEvenUnits * priceNum;
  
  const unitsForTargetProfit = contributionMargin > 0 ? Math.ceil((fixedNum + targetNum) / contributionMargin) : 0;
  const revenueForTargetProfit = unitsForTargetProfit * priceNum;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/resources")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resources
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Break-Even Calculator</h1>
          <p className="text-muted-foreground mt-2">Determine when your business becomes profitable</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Cost & Pricing Data
              </CardTitle>
              <CardDescription>Enter your business costs and pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fixed">Fixed Costs (Monthly)</Label>
                <Input
                  id="fixed"
                  type="number"
                  placeholder="0.00"
                  value={fixedCosts}
                  onChange={(e) => setFixedCosts(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Rent, salaries, insurance, etc.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price Per Unit</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variable">Variable Cost Per Unit</Label>
                <Input
                  id="variable"
                  type="number"
                  placeholder="0.00"
                  value={variableCostPerUnit}
                  onChange={(e) => setVariableCostPerUnit(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Materials, labor per unit, etc.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target Profit (Optional)</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="0.00"
                  value={targetProfit}
                  onChange={(e) => setTargetProfit(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Break-Even Analysis
              </CardTitle>
              <CardDescription>Your calculated break-even points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Contribution Margin</span>
                  <span className={`font-semibold ${contributionMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(contributionMargin)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Contribution Margin Ratio</span>
                  <span className="font-semibold">{contributionMarginRatio.toFixed(2)}%</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-3">
                <h4 className="font-semibold text-center">Break-Even Point</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Units to Sell</span>
                  <span className="text-xl font-bold text-primary">{formatNumber(breakEvenUnits)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenue Needed</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(breakEvenRevenue)}</span>
                </div>
              </div>

              {targetNum > 0 && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-3">
                  <h4 className="font-semibold text-center flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    To Reach {formatCurrency(targetNum)} Profit
                  </h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Units to Sell</span>
                    <span className="text-xl font-bold text-green-600">{formatNumber(unitsForTargetProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Revenue Needed</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(revenueForTargetProfit)}</span>
                  </div>
                </div>
              )}

              {contributionMargin <= 0 && priceNum > 0 && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-600 text-center">
                    Warning: Your price per unit is less than or equal to your variable cost.
                    You will lose money on every sale.
                  </p>
                </div>
              )}
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

export default BreakEvenCalculator;
