import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Landmark, 
  FolderOpen, 
  LayoutDashboard, 
  Shield, 
  CheckSquare,
  Clock,
  BookOpen,
  HelpCircle,
  ChevronRight
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

const GettingStartedGuide = () => {
  const sections = [
    {
      id: "account",
      icon: User,
      title: "How to Create & Verify Your Account",
      content: [
        "Go to the signup screen and enter your full name, email, and password.",
        "Check your email inbox and click Verify Account.",
        "Enable two-factor authentication for extra security.",
        "Complete your personal profile details.",
        "Save and continue to the next setup step."
      ]
    },
    {
      id: "business",
      icon: Building2,
      title: "Set Up Your Business Information",
      content: [
        "Navigate to Settings → Business Profile.",
        "Enter business name, address, phone number, and upload your logo.",
        "Choose business type (Sole Proprietor, LLC, Corporation, etc.).",
        "Add your EIN or Tax Identification Number.",
        "Select your fiscal year start date.",
        "Save your changes."
      ]
    },
    {
      id: "bank",
      icon: Landmark,
      title: "Connect Your Bank Accounts Securely",
      content: [
        "Go to Banking → Add Bank.",
        "Search and choose your bank provider.",
        "Log in using your online banking credentials.",
        "Select which accounts to sync (Checking, Savings, Credit Cards).",
        "Wait for the sync and import of transactions.",
        "If your bank is not listed, allow users to upload CSV statements manually."
      ]
    },
    {
      id: "chart",
      icon: FolderOpen,
      title: "Customize Your Chart of Accounts",
      content: [
        "Go to Accounting → Chart of Accounts.",
        "Review default income and expense categories.",
        "Add custom categories as needed.",
        "Rename or archive categories to match the business workflow.",
        "Tag categories as 'tax-relevant' for reporting.",
        "Save all changes."
      ]
    },
    {
      id: "dashboard",
      icon: LayoutDashboard,
      title: "Know Your Dashboard: Quick Tour",
      content: [
        "View an overview of total income, expenses, cash flow, and alerts.",
        "Change filters (Daily, Weekly, Monthly, Yearly) to customize your view.",
        "Click widgets to access full reports.",
        "Monitor alert tools for overdue invoices or unsynced transactions.",
        "Use drag-and-drop to customize your dashboard layout."
      ]
    },
    {
      id: "permissions",
      icon: Shield,
      title: "Set Up User Permissions",
      content: [
        "Go to Settings → Users & Permissions.",
        "Add users by entering their name and email.",
        "Assign a role: Admin, Bookkeeper, Staff, Viewer.",
        "Customize restrictions (Invoices only, Reports only, No Banking access, etc.).",
        "Send invitation and monitor pending user status."
      ]
    },
    {
      id: "practices",
      icon: CheckSquare,
      title: "Best Practices to Stay Organized From Day 1",
      content: [
        "Reconcile bank transactions weekly.",
        "Upload receipts daily using mobile capture.",
        "Use rules to auto-categorize recurring expenses.",
        "Send invoices immediately after completing work.",
        "Review dashboard summaries every Monday.",
        "Use the End-of-Month Close Checklist monthly."
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
            Guides & Tutorials
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Getting Started Guide</span>
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
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold">
                  Getting Started Guide
                </CardTitle>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="gap-1.5">
                <BookOpen className="h-3 w-3" />
                Beginner
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <Clock className="h-3 w-3" />
                15 minutes read
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
              Kickstart your MAJR Books experience with this step-by-step onboarding guide. 
              This tutorial walks you through setting up your profile, connecting your bank, 
              customizing your accounts, and getting familiar with your dashboard—so you can 
              manage your books with confidence from Day 1.
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

export default GettingStartedGuide;
