import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  Download,
  Video,
  HelpCircle,
  Calculator,
  Search,
  Clock,
  ArrowRight,
  CheckCircle,
  Play,
  FileSpreadsheet,
  DollarSign,
  Building2,
  Receipt,
  TrendingUp,
  Users,
  Mail,
  MessageCircle,
  Calendar,
  ExternalLink,
  Star,
  Briefcase
} from "lucide-react";

const Resources = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const guidesAndTutorials = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of MAJR Books and set up your account for success. This comprehensive guide walks you through initial setup, connecting bank accounts, and configuring your business profile.",
      readTime: "15 min read",
      category: "Beginner",
      icon: BookOpen,
    },
    {
      title: "How to Create & Send Invoices",
      description: "Master the art of professional invoicing. Learn to create custom invoices, add line items, apply taxes, set payment terms, and send invoices directly to clients via email.",
      readTime: "10 min read",
      category: "Invoicing",
      icon: FileText,
    },
    {
      title: "Expense Tracking 101",
      description: "Keep your business finances organized by tracking every expense. Learn how to categorize transactions, attach receipts, and generate expense reports for tax time.",
      readTime: "12 min read",
      category: "Expenses",
      icon: Receipt,
    },
    {
      title: "How to Reconcile Accounts",
      description: "Ensure your books match your bank statements with our step-by-step reconciliation guide. Identify discrepancies and maintain accurate financial records.",
      readTime: "8 min read",
      category: "Accounting",
      icon: CheckCircle,
    },
    {
      title: "End-of-Month Close Checklist",
      description: "Never miss a step with our comprehensive month-end close procedure. Review transactions, reconcile accounts, and prepare for the next reporting period.",
      readTime: "6 min read",
      category: "Accounting",
      icon: Calendar,
    },
  ];

  const templatesAndChecklists = [
    {
      title: "Invoice Template",
      description: "Professional invoice template with customizable fields for your business branding, payment terms, and itemized services.",
      format: "Excel, PDF",
      downloads: "12.5k",
      icon: FileText,
    },
    {
      title: "Expense Report Template",
      description: "Track and categorize business expenses with this comprehensive template. Includes categories, receipt tracking, and automatic totals.",
      format: "Excel, Google Sheets",
      downloads: "8.3k",
      icon: Receipt,
    },
    {
      title: "Weekly/Monthly/Quarterly Bookkeeping Checklists",
      description: "Stay on top of your bookkeeping tasks with these time-based checklists. Never miss a deadline or important financial task.",
      format: "PDF, Printable",
      downloads: "15.2k",
      icon: CheckCircle,
    },
    {
      title: "Cash Flow Statement Template",
      description: "Monitor your business cash flow with this detailed template. Track operating, investing, and financing activities.",
      format: "Excel, PDF",
      downloads: "6.7k",
      icon: TrendingUp,
    },
    {
      title: "Payroll Summary Sheet",
      description: "Organize employee payroll data including wages, deductions, taxes, and net pay calculations in one comprehensive sheet.",
      format: "Excel, Google Sheets",
      downloads: "4.9k",
      icon: Users,
    },
  ];

  const businessAndTaxResources = [
    {
      title: "Common Expense Categories",
      description: "A comprehensive list of IRS-approved expense categories for small businesses. Properly categorize deductions to maximize tax savings.",
      type: "Reference Guide",
      icon: FileSpreadsheet,
    },
    {
      title: "Tax Deductions Cheat Sheet",
      description: "Don't miss out on valuable deductions. This cheat sheet covers the most commonly overlooked tax deductions for small business owners.",
      type: "Cheat Sheet",
      icon: DollarSign,
    },
    {
      title: "Year-End Tax Prep Guide",
      description: "Prepare for tax season with this comprehensive guide. Includes deadlines, required documents, and step-by-step preparation instructions.",
      type: "Guide",
      icon: Calendar,
    },
    {
      title: "Business Structure Comparison",
      description: "LLC vs S-Corp vs Sole Proprietorship: Understand the tax implications, liability protection, and administrative requirements of each structure.",
      type: "Comparison",
      icon: Building2,
    },
    {
      title: "How to Prepare Financial Statements",
      description: "Learn to create professional balance sheets, income statements, and cash flow statements that tell the story of your business.",
      type: "Tutorial",
      icon: TrendingUp,
    },
  ];

  const videoTutorials = [
    {
      title: "Getting Started Guide",
      description: "Get a complete walkthrough of the MAJR Books dashboard. Learn where everything is and how to navigate efficiently.",
      duration: "8:45",
      views: "24.5k",
      thumbnail: "dashboard",
    },
  ];

  const helpCenterItems = [
    {
      title: "FAQs",
      description: "Find quick answers to the most commonly asked questions about MAJR Books features, billing, and account management.",
      icon: HelpCircle,
      link: "#faqs",
    },
    {
      title: "Troubleshooting Guide",
      description: "Experiencing issues? Our troubleshooting guide covers common problems and their solutions to get you back on track.",
      icon: MessageCircle,
      link: "#troubleshooting",
    },
    {
      title: "Contact Support",
      description: "Can't find what you need? Our support team is available Monday-Friday, 9am-6pm EST to assist you.",
      icon: Mail,
      link: "#contact",
    },
    {
      title: "Live Training Webinars",
      description: "Join our weekly live training sessions to learn new features and get your questions answered in real-time.",
      icon: Video,
      link: "#webinars",
    },
  ];

  const calculators = [
    {
      title: "Tax Withholding Calculator",
      description: "Estimate federal and state tax withholdings for your employees. Ensure accurate payroll deductions and avoid surprises at tax time.",
      icon: DollarSign,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Profit Calculator",
      description: "Calculate your gross and net profit margins. Understand your business profitability and identify areas for improvement.",
      icon: TrendingUp,
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Break-Even Calculator",
      description: "Determine how much revenue you need to cover your costs. Plan pricing strategies and set realistic sales targets.",
      icon: Calculator,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Payroll Cost Estimator",
      description: "Estimate the true cost of hiring employees including taxes, benefits, and overhead. Make informed hiring decisions.",
      icon: Users,
      color: "bg-orange-500/10 text-orange-500",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header navigate={navigate} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Resources & Learning Center
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Everything you need to master bookkeeping and grow your business. Guides, templates, videos, and tools—all in one place.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            {[
              { label: "Guides & Tutorials", count: "25+", icon: BookOpen },
              { label: "Templates", count: "15+", icon: FileText },
              { label: "Video Tutorials", count: "40+", icon: Video },
              { label: "Calculators", count: "8+", icon: Calculator },
            ].map((stat, i) => (
              <Card key={i} className="text-center p-4">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stat.count}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Content with Tabs */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="guides" className="space-y-8">
            <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto p-2">
              <TabsTrigger value="guides" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <BookOpen className="h-4 w-4" />
                Guides & Tutorials
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <Download className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="tax" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <Briefcase className="h-4 w-4" />
                Business & Tax
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <Video className="h-4 w-4" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="help" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <HelpCircle className="h-4 w-4" />
                Help Center
              </TabsTrigger>
              <TabsTrigger value="calculators" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
                <Calculator className="h-4 w-4" />
                Calculators
              </TabsTrigger>
            </TabsList>

            {/* Guides & Tutorials Tab */}
            <TabsContent value="guides">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Guides & Tutorials</h2>
                  <Badge variant="secondary">{guidesAndTutorials.length} Articles</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {guidesAndTutorials.map((guide, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <Card 
                        className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                        onClick={() => {
                          if (guide.title === "Getting Started Guide") {
                            navigate("/resources/getting-started");
                          } else if (guide.title === "How to Create & Send Invoices") {
                            navigate("/resources/invoices-guide");
                          } else if (guide.title === "How to Reconcile Accounts") {
                            navigate("/resources/reconcile-accounts");
                          } else if (guide.title === "Expense Tracking 101") {
                            navigate("/resources/expense-tracking");
                          } else if (guide.title === "End-of-Month Close Checklist") {
                            navigate("/resources/end-of-month-close");
                          }
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="bg-primary/10 p-3 rounded-lg">
                              <guide.icon className="h-6 w-6 text-primary" />
                            </div>
                            <Badge variant="outline">{guide.category}</Badge>
                          </div>
                          <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                            {guide.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-4 line-clamp-3">
                            {guide.description}
                          </CardDescription>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {guide.readTime}
                            </span>
                            <span className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all">
                              Read More <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Templates & Checklists</h2>
                  <Badge variant="secondary">{templatesAndChecklists.length} Downloads</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templatesAndChecklists.map((template, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <Card 
                        className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                        onClick={() => {
                          const routes: Record<string, string> = {
                            "Invoice Template": "/templates/invoice",
                            "Expense Report Template": "/templates/expense-report",
                            "Weekly/Monthly/Quarterly Bookkeeping Checklists": "/templates/bookkeeping-checklists",
                            "Cash Flow Statement Template": "/templates/cash-flow",
                            "Payroll Summary Sheet": "/templates/payroll-summary"
                          };
                          if (routes[template.title]) {
                            navigate(routes[template.title]);
                          }
                        }}
                      >
                        <CardHeader>
                          <div className="bg-primary/10 p-3 rounded-lg w-fit">
                            <template.icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="mt-4">{template.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-4 line-clamp-3">
                            {template.description}
                          </CardDescription>
                          <div className="flex items-center justify-between text-sm mb-4">
                            <span className="text-muted-foreground">Format: {template.format}</span>
                            <span className="text-muted-foreground">{template.downloads} downloads</span>
                          </div>
                          <Button className="w-full gap-2">
                            <Download className="h-4 w-4" />
                            Download Free
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            {/* Business & Tax Resources Tab */}
            <TabsContent value="tax">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Business & Tax Resources</h2>
                  <Badge variant="secondary">{businessAndTaxResources.length} Resources</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {businessAndTaxResources.map((resource, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <Card 
                        className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                        onClick={() => {
                          const routes: Record<string, string> = {
                            "Common Expense Categories": "/resources/expense-categories",
                            "Tax Deductions Cheat Sheet": "/resources/tax-deductions",
                            "Year-End Tax Prep Guide": "/resources/year-end-tax-prep",
                            "Business Structure Comparison": "/resources/business-structure",
                            "How to Prepare Financial Statements": "/resources/financial-statements"
                          };
                          const route = routes[resource.title];
                          if (route) navigate(route);
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="bg-primary/10 p-3 rounded-lg">
                              <resource.icon className="h-6 w-6 text-primary" />
                            </div>
                            <Badge>{resource.type}</Badge>
                          </div>
                          <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                            {resource.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-4">
                            {resource.description}
                          </CardDescription>
                          <span className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all text-sm">
                            Learn More <ArrowRight className="h-4 w-4" />
                          </span>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            {/* Video Tutorials Tab */}
            <TabsContent value="videos">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Video Tutorials</h2>
                  <Badge variant="secondary">{videoTutorials.length} Videos</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {videoTutorials.map((video, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <Card 
                        className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group overflow-hidden"
                        onClick={() => {
                          if (video.title === "Getting Started Guide") {
                            navigate("/resources/dashboard-tour");
                          }
                        }}
                      >
                        {/* Video Thumbnail Placeholder */}
                        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 h-48 flex items-center justify-center">
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                          <div className="relative z-10 bg-primary rounded-full p-4 group-hover:scale-110 transition-transform">
                            <Play className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
                          </div>
                          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded">
                            {video.duration}
                          </div>
                        </div>
                        <CardHeader>
                          <CardTitle className="group-hover:text-primary transition-colors">
                            {video.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-4">
                            {video.description}
                          </CardDescription>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            {video.views} views
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center mt-8">
                  <Button variant="outline" size="lg" className="gap-2">
                    View All Videos <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Help Center Tab */}
            <TabsContent value="help">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Help Center</h2>
                  <Badge variant="secondary">24/7 Support</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {helpCenterItems.map((item, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <Card 
                        className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                        onClick={() => {
                          const routes: Record<string, string> = {
                            "FAQs": "/resources/faqs",
                            "Troubleshooting Guide": "/resources/troubleshooting",
                            "Contact Support": "/resources/contact-support",
                            "Live Training Webinars": "/resources/live-webinars"
                          };
                          navigate(routes[item.title] || "/resources");
                        }}
                      >
                        <CardHeader>
                          <div className="bg-primary/10 p-3 rounded-lg w-fit">
                            <item.icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                            {item.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-4">
                            {item.description}
                          </CardDescription>
                          <span className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all text-sm">
                            Go to {item.title} <ArrowRight className="h-4 w-4" />
                          </span>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Contact Support Banner */}
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 mt-8">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Need Help?</h3>
                        <p className="text-muted-foreground">
                          Our support team is ready to assist you. Reach out via email, chat, or schedule a call.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" className="gap-2">
                          <Mail className="h-4 w-4" />
                          Email Us
                        </Button>
                        <Button className="gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Live Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Calculators Tab */}
            <TabsContent value="calculators">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Financial Tools & Calculators</h2>
                  <Badge variant="secondary">{calculators.length} Tools</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {calculators.map((calc, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <Card 
                        className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
                        onClick={() => {
                          const routes: Record<string, string> = {
                            "Tax Withholding Calculator": "/calculators/tax-withholding",
                            "Profit Calculator": "/calculators/profit",
                            "Break-Even Calculator": "/calculators/break-even",
                            "Payroll Cost Estimator": "/calculators/payroll-cost",
                          };
                          const route = routes[calc.title];
                          if (route) navigate(route);
                        }}
                      >
                        <CardHeader>
                          <div className={`p-3 rounded-lg w-fit ${calc.color}`}>
                            <calc.icon className="h-6 w-6" />
                          </div>
                          <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                            {calc.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-4">
                            {calc.description}
                          </CardDescription>
                          <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Calculator className="h-4 w-4" />
                            Open Calculator
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get the latest bookkeeping tips, tax updates, and new resources delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input placeholder="Enter your email" className="h-12" />
              <Button size="lg" className="h-12">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Resources;
