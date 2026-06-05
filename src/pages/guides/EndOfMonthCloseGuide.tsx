import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  ClipboardList, 
  Landmark, 
  Calculator, 
  BarChart3, 
  FileText,
  Clock,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const EndOfMonthCloseGuide = () => {
  const sections = [
    {
      id: "review",
      icon: ClipboardList,
      title: "Review Income & Expenses",
      content: [
        "Confirm all income and expense entries are added.",
        "Ensure correct categorization.",
        "Verify vendor and client details.",
        "Fix incorrect or missing amounts.",
        "Attach receipts if not yet uploaded.",
        "Prepare totals for reporting."
      ]
    },
    {
      id: "reconcile",
      icon: Landmark,
      title: "Reconcile Bank & Credit Accounts",
      content: [
        "Reconcile all connected accounts.",
        "Match book entries to bank transactions.",
        "Fix discrepancies.",
        "Add adjustments (bank fees, interest).",
        "Ensure the accounts show $0 differences.",
        "Lock the reconciliation period."
      ]
    },
    {
      id: "adjustments",
      icon: Calculator,
      title: "Record Accruals or Adjustments",
      content: [
        "Add prepaid expenses or deferred income.",
        "Record unpaid bills or uncollected revenue.",
        "Adjust inventory if applicable.",
        "Add depreciation entries.",
        "Review journal entries for accuracy.",
        "Save adjustments before closing."
      ]
    },
    {
      id: "dashboard",
      icon: BarChart3,
      title: "Update Financial Dashboards",
      content: [
        "Refresh the dashboard to reflect new entries.",
        "Check cash flow, profit, expenses, and trends.",
        "Compare this month to the previous month.",
        "Check alerts (overdue invoices, pending uploads).",
        "Share dashboard with stakeholders if needed.",
        "Export dashboard visuals."
      ]
    },
    {
      id: "reports",
      icon: FileText,
      title: "Save & Export Monthly Reports",
      content: [
        "Go to Reports → Monthly Summary.",
        "Export Profit & Loss, Balance Sheet, and Cash Flow.",
        "Download PDF or Excel.",
        "Save copies for record-keeping.",
        "Email reports to your accountant or team.",
        "Archive reports for future audits."
      ]
    }
  ];

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
            Guides
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">End-of-Month Close Checklist</span>
        </nav>

        {/* Back Button */}
        <Link to="/resources">
          <Button variant="ghost" className="mb-6 -ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Button>
        </Link>

        {/* Header Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold">
                  End-of-Month Close Checklist
                </CardTitle>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="gap-1.5">
                <BookOpen className="h-3 w-3" />
                Accounting
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Clock className="h-3 w-3" />
                6 minutes read
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Overview Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Follow this simplified monthly workflow to keep your books clean and accurate. 
              This checklist helps you stay consistent, organized, and ready for tax season.
            </p>
          </CardContent>
        </Card>

        {/* Accordion Sections */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monthly Close Checklist</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {sections.map((section, index) => (
                <AccordionItem 
                  key={section.id} 
                  value={section.id}
                  className="border rounded-lg px-4 data-[state=open]:bg-muted/30 transition-colors"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs text-muted-foreground font-medium">
                          Step {index + 1}
                        </span>
                        <h3 className="font-semibold text-sm md:text-base">
                          {section.title}
                        </h3>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="ml-12 space-y-3">
                      <ol className="space-y-3">
                        {section.content.map((item, idx) => (
                          <li 
                            key={idx} 
                            className="flex items-start gap-3 text-muted-foreground"
                          >
                            <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Perfect For Section */}
        <Card className="mb-8 border-green-500/20 bg-gradient-to-br from-green-500/5 to-background">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Perfect For
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Businesses that want a clean, consistent monthly financial process.
            </p>
          </CardContent>
        </Card>

        {/* Need Help Section */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Need help?</h3>
                <p className="text-sm text-muted-foreground">
                  Can't find what you're looking for? Our support team is here to assist you.
                </p>
              </div>
              <Button variant="outline" className="gap-2 shrink-0">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EndOfMonthCloseGuide;
