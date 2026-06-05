import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Check, AlertTriangle, Info, Star, Home, Car, Heart, Briefcase, GraduationCap, Users, Building2, Calculator, FileText, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TaxDeductionsCheatSheet = () => {
  const navigate = useNavigate();

  const commonlyOverlookedDeductions = [
    {
      title: "Home Office Deduction",
      icon: Home,
      irsForm: "Form 8829",
      description: "Deduct a portion of rent, utilities, and insurance if you use part of your home exclusively for business.",
      methods: [
        { name: "Simplified Method", details: "$5 per square foot, up to 300 sq ft ($1,500 max)" },
        { name: "Regular Method", details: "Actual expenses × (office sq ft ÷ total home sq ft)" }
      ],
      requirements: [
        "Must be used regularly and exclusively for business",
        "Must be your principal place of business",
        "Can include a separate structure like a garage or shed"
      ],
      maxDeduction: "Varies based on method"
    },
    {
      title: "Vehicle Expenses",
      icon: Car,
      irsForm: "Schedule C / Form 4562",
      description: "Deduct costs of using your vehicle for business purposes.",
      methods: [
        { name: "Standard Mileage Rate (2024)", details: "67 cents per mile" },
        { name: "Actual Expense Method", details: "Gas, insurance, repairs, depreciation × business %" }
      ],
      requirements: [
        "Keep a mileage log with date, destination, purpose, and miles",
        "Cannot switch methods for leased vehicles",
        "Commuting from home to office is NOT deductible"
      ],
      maxDeduction: "No limit for business use"
    },
    {
      title: "Health Insurance Premiums",
      icon: Heart,
      irsForm: "Form 1040, Line 17",
      description: "Self-employed individuals can deduct 100% of health insurance premiums for themselves and family.",
      methods: [
        { name: "Self-Employed Health Insurance", details: "Deducted on Form 1040 (above-the-line)" }
      ],
      requirements: [
        "Must be self-employed with net profit",
        "Cannot be eligible for employer-sponsored plan (including spouse's)",
        "Includes medical, dental, and long-term care insurance"
      ],
      maxDeduction: "100% of premiums (limited to net profit)"
    },
    {
      title: "Self-Employment Tax Deduction",
      icon: Calculator,
      irsForm: "Schedule SE",
      description: "Deduct 50% of your self-employment tax (Social Security and Medicare).",
      methods: [
        { name: "Automatic Deduction", details: "50% of SE tax on Form 1040" }
      ],
      requirements: [
        "Must have net self-employment income over $400",
        "Calculated automatically when filing Schedule SE"
      ],
      maxDeduction: "50% of self-employment tax"
    },
    {
      title: "Retirement Contributions",
      icon: DollarSign,
      irsForm: "Form 1040 / Form 5500",
      description: "Contributions to SEP-IRA, SIMPLE IRA, or Solo 401(k) are tax-deductible.",
      methods: [
        { name: "SEP-IRA", details: "Up to 25% of net self-employment income" },
        { name: "Solo 401(k)", details: "Employee: $23,000 + Employer: 25% of compensation" },
        { name: "SIMPLE IRA", details: "Employee: $16,000 + Employer match" }
      ],
      requirements: [
        "Must have self-employment income",
        "Contribution limits vary by plan type",
        "Catch-up contributions available for 50+"
      ],
      maxDeduction: "Up to $69,000 (Solo 401k for 2024)"
    },
    {
      title: "Professional Development",
      icon: GraduationCap,
      irsForm: "Schedule C",
      description: "Education that maintains or improves skills needed in your current business.",
      methods: [
        { name: "Direct Deduction", details: "100% deductible on Schedule C" }
      ],
      requirements: [
        "Must relate to current business or profession",
        "Cannot qualify you for a new career",
        "Includes conferences, courses, books, subscriptions"
      ],
      maxDeduction: "No limit"
    },
    {
      title: "Business Startup Costs",
      icon: Lightbulb,
      irsForm: "Form 4562",
      description: "Deduct up to $5,000 of startup costs in your first year of business.",
      methods: [
        { name: "First Year Deduction", details: "Up to $5,000 deductible immediately" },
        { name: "Amortization", details: "Remaining costs amortized over 15 years" }
      ],
      requirements: [
        "Costs incurred before business began operations",
        "Includes market research, advertising, training",
        "Phase-out begins at $50,000 in startup costs"
      ],
      maxDeduction: "$5,000 first year + amortization"
    },
    {
      title: "Business Insurance",
      icon: Building2,
      irsForm: "Schedule C",
      description: "Premiums for business-related insurance policies.",
      methods: [
        { name: "Direct Deduction", details: "100% deductible in year paid" }
      ],
      requirements: [
        "General liability, professional liability, property insurance",
        "Workers' compensation and business interruption",
        "Must be ordinary and necessary for your business"
      ],
      maxDeduction: "No limit"
    }
  ];

  const deductionLimits2024 = [
    { deduction: "Standard Mileage Rate", limit: "67¢ per mile", notes: "For business use of vehicle" },
    { deduction: "Section 179 Deduction", limit: "$1,220,000", notes: "Equipment and property" },
    { deduction: "Bonus Depreciation", limit: "60%", notes: "Qualified property (phasing out)" },
    { deduction: "Business Meals", limit: "50%", notes: "Must be business-related" },
    { deduction: "Home Office (Simplified)", limit: "$1,500", notes: "$5 × 300 sq ft max" },
    { deduction: "SEP-IRA Contribution", limit: "$69,000", notes: "Or 25% of compensation" },
    { deduction: "Solo 401(k) Total", limit: "$69,000", notes: "Plus $7,500 catch-up if 50+" },
    { deduction: "SIMPLE IRA", limit: "$16,000", notes: "Plus $3,500 catch-up if 50+" },
    { deduction: "Health Insurance (Self-Employed)", limit: "100%", notes: "Limited to net profit" },
    { deduction: "Startup Costs (Year 1)", limit: "$5,000", notes: "Phase-out at $50,000" }
  ];

  const recordKeepingTips = [
    { item: "Receipts", period: "3 years minimum", tip: "Scan and store digitally with date and purpose" },
    { item: "Mileage Log", period: "3 years", tip: "Record date, destination, business purpose, and miles" },
    { item: "Bank Statements", period: "3-7 years", tip: "Supports expense deductions" },
    { item: "Tax Returns", period: "7 years", tip: "Keep copies of all filed returns" },
    { item: "Home Office Records", period: "As long as you claim deduction", tip: "Keep utility bills, rent/mortgage statements" },
    { item: "Vehicle Records", period: "Life of vehicle + 3 years", tip: "Purchase docs, maintenance, insurance" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/resources")} className="gap-1 p-0 h-auto">
            <ArrowLeft className="h-4 w-4" />
            Resources
          </Button>
          <span>/</span>
          <span>Tax Deductions Cheat Sheet</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-4 rounded-xl">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tax Deductions Cheat Sheet</h1>
              <p className="text-muted-foreground">Commonly Overlooked Deductions for Small Business Owners</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">Cheat Sheet</Badge>
            <Badge variant="secondary">IRS Guidelines</Badge>
            <Badge variant="secondary">2024 Tax Year</Badge>
          </div>
        </motion.div>

        {/* Alert */}
        <Alert className="mb-8 border-yellow-500/20 bg-yellow-500/5">
          <Star className="h-4 w-4 text-yellow-500" />
          <AlertTitle>Maximize Your Potential Deductions</AlertTitle>
          <AlertDescription>
            Many small business owners may overlook common deductions. 
            Review this cheat sheet with your tax professional to explore all legitimate deductions that may apply to your situation.
          </AlertDescription>
        </Alert>

        {/* 2024 Limits Quick Reference */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              2024 Deduction Limits Quick Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 font-medium">Deduction</th>
                    <th className="text-left py-3 font-medium">2024 Limit</th>
                    <th className="text-left py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {deductionLimits2024.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-3">{item.deduction}</td>
                      <td className="py-3 font-semibold text-primary">{item.limit}</td>
                      <td className="py-3 text-muted-foreground">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Main Deductions */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Commonly Overlooked Deductions</h2>
          <Accordion type="multiple" className="space-y-4">
            {commonlyOverlookedDeductions.map((deduction, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <deduction.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{deduction.title}</h3>
                      <p className="text-sm text-muted-foreground">{deduction.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="pl-14 space-y-4">
                    {/* Methods */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Calculation Methods:</h4>
                      <div className="space-y-2">
                        {deduction.methods.map((method, mIdx) => (
                          <div key={mIdx} className="bg-muted/50 p-3 rounded-lg">
                            <span className="font-medium">{method.name}: </span>
                            <span className="text-muted-foreground">{method.details}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Requirements */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Requirements:</h4>
                      <ul className="space-y-1">
                        {deduction.requirements.map((req, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="outline">{deduction.irsForm}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Max Deduction: <span className="font-semibold text-primary">{deduction.maxDeduction}</span>
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Record Keeping */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Record-Keeping Requirements
            </CardTitle>
            <CardDescription>
              The IRS requires you to keep records to support your deductions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recordKeepingTips.map((record, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="min-w-[120px]">
                    <span className="font-medium">{record.item}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{record.period}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{record.tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Alert className="mb-8 border-destructive/20 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle>Red Flags to Avoid</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Claiming 100% business use of a vehicle (rarely passes audit)</li>
              <li>• Deducting personal expenses as business expenses</li>
              <li>• Claiming home office while also renting office space full-time</li>
              <li>• Inconsistent income/expense patterns year over year</li>
              <li>• Missing documentation for large deductions</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Disclaimer */}
        <Alert className="mb-8 border-muted bg-muted/30">
          <Info className="h-4 w-4" />
          <AlertTitle>Important Disclaimer</AlertTitle>
          <AlertDescription>
            This cheat sheet is for informational purposes only and does not constitute tax advice. 
            Tax laws change frequently. Consult a qualified tax professional to determine which deductions apply to your specific situation.
          </AlertDescription>
        </Alert>

        {/* Footer CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Ready to Track Your Expenses?</h3>
                <p className="text-muted-foreground">Use MAJR Books to help organize and categorize your expenses for easier tax preparation.</p>
              </div>
              <Button onClick={() => navigate("/expenses")}>
                Start Tracking Expenses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaxDeductionsCheatSheet;
