import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  Search, 
  MessageCircle, 
  Wifi, 
  CreditCard, 
  Upload, 
  Mail, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Database
} from "lucide-react";

const TroubleshootingGuide = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const troubleshootingItems = [
    {
      title: "Bank Connection Issues",
      icon: Wifi,
      severity: "common",
      problems: [
        {
          issue: "Bank account won't connect",
          steps: [
            "Verify you're using the correct login credentials for your bank's website (not app)",
            "Check if your bank requires you to enable third-party access in online banking settings",
            "Temporarily disable any ad blockers or privacy extensions",
            "Try using a different browser (Chrome recommended)",
            "If using multi-factor authentication, ensure you complete the verification",
            "Wait 24 hours and try again - some banks have rate limits"
          ],
          solution: "Most connection issues are resolved by ensuring correct credentials and completing any security verification steps."
        },
        {
          issue: "Bank connection keeps disconnecting",
          steps: [
            "Go to Dashboard > Banking and click 'Reconnect' on the affected account",
            "Re-enter your bank credentials",
            "Check if your bank password has changed recently",
            "Verify your bank hasn't added new security requirements",
            "If the issue persists after 3 attempts, contact support"
          ],
          solution: "Banks occasionally require re-authentication. Reconnecting usually resolves the issue."
        },
        {
          issue: "Transactions not syncing",
          steps: [
            "Click the refresh button on your bank account card",
            "Check if the account status shows 'Connected'",
            "Verify the date range - transactions older than 90 days may not sync",
            "Wait 15 minutes and refresh - syncing can take time",
            "Disconnect and reconnect the account if issues persist"
          ],
          solution: "Transaction syncing typically updates every 4-6 hours. Manual refresh can speed this up."
        }
      ]
    },
    {
      title: "Payment Processing",
      icon: CreditCard,
      severity: "common",
      problems: [
        {
          issue: "Client payment failed",
          steps: [
            "Ask your client to verify their card details are correct",
            "Check if the payment amount exceeds their card limit",
            "Ensure your payment processing is properly set up in Settings > Payments",
            "Verify the client's email address is correct for payment notifications",
            "Try processing a smaller test payment"
          ],
          solution: "Most payment failures are due to incorrect card details or insufficient funds on the client's end."
        },
        {
          issue: "Payment not showing in my account",
          steps: [
            "Check the Payments section to see if the payment is 'Pending'",
            "Review your payout schedule in Settings > Payments",
            "Standard payouts take 2-3 business days",
            "Verify your bank account is correctly linked for payouts",
            "Check for any verification holds on your account"
          ],
          solution: "Payments typically take 2-3 business days to appear in your bank account."
        },
        {
          issue: "Recurring payment not processing",
          steps: [
            "Verify the recurring payment is active in Invoice settings",
            "Check the client's saved payment method hasn't expired",
            "Ensure the invoice wasn't manually cancelled",
            "Review the recurring schedule settings",
            "Contact the client to update their payment method if needed"
          ],
          solution: "Expired payment methods are the most common cause of failed recurring payments."
        }
      ]
    },
    {
      title: "Invoice & Email Issues",
      icon: Mail,
      severity: "common",
      problems: [
        {
          issue: "Client didn't receive invoice email",
          steps: [
            "Verify the client's email address is correct",
            "Ask the client to check their spam/junk folder",
            "Resend the invoice from the Invoice details page",
            "Try sending to an alternate email address",
            "Check if the client's email server is blocking our domain"
          ],
          solution: "Most 'missing' invoices are found in the client's spam folder. Ask them to whitelist our domain."
        },
        {
          issue: "Invoice PDF not generating",
          steps: [
            "Refresh the page and try again",
            "Clear your browser cache and cookies",
            "Try generating the PDF in a different browser",
            "Check if the invoice has any special characters that might cause issues",
            "Ensure your browser allows pop-ups from our site"
          ],
          solution: "PDF generation issues are usually resolved by clearing browser cache or trying a different browser."
        },
        {
          issue: "Invoice showing wrong information",
          steps: [
            "Check if you're viewing a draft vs. sent invoice",
            "Verify your business information in Settings > Business Profile",
            "Review the invoice template settings",
            "Check if tax rates are correctly applied",
            "Edit the invoice and resend if needed"
          ],
          solution: "You can edit and resend invoices. Only voided invoices cannot be modified."
        }
      ]
    },
    {
      title: "Data Import & Export",
      icon: Upload,
      severity: "moderate",
      problems: [
        {
          issue: "Import file not recognized",
          steps: [
            "Verify the file is in a supported format (CSV, QBO, OFX)",
            "Check if the file is corrupted - try opening it in a spreadsheet program",
            "Ensure date formats match the expected format (MM/DD/YYYY or YYYY-MM-DD)",
            "Remove any special characters from headers",
            "Make sure required columns are present"
          ],
          solution: "Download our import template to ensure your data is formatted correctly."
        },
        {
          issue: "Duplicate transactions after import",
          steps: [
            "Check if you imported the same file twice",
            "Review the date range of your import vs. existing transactions",
            "Use the duplicate detection tool in Transactions",
            "Manually delete duplicates or use bulk delete",
            "Set a specific date range for future imports"
          ],
          solution: "Our system has duplicate detection, but it relies on matching amounts and dates. Always check after import."
        },
        {
          issue: "Export file is empty or incomplete",
          steps: [
            "Verify you selected the correct date range",
            "Check if filters are limiting the data shown",
            "Ensure you have data in the selected categories",
            "Try exporting in a different format",
            "Clear filters and export all data first"
          ],
          solution: "Exports only include data matching your current filters. Remove filters for a complete export."
        }
      ]
    },
    {
      title: "Performance & Loading",
      icon: RefreshCw,
      severity: "moderate",
      problems: [
        {
          issue: "App loading slowly",
          steps: [
            "Check your internet connection speed",
            "Clear browser cache and cookies",
            "Close other browser tabs to free up memory",
            "Try using a different browser",
            "Disable browser extensions temporarily",
            "Check our status page for any ongoing issues"
          ],
          solution: "Performance issues are often browser-related. Chrome with cleared cache works best."
        },
        {
          issue: "Dashboard not updating",
          steps: [
            "Click the refresh button in the top-right corner",
            "Check your internet connection",
            "Log out and log back in",
            "Clear your browser cache",
            "Verify bank connections are active"
          ],
          solution: "Dashboard data updates every few minutes. Manual refresh will get the latest data."
        },
        {
          issue: "Error messages appearing",
          steps: [
            "Note the exact error message",
            "Refresh the page and try again",
            "Check if the action requires specific permissions",
            "Try the action in an incognito/private browser window",
            "If persistent, contact support with the error details"
          ],
          solution: "Temporary errors often resolve with a page refresh. Persistent errors may indicate a specific issue."
        }
      ]
    },
    {
      title: "Mobile App Issues",
      icon: Smartphone,
      severity: "moderate",
      problems: [
        {
          issue: "App crashing on launch",
          steps: [
            "Force close the app and reopen",
            "Check for app updates in your app store",
            "Restart your device",
            "Ensure your device has sufficient storage space",
            "Uninstall and reinstall the app"
          ],
          solution: "Reinstalling the app resolves most crash issues while preserving your account data."
        },
        {
          issue: "Receipt photos not uploading",
          steps: [
            "Check your internet connection (WiFi or cellular)",
            "Ensure the app has camera and storage permissions",
            "Try a smaller file size or different image format",
            "Clear the app cache in your device settings",
            "Upload via the web app as an alternative"
          ],
          solution: "Receipt uploads require stable internet. Large files may take longer or need compression."
        },
        {
          issue: "Push notifications not working",
          steps: [
            "Check notification permissions in your device settings",
            "Verify notifications are enabled in the app settings",
            "Ensure Do Not Disturb mode is off",
            "Log out and log back into the app",
            "Reinstall the app if issues persist"
          ],
          solution: "Push notifications require proper permissions both in the app and device settings."
        }
      ]
    },
    {
      title: "Account & Login",
      icon: Database,
      severity: "critical",
      problems: [
        {
          issue: "Forgot password / Can't log in",
          steps: [
            "Click 'Forgot Password' on the login page",
            "Enter your registered email address",
            "Check your email (including spam) for the reset link",
            "Use the link within 24 hours before it expires",
            "Create a new strong password and log in"
          ],
          solution: "Password reset emails are sent immediately. Check spam if not received within 5 minutes."
        },
        {
          issue: "Two-factor authentication issues",
          steps: [
            "Ensure your authenticator app time is synced correctly",
            "Try entering the code immediately after it refreshes",
            "Use backup codes if you have them saved",
            "If locked out, contact support with account verification"
          ],
          solution: "Backup codes are essential. Store them securely when setting up 2FA."
        },
        {
          issue: "Account locked",
          steps: [
            "Wait 30 minutes if locked due to failed login attempts",
            "Use the password reset to unlock",
            "Contact support if you believe this is an error",
            "Verify your account hasn't been compromised"
          ],
          solution: "Accounts are temporarily locked after multiple failed attempts for security. Reset your password to unlock."
        }
      ]
    }
  ];

  const filteredItems = troubleshootingItems.map(category => ({
    ...category,
    problems: category.problems.filter(
      problem =>
        problem.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.steps.some(step => step.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.problems.length > 0);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "moderate":
        return <Badge variant="secondary">Moderate</Badge>;
      default:
        return <Badge variant="outline">Common</Badge>;
    }
  };

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
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Troubleshooting Guide</h1>
                <p className="text-muted-foreground mt-2">
                  Step-by-step solutions to common issues
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Describe your issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>

            {/* Quick Tips */}
            <Card className="mb-8 bg-muted/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Before You Start</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Clear your browser cache and cookies</li>
                      <li>• Try using Google Chrome (our recommended browser)</li>
                      <li>• Disable ad blockers and privacy extensions temporarily</li>
                      <li>• Check our status page for any known issues</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Troubleshooting Categories */}
            <div className="space-y-6">
              {filteredItems.map((category, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <category.icon className="h-5 w-5 text-primary" />
                        {category.title}
                      </CardTitle>
                      {getSeverityBadge(category.severity)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.problems.map((problem, problemIdx) => (
                        <AccordionItem key={problemIdx} value={`item-${idx}-${problemIdx}`}>
                          <AccordionTrigger className="text-left">
                            <span className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                              {problem.issue}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              <div>
                                <h4 className="font-medium mb-2">Steps to resolve:</h4>
                                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                  {problem.steps.map((step, stepIdx) => (
                                    <li key={stepIdx}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-medium">Solution: </span>
                                  <span className="text-muted-foreground">{problem.solution}</span>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <Card className="p-12 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No matching issues found</h3>
                <p className="text-muted-foreground">
                  Try different keywords or contact our support team for help.
                </p>
              </Card>
            )}

            {/* Still Need Help */}
            <Card className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2">Issue not resolved?</h3>
                <p className="text-muted-foreground mb-6">
                  Our support team is ready to help you with any issues.
                </p>
                <Button onClick={() => navigate("/resources/contact-support")}>
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TroubleshootingGuide;
