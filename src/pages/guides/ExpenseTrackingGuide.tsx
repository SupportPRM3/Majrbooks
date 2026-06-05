import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Landmark, 
  FolderOpen, 
  Wand2, 
  Camera, 
  Tag, 
  FileText,
  Clock,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Receipt,
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

const ExpenseTrackingGuide = () => {
  const sections = [
    {
      id: "manual",
      icon: Plus,
      title: "Adding Manual Expenses",
      content: [
        "Go to Expenses → Add Expense.",
        "Enter the expense date, amount, and vendor.",
        "Choose a category (Meals, Supplies, Utilities, etc.).",
        "Add notes or tags if needed.",
        "Attach a receipt photo or file.",
        "Save and confirm."
      ]
    },
    {
      id: "bank-import",
      icon: Landmark,
      title: "Importing Transactions From Your Bank",
      content: [
        "Ensure your bank account is connected.",
        "Go to Banking → Transactions.",
        "Review imported expenses and match them to categories.",
        "Click Add to Books to save each one.",
        "Delete duplicates if they appear.",
        "Filter transactions by date, amount, or category."
      ]
    },
    {
      id: "categories",
      icon: FolderOpen,
      title: "Categorizing Expenses Properly",
      content: [
        "Review uncategorized expenses.",
        "Assign the correct category based on your chart of accounts.",
        "Add subcategories for more detail.",
        "Mark business vs. personal (if enabled).",
        "Apply tags like 'Client Work,' 'Project A,' or 'Internal.'",
        "Save all changes."
      ]
    },
    {
      id: "rules",
      icon: Wand2,
      title: "Using Rules to Automate Classifications",
      content: [
        "Go to Expenses → Rules → New Rule.",
        "Set conditions (Vendor Name, Description, Amount).",
        "Choose an auto-category for the rule.",
        "Apply tags automatically.",
        "Choose whether the rule applies to past transactions.",
        "Save the rule and test it on new imports."
      ]
    },
    {
      id: "receipts",
      icon: Camera,
      title: "Attaching & Scanning Receipts",
      content: [
        "Upload a receipt using the Add Receipt button.",
        "Drag-and-drop or upload manually.",
        "The system scans the receipt and extracts date, vendor, and amount.",
        "Review and confirm extracted data.",
        "Attach receipts to an existing expense or create a new one.",
        "Store all receipts for tax or audit purposes."
      ]
    },
    {
      id: "tagging",
      icon: Tag,
      title: "Tagging Expenses by Project or Client",
      content: [
        "Choose an expense from the list.",
        "Add project or client tags.",
        "Use multiple tags when applicable.",
        "Filter reports by tag for deeper insights.",
        "Create tag groups for organization.",
        "Remove tags anytime."
      ]
    },
    {
      id: "reports",
      icon: FileText,
      title: "Generating Tax-Ready Expense Reports",
      content: [
        "Go to Reports → Expenses.",
        "Filter by date range, category, or tag.",
        "Export as PDF or CSV.",
        "Generate summary or detailed formats.",
        "Send to your accountant with one click.",
        "Use this during tax season to claim deductions properly."
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
          <span className="text-foreground font-medium">Expense Tracking 101</span>
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
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold">
                  Expense Tracking 101
                </CardTitle>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="gap-1.5">
                <BookOpen className="h-3 w-3" />
                Expenses
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Clock className="h-3 w-3" />
                12 minutes read
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
              Learn how to properly record, categorize, and organize your business expenses. 
              This guide shows you how to upload receipts, automate categorizations, sync 
              transactions, and generate tax-ready reports.
            </p>
          </CardContent>
        </Card>

        {/* Accordion Sections */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Step-by-Step Instructions</CardTitle>
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
              Users who want clean, organized, and audit-ready expense records.
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

export default ExpenseTrackingGuide;
