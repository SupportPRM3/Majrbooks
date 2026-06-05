import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Check, AlertTriangle, Info, Clock, FileText, DollarSign, Users, Building2, Calculator, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

const YearEndTaxPrepGuide = () => {
  const navigate = useNavigate();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const importantDeadlines2024 = [
    { date: "January 15, 2025", description: "Q4 2024 Estimated Tax Payment Due", type: "payment" },
    { date: "January 31, 2025", description: "W-2s and 1099-NEC due to recipients", type: "form" },
    { date: "January 31, 2025", description: "Form 940 (FUTA) Annual Filing", type: "form" },
    { date: "February 28, 2025", description: "Paper 1099s due to IRS", type: "form" },
    { date: "March 15, 2025", description: "S-Corp and Partnership Returns (Form 1120-S, 1065)", type: "return" },
    { date: "March 31, 2025", description: "Electronic 1099s due to IRS", type: "form" },
    { date: "April 15, 2025", description: "Individual and C-Corp Returns (Form 1040, 1120)", type: "return" },
    { date: "April 15, 2025", description: "Q1 2025 Estimated Tax Payment Due", type: "payment" }
  ];

  const yearEndChecklist = [
    {
      id: "section-1",
      title: "Income Verification",
      icon: DollarSign,
      tasks: [
        { id: "income-1", text: "Reconcile all bank accounts through December 31" },
        { id: "income-2", text: "Review all invoices and ensure payments are recorded" },
        { id: "income-3", text: "Collect all 1099s you will receive from clients" },
        { id: "income-4", text: "Document any cash income received" },
        { id: "income-5", text: "Record any bartered income at fair market value" },
        { id: "income-6", text: "Verify credit card payments match deposits" }
      ]
    },
    {
      id: "section-2",
      title: "Expense Review",
      icon: FileText,
      tasks: [
        { id: "expense-1", text: "Categorize all uncategorized transactions" },
        { id: "expense-2", text: "Attach receipts to all expenses over $75" },
        { id: "expense-3", text: "Review mileage log and calculate total business miles" },
        { id: "expense-4", text: "Calculate home office deduction (square footage method or simplified)" },
        { id: "expense-5", text: "List all equipment purchases over $2,500 for depreciation" },
        { id: "expense-6", text: "Verify all recurring expenses are recorded" }
      ]
    },
    {
      id: "section-3",
      title: "Payroll & Contractors",
      icon: Users,
      tasks: [
        { id: "payroll-1", text: "Verify all payroll is processed for the year" },
        { id: "payroll-2", text: "Confirm all payroll taxes are deposited" },
        { id: "payroll-3", text: "Prepare W-2s for employees" },
        { id: "payroll-4", text: "Identify all contractors paid $600 or more" },
        { id: "payroll-5", text: "Collect W-9s from all contractors" },
        { id: "payroll-6", text: "Prepare 1099-NEC forms for contractors" }
      ]
    },
    {
      id: "section-4",
      title: "Asset & Inventory",
      icon: Building2,
      tasks: [
        { id: "asset-1", text: "Complete physical inventory count" },
        { id: "asset-2", text: "Document any disposed or sold assets" },
        { id: "asset-3", text: "Calculate depreciation for all assets" },
        { id: "asset-4", text: "Review vehicle logs for business vs. personal use" },
        { id: "asset-5", text: "Update fixed asset register" }
      ]
    },
    {
      id: "section-5",
      title: "Retirement & Benefits",
      icon: Calculator,
      tasks: [
        { id: "retire-1", text: "Maximize retirement contributions before deadline" },
        { id: "retire-2", text: "Review health insurance premium payments" },
        { id: "retire-3", text: "Document HSA/FSA contributions" },
        { id: "retire-4", text: "Calculate self-employment health insurance deduction" }
      ]
    },
    {
      id: "section-6",
      title: "Final Preparations",
      icon: CheckCircle,
      tasks: [
        { id: "final-1", text: "Run Profit & Loss statement for the year" },
        { id: "final-2", text: "Run Balance Sheet as of December 31" },
        { id: "final-3", text: "Calculate estimated tax owed" },
        { id: "final-4", text: "Gather prior year tax returns for comparison" },
        { id: "final-5", text: "Organize all documents for your accountant" },
        { id: "final-6", text: "Schedule appointment with tax preparer" }
      ]
    }
  ];

  const documentsNeeded = [
    { category: "Income Documents", items: ["All 1099 forms received", "Bank statements showing deposits", "Invoice records", "PayPal/Stripe/Square statements"] },
    { category: "Expense Documents", items: ["Receipts for purchases over $75", "Credit card statements", "Mileage log", "Home office measurements and expenses"] },
    { category: "Payroll Documents", items: ["Payroll reports", "941 quarterly filings", "State unemployment filings", "W-9s from contractors"] },
    { category: "Asset Documents", items: ["Purchase records for equipment", "Vehicle title and usage log", "Inventory count sheets", "Depreciation schedules"] },
    { category: "Other Documents", items: ["Prior year tax returns", "Business licenses", "Loan statements", "Insurance policies"] }
  ];

  const allTasks = yearEndChecklist.flatMap(section => section.tasks);
  const completionPercentage = (completedTasks.length / allTasks.length) * 100;

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
          <span>Year-End Tax Prep Guide</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-4 rounded-xl">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Year-End Tax Prep Guide</h1>
              <p className="text-muted-foreground">Complete Checklist for Tax Season Preparation</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">Guide</Badge>
            <Badge variant="secondary">2024 Tax Year</Badge>
            <Badge variant="secondary">IRS Deadlines</Badge>
          </div>
        </motion.div>

        {/* Progress Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Your Progress</h3>
                <p className="text-muted-foreground text-sm">{completedTasks.length} of {allTasks.length} tasks completed</p>
              </div>
              <span className="text-3xl font-bold text-primary">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Important Deadlines */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Important Tax Deadlines
            </CardTitle>
            <CardDescription>Key dates for the 2024 tax year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {importantDeadlines2024.map((deadline, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    deadline.type === 'return' ? 'bg-primary/10' :
                    deadline.type === 'payment' ? 'bg-yellow-500/10' :
                    'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      deadline.type === 'return' ? 'bg-primary/20' :
                      deadline.type === 'payment' ? 'bg-yellow-500/20' :
                      'bg-muted'
                    }`}>
                      <Calendar className={`h-4 w-4 ${
                        deadline.type === 'return' ? 'text-primary' :
                        deadline.type === 'payment' ? 'text-yellow-600' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <span className="font-medium">{deadline.date}</span>
                      <p className="text-sm text-muted-foreground">{deadline.description}</p>
                    </div>
                  </div>
                  <Badge variant={
                    deadline.type === 'return' ? 'default' :
                    deadline.type === 'payment' ? 'secondary' :
                    'outline'
                  }>
                    {deadline.type === 'return' ? 'Tax Return' :
                     deadline.type === 'payment' ? 'Payment' :
                     'Form Due'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Year-End Checklist */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Year-End Checklist</h2>
          <Accordion type="multiple" defaultValue={["section-1"]} className="space-y-4">
            {yearEndChecklist.map((section) => {
              const sectionCompleted = section.tasks.filter(t => completedTasks.includes(t.id)).length;
              return (
                <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sectionCompleted} of {section.tasks.length} completed
                        </p>
                      </div>
                      <Badge variant={sectionCompleted === section.tasks.length ? "default" : "secondary"}>
                        {sectionCompleted === section.tasks.length ? "Complete" : `${sectionCompleted}/${section.tasks.length}`}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="pl-14 space-y-3">
                      {section.tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleTask(task.id)}
                        >
                          <Checkbox 
                            checked={completedTasks.includes(task.id)}
                            onCheckedChange={() => toggleTask(task.id)}
                          />
                          <span className={completedTasks.includes(task.id) ? "line-through text-muted-foreground" : ""}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Documents Needed */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documents to Gather
            </CardTitle>
            <CardDescription>Collect these documents before meeting with your tax preparer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {documentsNeeded.map((category, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="font-semibold text-sm">{category.category}</h4>
                  <ul className="space-y-1">
                    {category.items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-3 w-3 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tax Saving Tips */}
        <Alert className="mb-8 border-green-500/20 bg-green-500/5">
          <Info className="h-4 w-4 text-green-500" />
          <AlertTitle>Last-Minute Tax Saving Tips</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Make retirement contributions before the deadline (SEP-IRA until April 15)</li>
              <li>• Prepay Q1 expenses before year-end if it benefits you</li>
              <li>• Defer income to next year if you expect lower income</li>
              <li>• Purchase needed equipment before December 31 for Section 179</li>
              <li>• Make charitable contributions (with documentation)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Footer CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Need to Generate Tax Reports?</h3>
                <p className="text-muted-foreground">Run your P&L and Balance Sheet directly from MAJR Books.</p>
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

export default YearEndTaxPrepGuide;
