import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, DollarSign, Info, Percent, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TaxResult {
  federalWithholding: number;
  socialSecurity: number;
  medicare: number;
  stateWithholding: number;
  totalWithholding: number;
  netPay: number;
}

// 2024 Federal Tax Brackets (Single)
const federalBracketsSingle = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

// 2024 Federal Tax Brackets (Married Filing Jointly)
const federalBracketsMarried = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
];

// State tax rates (simplified averages)
const stateTaxRates: Record<string, number> = {
  AL: 0.05, AK: 0, AZ: 0.025, AR: 0.047, CA: 0.0725,
  CO: 0.044, CT: 0.0499, DE: 0.066, FL: 0, GA: 0.0549,
  HI: 0.0825, ID: 0.058, IL: 0.0495, IN: 0.0315, IA: 0.06,
  KS: 0.057, KY: 0.045, LA: 0.0425, ME: 0.0715, MD: 0.0575,
  MA: 0.05, MI: 0.0425, MN: 0.0785, MS: 0.05, MO: 0.0495,
  MT: 0.0675, NE: 0.0684, NV: 0, NH: 0, NJ: 0.0637,
  NM: 0.059, NY: 0.0685, NC: 0.0525, ND: 0.029, OH: 0.04,
  OK: 0.0475, OR: 0.099, PA: 0.0307, RI: 0.0599, SC: 0.065,
  SD: 0, TN: 0, TX: 0, UT: 0.0485, VT: 0.0875,
  VA: 0.0575, WA: 0, WV: 0.065, WI: 0.0765, WY: 0,
};

const states = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

