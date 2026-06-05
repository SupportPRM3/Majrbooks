import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, Check, AlertTriangle, Info, Building2, Car, Utensils, Briefcase, Laptop, Phone, Plane, Home, Heart, BookOpen, Wrench, Users, DollarSign, Shield, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const CommonExpenseCategories = () => {
  const navigate = useNavigate();

  const expenseCategories = [
    {
      id: "office",
      title: "Office Expenses",
      icon: Building2,
      irsReference: "IRS Publication 535",
      description: "Day-to-day costs of running your office",
      examples: [
        "Office supplies (paper, pens, folders)",
        "Postage and shipping",
        "Cleaning supplies",
        "Coffee, water, and kitchen supplies for office",
        "Small equipment under $2,500",
        "Software subscriptions (monthly/annual)",
        "Website hosting and domain fees"
      ],
      tips: "Keep receipts for all purchases. Items over $2,500 may need to be depreciated.",
      deductible: "100%"
    },
    {
      id: "travel",
      title: "Travel Expenses",
      icon: Plane,
      irsReference: "IRS Publication 463",
      description: "Business travel away from your tax home",
      examples: [
        "Airfare and train tickets",
        "Hotel and lodging",
        "Rental cars",
        "Taxi, Uber, Lyft for business",
        "Baggage fees",
        "Tips for service workers",
        "Dry cleaning while traveling"
      ],
      tips: "Travel must be primarily for business. Keep detailed records of business purpose.",
      deductible: "100%"
    },
    {
      id: "vehicle",
      title: "Vehicle & Mileage",
      icon: Car,
      irsReference: "IRS Publication 463",
      description: "Business use of personal or company vehicles",
      examples: [
        "Standard mileage rate (67¢/mile for 2024)",
        "Gas and fuel (if using actual expenses)",
        "Oil changes and maintenance",
        "Insurance (business portion)",
        "Lease payments (business portion)",
        "Parking fees for business",
        "Tolls for business trips"
      ],
      tips: "Choose between standard mileage rate OR actual expenses. Keep a mileage log with date, destination, purpose, and miles.",
      deductible: "Business % only"
    },
    {
      id: "meals",
      title: "Meals & Entertainment",
      icon: Utensils,
      irsReference: "IRS Publication 463",
      description: "Business meals with clients or while traveling",
      examples: [
        "Client meals (business discussion required)",
        "Meals while traveling for business",
        "Team meals during late work hours",
        "Food for company meetings",
        "Snacks for client meetings"
      ],
      tips: "Document who attended, business purpose, and topics discussed. Entertainment is generally NOT deductible since 2018.",
      deductible: "50%"
    },
    {
      id: "professional",
      title: "Professional Services",
      icon: Briefcase,
      irsReference: "IRS Publication 535",
      description: "Fees paid to professionals for business services",
      examples: [
        "Accounting and bookkeeping fees",
        "Legal fees (business-related)",
        "Consulting fees",
        "Tax preparation fees",
        "Business coaching",
        "Marketing and advertising agencies",
        "Freelance contractors"
      ],
      tips: "Issue 1099-NEC forms to contractors paid $600+ in a year.",
      deductible: "100%"
    },
    {
      id: "technology",
      title: "Technology & Equipment",
      icon: Laptop,
      irsReference: "IRS Section 179",
      description: "Computers, equipment, and technology costs",
      examples: [
        "Computers and laptops",
        "Printers and scanners",
        "Monitors and accessories",
        "Software licenses",
        "Cloud storage subscriptions",
        "IT support services",
        "Website development"
      ],
      tips: "Equipment over $2,500 may qualify for Section 179 deduction or bonus depreciation.",
      deductible: "100% or Depreciated"
    },
    {
      id: "communication",
      title: "Communication",
      icon: Phone,
      irsReference: "IRS Publication 535",
      description: "Phone, internet, and communication costs",
      examples: [
        "Business phone line",
        "Cell phone (business portion)",
        "Internet service (business portion)",
        "VoIP services",
        "Video conferencing subscriptions",
        "Fax services"
      ],
      tips: "If using personal phone/internet for business, only deduct the business-use percentage.",
      deductible: "Business % only"
    },
    {
      id: "insurance",
      title: "Business Insurance",
      icon: Shield,
      irsReference: "IRS Publication 535",
      description: "Insurance premiums for business protection",
      examples: [
        "General liability insurance",
        "Professional liability (E&O)",
        "Workers' compensation",
        "Business property insurance",
        "Cyber liability insurance",
        "Business interruption insurance",
        "Key person life insurance"
      ],
      tips: "Health insurance for self-employed may be deductible on Form 1040, not Schedule C.",
      deductible: "100%"
    },
    {
      id: "rent",
      title: "Rent & Lease Payments",
      icon: Home,
      irsReference: "IRS Publication 535",
      description: "Payments for rented business space and equipment",
      examples: [
        "Office rent",
        "Warehouse or storage rent",
        "Equipment lease payments",
        "Co-working space membership",
        "Parking space rental"
      ],
      tips: "Home office deduction is separate—use Form 8829 or simplified method.",
      deductible: "100%"
    },
    {
      id: "advertising",
      title: "Advertising & Marketing",
      icon: Users,
      irsReference: "IRS Publication 535",
      description: "Costs to promote your business",
      examples: [
        "Online advertising (Google, Facebook, etc.)",
        "Print advertising",
        "Business cards and brochures",
        "Trade show booths and materials",
        "Promotional items with logo",
        "Social media marketing",
        "Email marketing platforms"
      ],
      tips: "Sponsorships may be deductible if there's a clear business benefit.",
      deductible: "100%"
    },
    {
      id: "education",
      title: "Education & Training",
      icon: BookOpen,
      irsReference: "IRS Publication 970",
      description: "Costs to maintain or improve business skills",
      examples: [
        "Industry conferences",
        "Professional development courses",
        "Certifications and licenses",
        "Books and publications",
        "Online training subscriptions",
        "Professional association dues"
      ],
      tips: "Education must maintain or improve skills for current business—not qualify you for a new career.",
      deductible: "100%"
    },
    {
      id: "repairs",
      title: "Repairs & Maintenance",
      icon: Wrench,
      irsReference: "IRS Publication 535",
      description: "Costs to maintain business property",
      examples: [
        "Office repairs",
        "Equipment maintenance",
        "Cleaning services",
        "Landscaping (business property)",
        "HVAC maintenance",
        "Pest control"
      ],
      tips: "Repairs are fully deductible; improvements must be depreciated.",
      deductible: "100%"
    },
    {
      id: "inventory",
      title: "Cost of Goods Sold",
      icon: Package,
      irsReference: "IRS Publication 334",
      description: "Direct costs of products you sell",
      examples: [
        "Raw materials",
        "Inventory purchases",
        "Freight and shipping for inventory",
        "Direct labor costs",
        "Factory overhead",
        "Packaging materials"
      ],
      tips: "COGS is reported separately from expenses and reduces gross income directly.",
      deductible: "100%"
    },
    {
      id: "banking",
      title: "Bank & Financial Fees",
      icon: DollarSign,
      irsReference: "IRS Publication 535",
      description: "Fees related to business banking",
      examples: [
        "Monthly bank fees",
        "Credit card processing fees",
        "Wire transfer fees",
        "Merchant account fees",
        "PayPal/Stripe fees",
        "Business loan interest"
      ],
      tips: "Credit card interest for business purchases is deductible; personal credit card interest is not.",
      deductible: "100%"
    }
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
          <span>Common Expense Categories</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-4 rounded-xl">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Common Expense Categories</h1>
              <p className="text-muted-foreground">IRS-Approved Categories for Small Business Deductions</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">Reference Guide</Badge>
            <Badge variant="secondary">Based on IRS Publications</Badge>
            <Badge variant="secondary">2024 Tax Year</Badge>
          </div>
        </motion.div>

        {/* Important Notice */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertTitle>IRS Compliance Note</AlertTitle>
          <AlertDescription>
            This guide is based on IRS Publications 463, 535, and 334. Expense categories and deductibility 
            may vary based on your specific business structure and situation. Consult a tax professional 
            for personalized advice.
          </AlertDescription>
        </Alert>

        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Understanding Business Expense Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Properly categorizing your business expenses is crucial for maximizing tax deductions and 
              maintaining IRS compliance. The IRS allows deductions for expenses that are both "ordinary" 
              (common in your industry) and "necessary" (helpful for your business).
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-green-500/10 p-4 rounded-lg">
                <Check className="h-5 w-5 text-green-500 mb-2" />
                <h4 className="font-semibold text-green-700 dark:text-green-400">100% Deductible</h4>
                <p className="text-sm text-muted-foreground">Fully deductible in the year incurred</p>
              </div>
              <div className="bg-yellow-500/10 p-4 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mb-2" />
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">Partial Deduction</h4>
                <p className="text-sm text-muted-foreground">Only business portion is deductible</p>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-lg">
                <Info className="h-5 w-5 text-blue-500 mb-2" />
                <h4 className="font-semibold text-blue-700 dark:text-blue-400">Depreciated</h4>
                <p className="text-sm text-muted-foreground">Deducted over multiple years</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories Accordion */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Expense Categories</h2>
          <Accordion type="multiple" className="space-y-4">
            {expenseCategories.map((category) => (
              <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-auto mr-4">{category.deductible}</Badge>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="pl-14 space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Common Examples:</h4>
                      <ul className="grid md:grid-cols-2 gap-2">
                        {category.examples.map((example, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium text-sm">Pro Tip: </span>
                          <span className="text-sm text-muted-foreground">{category.tips}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Reference: {category.irsReference}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Non-Deductible Expenses */}
        <Card className="mt-8 border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Non-Deductible Expenses
            </CardTitle>
            <CardDescription>These expenses are NOT deductible for tax purposes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Personal living expenses",
                "Federal income taxes paid",
                "Penalties and fines",
                "Political contributions",
                "Country club dues",
                "Commuting expenses (home to office)",
                "Entertainment expenses (since 2018)",
                "Bribes or kickbacks"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Need Help Categorizing Expenses?</h3>
                <p className="text-muted-foreground">Our support team can help you set up your chart of accounts.</p>
              </div>
              <Button onClick={() => navigate("/accounting")}>
                Go to Expense Tracking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommonExpenseCategories;
