import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  FileText,
  Scale,
  Building,
  Users,
  DollarSign,
  Receipt,
  Landmark,
  BookOpen,
  List,
} from "lucide-react";

const Accounting = () => {
  const navigate = useNavigate();

  const accountingReports = [
    {
      icon: TrendingUp,
      title: "Profit and Loss",
      description: "A summary of your total income, expenses, and net profit. Updated with new style and functionality.",
      updated: true,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: FileText,
      title: "General Ledger",
      description: "A complete record of transactions and balances for all your accounts. Updated with new style and functionality.",
      updated: true,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Scale,
      title: "Balance Sheet",
      description: "A complete record of transactions and balances for all your accounts. Updated with new style and functionality.",
      updated: true,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Users,
      title: "Revenue by Client",
      description: "A breakdown of your revenue by client to help you understand your business better. Updated with new style and functionality.",
      updated: true,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      link: "/revenue-by-client",
    },
    {
      icon: Scale,
      title: "Trial Balance",
      description: "A quick gut check to make sure your books are balanced",
      updated: false,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      link: "/trial-balance",
    },
    {
      icon: Landmark,
      title: "Bank Reconciliation Summary",
      description: "Helps you see FreshBooks Entries and Bank Transactions that have not been reconciled",
      updated: false,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      link: "/bank-reconciliation",
    },
    {
      icon: Building,
      title: "Sales Tax Summary",
      description: "Helps determine how much you owe the government in Sales Taxes",
      updated: false,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: DollarSign,
      title: "Cash Flow",
      description: "Overview of Cash coming in and going out of your business",
      updated: false,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: BookOpen,
      title: "Journal Entry Report",
      description: "View all journal entries grouped by account with running balances and drill-down capabilities",
      updated: true,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      link: "/journal-entry-report",
    },
  ];

  const updateYourBooks = [
    {
      icon: Receipt,
      title: "Journal Entries",
      description: "Journal Entries allow you to create transactions and assign them to specific accounts. Use these and work with your accountant to keep your books balanced.",
      link: "Learn More",
      buttonText: "View Your Journal Entries",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: List,
      title: "Chart of Accounts",
      description: "See a list of accounts your business has across Assets, Liabilities, Equity, Revenue and Expenses. Collaborate with your accountant to customize the accounts for your business.",
      link: "Learn More",
      buttonText: "View Your Accounts",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Accounting</h1>
        </div>

        {/* Accounting Reports Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Accounting Reports</h2>
            <p className="text-sm text-blue-600">
              Get a snapshot of your financial position
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accountingReports.map((report, index) => (
              <Card
                key={index}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  toast({ title: `Opening ${report.title}...` });
                  if (index === 0) navigate("/profit-and-loss");
                  if (index === 1) navigate("/general-ledger");
                  if (index === 2) navigate("/balance-sheet");
                  if (index === 3) navigate("/revenue-by-client");
                  if (index === 4) navigate("/trial-balance");
                  if (index === 5) navigate("/bank-reconciliation");
                  if (index === 6) navigate("/sales-tax-summary");
                  if (index === 7) navigate("/cash-flow");
                  if (index === 8) navigate("/journal-entry-report");
                }}
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div
                      className={`${report.iconBg} ${report.iconColor} p-3 rounded-lg h-fit`}
                    >
                      <report.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{report.title}</h3>
                        {report.updated && (
                          <Badge variant="secondary" className="text-xs">
                            UPDATED
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Update Your Books Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Update Your Books</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {updateYourBooks.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div
                      className={`${item.iconBg} ${item.iconColor} p-3 rounded-lg h-fit`}
                    >
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description}
                        </p>
                        <a
                          href="#"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {item.link}
                        </a>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          toast({ title: `Opening ${item.title}...` });
                          if (index === 0) navigate("/journal-entries");
                          if (index === 1) navigate("/chart-of-accounts");
                        }}
                      >
                        {item.buttonText}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Accounting;