const TaxWithholdingCalculator = () => {
  const navigate = useNavigate();
  
  const [grossPay, setGrossPay] = useState("");
  const [payFrequency, setPayFrequency] = useState("biweekly");
  const [filingStatus, setFilingStatus] = useState("single");
  const [state, setState] = useState("TX");
  const [allowances, setAllowances] = useState("0");
  const [additionalWithholding, setAdditionalWithholding] = useState("0");
  const [result, setResult] = useState<TaxResult | null>(null);

  const calculatePayPeriodsPerYear = (frequency: string): number => {
    switch (frequency) {
      case "weekly": return 52;
      case "biweekly": return 26;
      case "semimonthly": return 24;
      case "monthly": return 12;
      default: return 26;
    }
  };

  const calculateFederalTax = (annualIncome: number, status: string): number => {
    const brackets = status === "married" ? federalBracketsMarried : federalBracketsSingle;
    let tax = 0;
    let remainingIncome = annualIncome;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    return tax;
  };

  const handleCalculate = () => {
    const gross = parseFloat(grossPay) || 0;
    const payPeriods = calculatePayPeriodsPerYear(payFrequency);
    const annualGross = gross * payPeriods;
    
    // Standard deduction reduces taxable income
    const standardDeduction = filingStatus === "married" ? 29200 : 14600;
    const allowanceReduction = (parseInt(allowances) || 0) * 4300;
    const taxableIncome = Math.max(0, annualGross - standardDeduction - allowanceReduction);
    
    // Calculate annual federal tax and convert to per-period
    const annualFederalTax = calculateFederalTax(taxableIncome, filingStatus);
    const federalWithholding = annualFederalTax / payPeriods;
    
    // Social Security (6.2% up to $168,600 wage base for 2024)
    const socialSecurityWageBase = 168600;
    const socialSecurityRate = 0.062;
    const annualSocialSecurity = Math.min(annualGross, socialSecurityWageBase) * socialSecurityRate;
    const socialSecurity = annualSocialSecurity / payPeriods;
    
    // Medicare (1.45%, plus 0.9% additional for income over $200k)
    const medicareRate = 0.0145;
    const additionalMedicareRate = 0.009;
    const additionalMedicareThreshold = filingStatus === "married" ? 250000 : 200000;
    let annualMedicare = annualGross * medicareRate;
    if (annualGross > additionalMedicareThreshold) {
      annualMedicare += (annualGross - additionalMedicareThreshold) * additionalMedicareRate;
    }
    const medicare = annualMedicare / payPeriods;
    
    // State tax
    const stateRate = stateTaxRates[state] || 0;
    const stateWithholding = gross * stateRate;
    
    // Additional withholding
    const additional = parseFloat(additionalWithholding) || 0;
    
    // Total calculations
    const totalWithholding = federalWithholding + socialSecurity + medicare + stateWithholding + additional;
    const netPay = gross - totalWithholding;

    setResult({
      federalWithholding,
      socialSecurity,
      medicare,
      stateWithholding,
      totalWithholding,
      netPay,
    });
  };

  const handleReset = () => {
    setGrossPay("");
    setPayFrequency("biweekly");
    setFilingStatus("single");
    setState("TX");
    setAllowances("0");
    setAdditionalWithholding("0");
    setResult(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/resources")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Tax Withholding Calculator</h1>
            <p className="text-muted-foreground">Estimate federal and state tax withholdings for payroll</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Employee Information
              </CardTitle>
              <CardDescription>
                Enter pay details to calculate withholdings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Gross Pay */}
              <div className="space-y-2">
                <Label htmlFor="grossPay" className="flex items-center gap-2">
                  Gross Pay per Period
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total earnings before any deductions</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="grossPay"
                    type="number"
                    placeholder="0.00"
                    value={grossPay}
                    onChange={(e) => setGrossPay(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Pay Frequency */}
              <div className="space-y-2">
                <Label>Pay Frequency</Label>
                <Select value={payFrequency} onValueChange={setPayFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly (52 paychecks/year)</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly (26 paychecks/year)</SelectItem>
                    <SelectItem value="semimonthly">Semi-monthly (24 paychecks/year)</SelectItem>
                    <SelectItem value="monthly">Monthly (12 paychecks/year)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filing Status */}
              <div className="space-y-2">
                <Label>Federal Filing Status</Label>
                <Select value={filingStatus} onValueChange={setFilingStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single or Married Filing Separately</SelectItem>
                    <SelectItem value="married">Married Filing Jointly</SelectItem>
                    <SelectItem value="head">Head of Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name} {stateTaxRates[s.code] === 0 && "(No State Tax)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Allowances */}
              <div className="space-y-2">
                <Label htmlFor="allowances" className="flex items-center gap-2">
                  Allowances (W-4)
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of allowances claimed on Form W-4</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="allowances"
                  type="number"
                  min="0"
                  value={allowances}
                  onChange={(e) => setAllowances(e.target.value)}
                />
              </div>

              {/* Additional Withholding */}
              <div className="space-y-2">
                <Label htmlFor="additional" className="flex items-center gap-2">
                  Additional Withholding
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Extra amount to withhold each pay period</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="additional"
                    type="number"
                    placeholder="0.00"
                    value={additionalWithholding}
                    onChange={(e) => setAdditionalWithholding(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleCalculate} className="flex-1 gap-2">
                  <Calculator className="h-4 w-4" />
                  Calculate
                </Button>
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Withholding Results
              </CardTitle>
              <CardDescription>
                Estimated tax withholdings per pay period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Gross Pay */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gross Pay</span>
                    <span className="text-lg font-semibold">{formatCurrency(parseFloat(grossPay) || 0)}</span>
                  </div>

                  <Separator />

                  {/* Tax Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      Tax Deductions
                    </h4>
                    
                    <div className="space-y-3 pl-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Federal Income Tax</span>
                        <span className="font-medium text-destructive">-{formatCurrency(result.federalWithholding)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Social Security (6.2%)</span>
                        <span className="font-medium text-destructive">-{formatCurrency(result.socialSecurity)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Medicare (1.45%)</span>
                        <span className="font-medium text-destructive">-{formatCurrency(result.medicare)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">State Tax ({state})</span>
                        <span className="font-medium text-destructive">-{formatCurrency(result.stateWithholding)}</span>
                      </div>
                      {parseFloat(additionalWithholding) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Additional Withholding</span>
                          <span className="font-medium text-destructive">-{formatCurrency(parseFloat(additionalWithholding))}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Withholdings</span>
                      <span className="font-semibold text-destructive">-{formatCurrency(result.totalWithholding)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-primary/10 rounded-lg p-4">
                      <span className="font-medium">Estimated Net Pay</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(result.netPay)}</span>
                    </div>
                  </div>

                  {/* Annual Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-sm">Annual Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Annual Gross</span>
                        <p className="font-semibold">{formatCurrency((parseFloat(grossPay) || 0) * calculatePayPeriodsPerYear(payFrequency))}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Annual Net</span>
                        <p className="font-semibold">{formatCurrency(result.netPay * calculatePayPeriodsPerYear(payFrequency))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calculator className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Enter employee pay details and click Calculate to see estimated withholdings
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <Card className="mt-6 bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Disclaimer</p>
                <p>
                  This calculator provides estimates based on 2024 federal tax brackets and simplified state tax rates. 
                  Actual withholdings may vary based on specific employee circumstances, local taxes, pre-tax deductions, 
                  and employer-specific policies. Consult a tax professional for precise calculations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TaxWithholdingCalculator;
