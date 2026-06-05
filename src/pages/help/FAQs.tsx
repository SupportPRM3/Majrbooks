import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Search, HelpCircle, CreditCard, Users, FileText, Settings, Shield } from "lucide-react";

const FAQs = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = [
    {
      title: "Getting Started",
      icon: HelpCircle,
      faqs: [
        {
          question: "How do I create my MAJR Books account?",
          answer: "To create your account, click the 'Get Started' button on our homepage. Enter your email, create a password, and follow the setup wizard to configure your business profile, connect bank accounts, and customize your settings."
        },
        {
          question: "Can I import data from other accounting software?",
          answer: "Yes! MAJR Books supports importing data from QuickBooks, Xero, FreshBooks, and CSV files. Go to Settings > Import Data and follow the step-by-step import wizard."
        },
        {
          question: "How do I connect my bank account?",
          answer: "Navigate to Dashboard > Banking and click 'Connect Bank'. We use bank-level encryption and support over 10,000 financial institutions. Search for your bank and follow the secure login prompts."
        },
        {
          question: "What information do I need to set up my business profile?",
          answer: "You'll need your business name, address, EIN (for US businesses), business type, and contact information. You can also upload your logo for branded invoices."
        }
      ]
    },
    {
      title: "Billing & Subscriptions",
      icon: CreditCard,
      faqs: [
        {
          question: "What subscription plans are available?",
          answer: "We offer three plans: Starter ($19/month) for solo entrepreneurs, Professional ($27/month) for growing businesses, and Enterprise ($97/month) for larger teams with advanced features."
        },
        {
          question: "Can I change my plan at any time?",
          answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate applies at your next billing cycle."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover), debit cards, and ACH bank transfers for annual subscriptions."
        },
        {
          question: "Is there a free trial?",
          answer: "Yes! All new accounts receive a 14-day free trial with full access to all Professional plan features. No credit card required to start."
        },
        {
          question: "How do I cancel my subscription?",
          answer: "Go to Settings > Billing > Manage Subscription and click 'Cancel Subscription'. You'll retain access until the end of your current billing period."
        }
      ]
    },
    {
      title: "Team & Permissions",
      icon: Users,
      faqs: [
        {
          question: "How many team members can I add?",
          answer: "Starter plan includes 1 user, Professional includes up to 5 users, and Enterprise includes unlimited users. Additional seats can be purchased on any plan."
        },
        {
          question: "What permission levels are available?",
          answer: "We offer Admin (full access), Accountant (manage financials), Payroll Manager (payroll only), View Only, and custom roles. Admins can create custom permission sets."
        },
        {
          question: "How do I invite a team member?",
          answer: "Go to Team > Users and click 'Invite User'. Enter their email, select their role, and send the invitation. They'll receive an email to set up their account."
        },
        {
          question: "Can I remove a team member's access?",
          answer: "Yes, go to Team > Users, find the team member, and click the three-dot menu to select 'Remove User'. Their access is revoked immediately."
        }
      ]
    },
    {
      title: "Invoicing & Payments",
      icon: FileText,
      faqs: [
        {
          question: "How do I create and send an invoice?",
          answer: "Go to Invoices > Create Invoice. Add your client, line items, payment terms, and click 'Send'. Invoices can be sent via email or shared via link."
        },
        {
          question: "Can I set up recurring invoices?",
          answer: "Yes! When creating an invoice, toggle 'Make Recurring' and set the frequency (weekly, monthly, quarterly, annually). Invoices are automatically generated and optionally sent."
        },
        {
          question: "What payment methods can my clients use?",
          answer: "Clients can pay via credit card, debit card, ACH bank transfer, or PayPal. Set up payment processing in Settings > Payments."
        },
        {
          question: "How do I track overdue invoices?",
          answer: "The Dashboard shows overdue invoices automatically. You can also go to Invoices and filter by 'Overdue'. Automatic reminder emails can be configured in Settings."
        }
      ]
    },
    {
      title: "Account Settings",
      icon: Settings,
      faqs: [
        {
          question: "How do I change my password?",
          answer: "Go to Settings > Account > Security and click 'Change Password'. Enter your current password and your new password twice to confirm."
        },
        {
          question: "Can I change my business information?",
          answer: "Yes, go to Settings > Business Profile to update your business name, address, logo, and contact information."
        },
        {
          question: "How do I set up two-factor authentication?",
          answer: "Go to Settings > Account > Security and enable Two-Factor Authentication. You can use an authenticator app or SMS verification."
        },
        {
          question: "How do I export my data?",
          answer: "Go to Settings > Data Management > Export Data. Select the data types you want to export and choose your format (CSV, PDF, or Excel)."
        }
      ]
    },
    {
      title: "Security & Privacy",
      icon: Shield,
      faqs: [
        {
          question: "How is my data protected?",
          answer: "We use 256-bit AES encryption for all data at rest and TLS 1.3 for data in transit. Our infrastructure is SOC 2 Type II certified and we conduct regular security audits."
        },
        {
          question: "Where is my data stored?",
          answer: "Data is stored in secure, redundant data centers in the United States. We maintain 99.9% uptime and automatic daily backups."
        },
        {
          question: "Do you share my data with third parties?",
          answer: "We never sell your data. We only share data with service providers necessary to operate our platform (e.g., payment processors), as outlined in our Privacy Policy."
        },
        {
          question: "How long do you retain my data?",
          answer: "Active account data is retained indefinitely. After account closure, data is retained for 7 years to comply with tax regulations, then securely deleted."
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(
      faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header navigate={navigate} />

      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/resources")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-xl">
                <HelpCircle className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
                <p className="text-muted-foreground mt-2">
                  Find quick answers to common questions about MAJR Books
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>

            {/* FAQ Categories */}
            <div className="space-y-8">
              {filteredCategories.map((category, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <category.icon className="h-5 w-5 text-primary" />
                      {category.title}
                      <Badge variant="secondary">{category.faqs.length} questions</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.faqs.map((faq, faqIdx) => (
                        <AccordionItem key={faqIdx} value={`item-${idx}-${faqIdx}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCategories.length === 0 && (
              <Card className="p-12 text-center">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try searching with different keywords or browse all categories above.
                </p>
              </Card>
            )}

            {/* Still Need Help */}
            <Card className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
                <p className="text-muted-foreground mb-6">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => navigate("/resources/contact-support")}>
                    Contact Support
                  </Button>
                  <Button onClick={() => navigate("/resources/live-webinars")}>
                    Join a Live Webinar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQs;
