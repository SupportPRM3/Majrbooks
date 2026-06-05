import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Check, Info, FileText, DollarSign, BarChart3, PieChart, Calculator, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FinancialStatementsGuide = () => {
  const navigate = useNavigate();

  const statements = [
    {
      id: "income-statement",
      name: "Income Statement (P&L)",
      subtitle: "Profit & Loss Statement",
      icon: TrendingUp,
      purpose: "Shows your business profitability over a specific period",
      frequency: "Monthly, Quarterly, Annually",
      keyQuestion: "Is my business making or losing money?",
      sections: [
        {
          name: "Revenue (Income)",
          description: "All money earned from business activities",
          items: ["Sales Revenue", "Service Revenue", "Interest Income", "Other Income"],
          example: { label: "Total Revenue", value: "$150,000" }
        },
        {
          name: "Cost of Goods Sold (COGS)",
          description: "Direct costs of producing products or services",
          items: ["Materials", "Direct Labor", "Manufacturing Overhead", "Shipping Costs"],
          example: { label: "Total COGS", value: "$45,000" }
        },
        {
          name: "Gross Profit",
          description: "Revenue minus Cost of Goods Sold",
          items: ["Revenue - COGS = Gross Profit"],
          example: { label: "Gross Profit", value: "$105,000" }
        },
        {
          name: "Operating Expenses",
          description: "Day-to-day costs of running the business",
          items: ["Rent", "Salaries", "Utilities", "Marketing", "Insurance", "Depreciation"],
          example: { label: "Total Operating Expenses", value: "$65,000" }
        },
        {
          name: "Net Income",
          description: "Final profit after all expenses and taxes",
          items: ["Gross Profit - Operating Expenses - Taxes = Net Income"],
          example: { label: "Net Income", value: "$32,000" }
        }
      ],
      keyMetrics: [
        { name: "Gross Profit Margin", formula: "(Revenue - COGS) / Revenue × 100", benchmark: "Varies by industry (40-60% typical)" },
        { name: "Net Profit Margin", formula: "Net Income / Revenue × 100", benchmark: "10-20% is healthy for most businesses" },
        { name: "Operating Margin", formula: "Operating Income / Revenue × 100", benchmark: "15-25% is strong" }
      ]
    },
    {
      id: "balance-sheet",
      name: "Balance Sheet",
      subtitle: "Statement of Financial Position",
      icon: BarChart3,
      purpose: "Shows what your business owns and owes at a specific point in time",
      frequency: "Monthly, Quarterly, Annually (as of a specific date)",
      keyQuestion: "What is my business worth?",
      sections: [
        {
          name: "Assets",
          description: "What your business owns",
          items: ["Cash", "Accounts Receivable", "Inventory", "Equipment", "Real Estate", "Investments"],
          example: { label: "Total Assets", value: "$250,000" }
        },
        {
          name: "Liabilities",
          description: "What your business owes",
          items: ["Accounts Payable", "Credit Card Debt", "Loans", "Accrued Expenses", "Deferred Revenue"],
          example: { label: "Total Liabilities", value: "$80,000" }
        },
        {
          name: "Owner's Equity",
          description: "The owner's stake in the business (Assets - Liabilities)",
          items: ["Owner's Capital", "Retained Earnings", "Owner's Draws"],
          example: { label: "Total Equity", value: "$170,000" }
        }
      ],
      keyMetrics: [
        { name: "Current Ratio", formula: "Current Assets / Current Liabilities", benchmark: "1.5-2.0 is healthy (can pay short-term debts)" },
        { name: "Debt-to-Equity Ratio", formula: "Total Liabilities / Owner's Equity", benchmark: "Below 1.0 is conservative" },
        { name: "Working Capital", formula: "Current Assets - Current Liabilities", benchmark: "Positive is essential" }
      ]
    },
    {
      id: "cash-flow",
      name: "Cash Flow Statement",
      subtitle: "Statement of Cash Flows",
      icon: DollarSign,
      purpose: "Shows how cash moves in and out of your business",
      frequency: "Monthly, Quarterly, Annually",
      keyQuestion: "Where is my cash coming from and going to?",
      sections: [
        {
          name: "Operating Activities",
          description: "Cash from day-to-day business operations",
          items: ["Cash received from customers", "Cash paid to suppliers", "Cash paid for salaries", "Cash paid for rent/utilities"],
          example: { label: "Net Cash from Operations", value: "$45,000" }
        },
        {
          name: "Investing Activities",
          description: "Cash used for long-term investments",
          items: ["Purchase of equipment", "Sale of assets", "Investments in securities"],
          example: { label: "Net Cash from Investing", value: "-$15,000" }
        },
        {
          name: "Financing Activities",
          description: "Cash from loans, investments, or owner transactions",
          items: ["Loan proceeds", "Loan repayments", "Owner investments", "Owner draws/dividends"],
          example: { label: "Net Cash from Financing", value: "-$10,000" }
        },
        {
          name: "Net Change in Cash",
          description: "Total change in cash position",
          items: ["Operating + Investing + Financing = Net Change"],
          example: { label: "Net Change in Cash", value: "$20,000" }
        }
      ],
      keyMetrics: [
        { name: "Operating Cash Flow Ratio", formula: "Operating Cash Flow / Current Liabilities", benchmark: "Above 1.0 means you can cover short-term debts" },
        { name: "Free Cash Flow", formula: "Operating Cash Flow - Capital Expenditures", benchmark: "Positive means cash available for growth" },
        { name: "Cash Burn Rate", formula: "Total Cash / Monthly Cash Outflow", benchmark: "6+ months runway is safe" }
      ]
    }
  ];

  const sampleIncomeStatement = [
    { label: "Revenue", value: 150000, type: "income" },
    { label: "Cost of Goods Sold", value: -45000, type: "expense" },
    { label: "Gross Profit", value: 105000, type: "subtotal" },
    { label: "Operating Expenses", value: -65000, type: "expense" },
    { label: "Operating Income", value: 40000, type: "subtotal" },
    { label: "Interest Expense", value: -3000, type: "expense" },
    { label: "Taxes", value: -5000, type: "expense" },
    { label: "Net Income", value: 32000, type: "total" }
  ];

  const formatCurrency = (value: number) => {
    const prefix = value >= 0 ? "" : "-";
    return `${prefix}$${Math.abs(value).toLocaleString()}`;
  };

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
          <span>How to Prepare Financial Statements</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-4 rounded-xl">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">How to Prepare Financial Statements</h1>
              <p className="text-muted-foreground">Understanding P&L, Balance Sheet, and Cash Flow Statements</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">Tutorial</Badge>
            <Badge variant="secondary">GAAP Standards</Badge>
            <Badge variant="secondary">Small Business</Badge>
          </div>
        </motion.div>

        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>The Three Core Financial Statements</CardTitle>
            <CardDescription>
              Every business needs to understand these three statements to make informed decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {statements.map((statement) => (
                <div key={statement.id} className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <statement.icon className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">{statement.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{statement.purpose}</p>
                  <Badge variant="outline" className="text-xs">{statement.frequency}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* The Accounting Equation */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <Calculator className="h-4 w-4" />
          <AlertTitle>The Fundamental Accounting Equation</AlertTitle>
          <AlertDescription>
            <div className="mt-2 p-4 bg-background rounded-lg text-center">
              <span className="text-2xl font-bold text-primary">Assets = Liabilities + Owner's Equity</span>
              <p className="text-sm text-muted-foreground mt-2">
                This equation must always balance. Your Balance Sheet is built on this foundation.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Detailed Statements */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Statement Deep Dives</h2>
          <Tabs defaultValue="income-statement">
            <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
              {statements.map((statement) => (
                <TabsTrigger 
                  key={statement.id} 
                  value={statement.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <statement.icon className="h-4 w-4 mr-2" />
                  {statement.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {statements.map((statement) => (
              <TabsContent key={statement.id} value={statement.id} className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <statement.icon className="h-5 w-5 text-primary" />
                          {statement.name}
                        </CardTitle>
                        <CardDescription>{statement.subtitle}</CardDescription>
                      </div>
                      <Badge variant="secondary">{statement.frequency}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-primary/5 p-4 rounded-lg mb-6">
                      <h4 className="font-medium">Key Question This Statement Answers:</h4>
                      <p className="text-lg text-primary font-semibold">{statement.keyQuestion}</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Components:</h4>
                      <Accordion type="multiple" className="space-y-2">
                        {statement.sections.map((section, idx) => (
                          <AccordionItem key={idx} value={`section-${idx}`} className="border rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center justify-between w-full pr-4">
                                <span className="font-medium">{section.name}</span>
                                <Badge variant="outline">{section.example.value}</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4">
                              <p className="text-muted-foreground mb-3">{section.description}</p>
                              <ul className="grid md:grid-cols-2 gap-2">
                                {section.items.map((item, iIdx) => (
                                  <li key={iIdx} className="flex items-center gap-2 text-sm">
                                    <Check className="h-3 w-3 text-green-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      Key Metrics to Calculate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statement.keyMetrics.map((metric, idx) => (
                        <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{metric.name}</h4>
                              <code className="text-sm text-primary bg-primary/10 px-2 py-1 rounded mt-1 inline-block">
                                {metric.formula}
                              </code>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="font-medium">Benchmark:</span> {metric.benchmark}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Sample Income Statement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sample Income Statement</CardTitle>
            <CardDescription>For the Year Ended December 31, 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sampleIncomeStatement.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between py-2 px-4 rounded ${
                    line.type === 'total' ? 'bg-primary/10 font-bold' :
                    line.type === 'subtotal' ? 'bg-muted/50 font-medium' :
                    ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {line.type === 'income' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                    {line.type === 'expense' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                    {(line.type === 'subtotal' || line.type === 'total') && <Minus className="h-4 w-4 text-primary" />}
                    {line.label}
                  </span>
                  <span className={
                    line.value >= 0 ? 'text-green-600' : 'text-red-600'
                  }>
                    {formatCurrency(line.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Prepare statements consistently (same time each month/quarter)",
                "Use accrual accounting for accurate revenue/expense matching",
                "Compare periods to identify trends (month-over-month, year-over-year)",
                "Keep all statements for at least 7 years for tax purposes",
                "Review with a CPA or bookkeeper quarterly",
                "Use accounting software to automate statement generation"
              ].map((practice, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  {practice}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Ready to Generate Your Financial Statements?</h3>
                <p className="text-muted-foreground">MAJR Books automatically generates P&L, Balance Sheet, and Cash Flow reports.</p>
              </div>
              <Button onClick={() => navigate("/reports")}>
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialStatementsGuide;
