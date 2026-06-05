import { Link } from "react-router-dom";
import { useState } from "react";
import { 
  ArrowLeft, 
  Download, 
  ChevronRight,
  CheckCircle,
  Circle,
  Calendar,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

const BookkeepingChecklists = () => {
  const [weeklyChecklist, setWeeklyChecklist] = useState<ChecklistSection[]>([
    {
      title: "Transaction Management",
      items: [
        { id: "w1", task: "Review and categorize new bank transactions", completed: false },
        { id: "w2", task: "Match receipts to expenses", completed: false },
        { id: "w3", task: "Reconcile petty cash", completed: false },
      ]
    },
    {
      title: "Invoicing",
      items: [
        { id: "w4", task: "Send outstanding invoices", completed: false },
        { id: "w5", task: "Follow up on overdue payments", completed: false },
        { id: "w6", task: "Record received payments", completed: false },
      ]
    },
    {
      title: "Organization",
      items: [
        { id: "w7", task: "File and organize receipts", completed: false },
        { id: "w8", task: "Update cash flow forecast", completed: false },
      ]
    }
  ]);

  const [monthlyChecklist, setMonthlyChecklist] = useState<ChecklistSection[]>([
    {
      title: "Reconciliation",
      items: [
        { id: "m1", task: "Reconcile all bank accounts", completed: false },
        { id: "m2", task: "Reconcile credit card statements", completed: false },
        { id: "m3", task: "Review and reconcile accounts receivable", completed: false },
        { id: "m4", task: "Review and reconcile accounts payable", completed: false },
      ]
    },
    {
      title: "Financial Review",
      items: [
        { id: "m5", task: "Generate and review Profit & Loss statement", completed: false },
        { id: "m6", task: "Generate and review Balance Sheet", completed: false },
        { id: "m7", task: "Review budget vs. actual spending", completed: false },
      ]
    },
    {
      title: "Compliance",
      items: [
        { id: "m8", task: "File sales tax returns (if applicable)", completed: false },
        { id: "m9", task: "Process payroll and file payroll taxes", completed: false },
        { id: "m10", task: "Review contractor payments", completed: false },
      ]
    },
    {
      title: "Month-End Close",
      items: [
        { id: "m11", task: "Record accruals and adjustments", completed: false },
        { id: "m12", task: "Close the books for the month", completed: false },
        { id: "m13", task: "Backup all financial data", completed: false },
      ]
    }
  ]);

  const [quarterlyChecklist, setQuarterlyChecklist] = useState<ChecklistSection[]>([
    {
      title: "Tax Preparation",
      items: [
        { id: "q1", task: "Calculate and pay estimated quarterly taxes", completed: false },
        { id: "q2", task: "Review year-to-date tax liability", completed: false },
        { id: "q3", task: "Update tax projections", completed: false },
      ]
    },
    {
      title: "Financial Analysis",
      items: [
        { id: "q4", task: "Generate quarterly financial statements", completed: false },
        { id: "q5", task: "Analyze trends and performance metrics", completed: false },
        { id: "q6", task: "Compare to previous quarters", completed: false },
        { id: "q7", task: "Review and update annual budget", completed: false },
      ]
    },
    {
      title: "Business Review",
      items: [
        { id: "q8", task: "Review vendor contracts and pricing", completed: false },
        { id: "q9", task: "Assess subscription and recurring expenses", completed: false },
        { id: "q10", task: "Evaluate cash flow and reserves", completed: false },
      ]
    },
    {
      title: "Compliance & Planning",
      items: [
        { id: "q11", task: "File quarterly payroll returns (Form 941)", completed: false },
        { id: "q12", task: "Review insurance coverage", completed: false },
        { id: "q13", task: "Plan for upcoming quarter expenses", completed: false },
      ]
    }
  ]);

  const toggleItem = (
    checklist: ChecklistSection[], 
    setChecklist: React.Dispatch<React.SetStateAction<ChecklistSection[]>>, 
    itemId: string
  ) => {
    setChecklist(checklist.map(section => ({
      ...section,
      items: section.items.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    })));
  };

  const getProgress = (checklist: ChecklistSection[]) => {
    const total = checklist.reduce((sum, section) => sum + section.items.length, 0);
    const completed = checklist.reduce((sum, section) => 
      sum + section.items.filter(item => item.completed).length, 0
    );
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const handleDownload = () => {
    toast.success("Checklists downloaded successfully!");
  };

  const renderChecklist = (
    checklist: ChecklistSection[], 
    setChecklist: React.Dispatch<React.SetStateAction<ChecklistSection[]>>
  ) => {
    const progress = getProgress(checklist);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="font-semibold">{progress.completed} of {progress.total} tasks completed</p>
          </div>
          <div className="w-32">
            <Progress value={progress.percentage} className="h-2" />
          </div>
        </div>

        {checklist.map((section, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {section.items.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => toggleItem(checklist, setChecklist, item.id)}
                >
                  {item.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                    {item.task}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

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
          <span className="text-foreground font-medium">Bookkeeping Checklists</span>
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
            <h1 className="text-3xl font-bold mb-2">Bookkeeping Checklists</h1>
            <p className="text-muted-foreground">
              Stay on top of your bookkeeping with time-based task checklists
            </p>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="weekly" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly" className="gap-2">
              <Clock className="h-4 w-4" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2">
              <Calendar className="h-4 w-4" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="gap-2">
              <Calendar className="h-4 w-4" />
              Quarterly
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <Card className="mb-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Weekly Checklist
                </CardTitle>
                <CardDescription>
                  Complete these tasks every week to keep your books current
                </CardDescription>
              </CardHeader>
            </Card>
            {renderChecklist(weeklyChecklist, setWeeklyChecklist)}
          </TabsContent>

          <TabsContent value="monthly">
            <Card className="mb-6 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Monthly Checklist
                </CardTitle>
                <CardDescription>
                  End-of-month tasks to ensure accurate financial records
                </CardDescription>
              </CardHeader>
            </Card>
            {renderChecklist(monthlyChecklist, setMonthlyChecklist)}
          </TabsContent>

          <TabsContent value="quarterly">
            <Card className="mb-6 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  Quarterly Checklist
                </CardTitle>
                <CardDescription>
                  Quarterly review and tax preparation tasks
                </CardDescription>
              </CardHeader>
            </Card>
            {renderChecklist(quarterlyChecklist, setQuarterlyChecklist)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BookkeepingChecklists;
