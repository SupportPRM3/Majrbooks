import { ArrowLeft, Play, Clock, RefreshCw, Mail, Calendar, Settings, CheckCircle, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const RecurringInvoicesGuide = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: "overview",
      icon: RefreshCw,
      title: "Understanding Recurring Invoices",
      duration: "1:15",
      content: [
        "Recurring invoices automatically generate and send invoices on a schedule you define",
        "Perfect for retainer clients, subscription services, or regular monthly billing",
        "Saves hours of manual invoice creation each month",
        "Reduces billing errors and ensures consistent cash flow"
      ],
      proTip: "Set up recurring invoices for any client you bill on a regular schedule - even if amounts vary, you can edit before sending."
    },
    {
      id: "setup",
      icon: Settings,
      title: "Setting Up Your First Recurring Invoice",
      duration: "1:30",
      content: [
        "Navigate to Invoices → Recurring Invoices tab",
        "Click 'Create Recurring Invoice' button",
        "Select the client from your client list",
        "Add line items with descriptions, rates, and quantities",
        "Choose your billing frequency (weekly, monthly, quarterly, annually)"
      ],
      proTip: "Use descriptive line item names that clearly explain what you're billing for - this reduces client questions."
    },
    {
      id: "frequency",
      icon: Calendar,
      title: "Choosing the Right Frequency",
      duration: "1:00",
      content: [
        "Weekly: Best for ongoing hourly work or weekly retainers",
        "Monthly: Most common for subscription services and retainers",
        "Quarterly: Ideal for seasonal services or quarterly reviews",
        "Annually: Perfect for yearly subscriptions or maintenance contracts"
      ],
      proTip: "Match your invoice frequency to your client's payment cycle for faster payments."
    },
    {
      id: "auto-send",
      icon: Mail,
      title: "Enabling Auto-Send",
      duration: "1:00",
      content: [
        "Toggle 'Auto-send' to automatically email invoices when generated",
        "Invoices are sent directly to the client's email on file",
        "Review your email template in Settings for professional branding",
        "Clients receive the invoice with a payment link included"
      ],
      proTip: "Enable auto-send for trusted clients with consistent billing. Disable for clients who need custom adjustments each cycle."
    },
    {
      id: "templates",
      icon: FileText,
      title: "Using Invoice Templates",
      duration: "1:15",
      content: [
        "Apply your branded invoice template to recurring invoices",
        "Templates include your logo, colors, and business information",
        "Customize payment terms and notes for each recurring series",
        "Add standard terms and conditions that appear on every invoice"
      ],
      proTip: "Create a professional template once, and it applies to all your recurring invoices automatically."
    },
    {
      id: "management",
      icon: Clock,
      title: "Managing Active Recurring Invoices",
      duration: "1:00",
      content: [
        "View all recurring invoices in the dashboard widget",
        "See next run date, frequency, and amount at a glance",
        "Pause recurring invoices without deleting them",
        "Edit amounts or line items anytime - changes apply to future invoices"
      ],
      proTip: "Use filters to quickly find recurring invoices by client, frequency, or amount range."
    },
    {
      id: "automation",
      icon: Zap,
      title: "Advanced Automation Features",
      duration: "1:00",
      content: [
        "Combine with workflow automation for payment reminders",
        "Set up automatic thank-you emails when payments are received",
        "Create overdue payment follow-up workflows",
        "Track which recurring invoices generate the most revenue"
      ],
      proTip: "Link recurring invoices with the Payment Follow-up workflow to automatically chase overdue payments."
    },
    {
      id: "best-practices",
      icon: CheckCircle,
      title: "Best Practices & Tips",
      duration: "0:45",
      content: [
        "Review recurring invoices monthly to ensure accuracy",
        "Set end dates for project-based recurring billing",
        "Use invoice number prefixes to identify recurring vs. one-time invoices",
        "Monitor the Upcoming Recurring Invoices widget on your dashboard"
      ],
      proTip: "Schedule a monthly 5-minute review of your recurring invoices to catch any needed updates before they go out."
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
              <RefreshCw className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Automating Recurring Invoices</h1>
              <p className="text-muted-foreground">Complete video walkthrough • 8:45 duration</p>
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
              <h3 className="text-xl font-semibold text-foreground mb-2">Recurring Invoices Tutorial</h3>
              <p className="text-muted-foreground">8:45 • Complete automation guide</p>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-0 bg-primary rounded-full" />
              </div>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>0:00</span>
                <span>8:45</span>
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
                <CardTitle className="text-lg">Quick Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Clock, text: "Save 2+ hours per month on invoicing" },
                  { icon: RefreshCw, text: "Never miss a billing cycle" },
                  { icon: Mail, text: "Automatic client notifications" },
                  { icon: Zap, text: "Integrate with payment workflows" }
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
                <CardTitle className="text-lg">Related Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/invoices")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Go to Invoices
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/workflow-automation")}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Workflow Automation
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/invoice-templates")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Invoice Templates
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Have questions about recurring invoices? Our support team is here to help.
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

export default RecurringInvoicesGuide;
