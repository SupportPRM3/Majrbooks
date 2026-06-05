import { ArrowLeft, Play, BarChart3, FileText, PieChart, TrendingUp, Download, Filter, Calendar, CheckCircle, Settings, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const GeneratingReportsGuide = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: "overview",
      icon: BarChart3,
      title: "Understanding MAJR Books Reports",
      duration: "1:30",
      content: [
        "Reports transform your raw financial data into actionable insights",
        "Access all reports from the Reports menu in the sidebar",
        "Reports update in real-time as you enter transactions",
        "Export any report to PDF or Excel for sharing with stakeholders"
      ],
      proTip: "Bookmark your most-used reports for quick access from the dashboard."
    },
    {
      id: "profit-loss",
      icon: TrendingUp,
      title: "Profit & Loss Statement",
      duration: "2:00",
      content: [
        "Shows your revenue, expenses, and net profit over a period",
        "Compare periods side-by-side (this month vs. last month, this year vs. last)",
        "Drill down into any category to see individual transactions",
        "Filter by date range, client, or project for detailed analysis"
      ],
      proTip: "Run a monthly P&L at the start of each month to track trends and catch issues early."
    },
    {
      id: "balance-sheet",
      icon: FileText,
      title: "Balance Sheet",
      duration: "1:45",
      content: [
        "Snapshot of your business assets, liabilities, and equity",
        "Assets = Liabilities + Equity (the fundamental accounting equation)",
        "Track accounts receivable, payable, and cash positions",
        "Compare balance sheets over time to see growth"
      ],
      proTip: "Review your balance sheet quarterly to understand your business's financial health."
    },
    {
      id: "cash-flow",
      icon: DollarSign,
      title: "Cash Flow Statement",
      duration: "1:30",
      content: [
        "Track cash moving in and out of your business",
        "Separate operating, investing, and financing activities",
        "Identify cash flow patterns and potential shortfalls",
        "Project future cash needs based on historical data"
      ],
      proTip: "A profitable business can still fail from poor cash flow—monitor this report closely."
    },
    {
      id: "custom-reports",
      icon: PieChart,
      title: "Custom Reports & Filters",
      duration: "1:45",
      content: [
        "Create custom date ranges for any report",
        "Filter by client, project, category, or tag",
        "Save custom filter combinations as report templates",
        "Schedule recurring reports to run automatically"
      ],
      proTip: "Create a 'Tax Prep' filter template that you can reuse every year at tax time."
    },
    {
      id: "revenue-client",
      icon: BarChart3,
      title: "Revenue by Client Report",
      duration: "1:15",
      content: [
        "See which clients generate the most revenue",
        "Identify your most profitable relationships",
        "Track revenue trends per client over time",
        "Make informed decisions about client acquisition and retention"
      ],
      proTip: "Use this report to identify clients who may need upselling or those at risk of churn."
    },
    {
      id: "exporting",
      icon: Download,
      title: "Exporting & Sharing Reports",
      duration: "1:15",
      content: [
        "Export to PDF for professional presentations",
        "Export to Excel for further analysis and manipulation",
        "Email reports directly to clients or stakeholders",
        "Schedule automatic report delivery on a recurring basis"
      ],
      proTip: "Set up monthly report emails to your accountant before your scheduled meetings."
    },
    {
      id: "best-practices",
      icon: CheckCircle,
      title: "Reporting Best Practices",
      duration: "1:15",
      content: [
        "Run reports on the same day each period for consistency",
        "Compare reports year-over-year to identify seasonal trends",
        "Use reports to set and track financial goals",
        "Review reports with your team or accountant regularly"
      ],
      proTip: "Schedule a monthly 'financial review' meeting with yourself to analyze key reports."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/resources")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Generating Reports</h1>
              <p className="text-muted-foreground">Complete video walkthrough • 12:15 duration</p>
            </div>
          </div>
        </div>

        {/* Video Player Placeholder */}
        <Card className="mb-8 overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_100%)]" />
            <div className="relative text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-primary/30 transition-colors group">
                <Play className="h-8 w-8 text-primary group-hover:scale-110 transition-transform ml-1" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Reports Mastery Tutorial</h3>
              <p className="text-muted-foreground">12:15 • Complete reporting guide</p>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-0 bg-primary rounded-full" />
              </div>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>0:00</span>
                <span>12:15</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Step-by-Step Guide
                </CardTitle>
                <CardDescription>
                  Follow along with the video or read each section at your own pace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {sections.map((section, index) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                            <section.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{index + 1}. {section.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {section.duration}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-11">
                        <ul className="space-y-2 mb-4">
                          {section.content.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                          <p className="text-sm">
                            <span className="font-medium text-primary">Pro Tip: </span>
                            <span className="text-muted-foreground">{section.proTip}</span>
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: TrendingUp, text: "Profit & Loss Statement" },
                  { icon: FileText, text: "Balance Sheet" },
                  { icon: DollarSign, text: "Cash Flow Statement" },
                  { icon: BarChart3, text: "Revenue by Client" },
                  { icon: PieChart, text: "Trial Balance" },
                  { icon: Calendar, text: "Sales Tax Summary" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/reports")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Go to Reports
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/profit-and-loss")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Profit & Loss
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/balance-sheet")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Balance Sheet
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/cash-flow")}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Cash Flow
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Have questions about reports? Our support team is here to help.
                </p>
                <Button className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratingReportsGuide;
