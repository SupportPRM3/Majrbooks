import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreHorizontal, Star, FileText as FileIcon, ChevronDown, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";

interface ReportConfig {
  name: string;
  route?: string;
}

const reportRoutes: Record<string, string> = {
  "Profit and Loss": "/profit-and-loss",
  "Balance Sheet": "/balance-sheet",
  "Cash Flow Statement": "/cash-flow",
  "Trial Balance": "/trial-balance",
  "Sales Tax Summary": "/sales-tax-summary",
  "Tax Liability Report": "/sales-tax-summary",
  "1099 Summary": "/1099-history",
  "Revenue by Client": "/revenue-by-client",
  "Accounts Receivable Aging": "/standard-reports",
  "Client Statement": "/standard-reports",
  "Time by Employee": "/time-tracking-dashboard",
  "Billable Hours Summary": "/time-tracking-analytics",
  "Expense Report": "/expenses",
  "General Ledger": "/general-ledger",
  "Journal Entry Report": "/journal-entry-report",
  "Bank Reconciliation": "/bank-reconciliation",
};

const Reports = () => {
  const navigate = useNavigate();
  const [reportTab, setReportTab] = useState("standard");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["Profit and Loss", "Balance Sheet", "Revenue by Client"]));

  const financialReports: ReportConfig[] = [
    { name: "Profit and Loss", route: "/profit-and-loss" },
    { name: "Balance Sheet", route: "/balance-sheet" },
    { name: "Cash Flow Statement", route: "/cash-flow" },
    { name: "Trial Balance", route: "/trial-balance" },
    { name: "General Ledger", route: "/general-ledger" },
    { name: "Journal Entry Report", route: "/journal-entry-report" },
  ];

  const taxReports: ReportConfig[] = [
    { name: "Sales Tax Summary", route: "/sales-tax-summary" },
    { name: "Tax Liability Report", route: "/sales-tax-summary" },
    { name: "1099 Summary", route: "/1099-history" },
  ];

  const clientReports: ReportConfig[] = [
    { name: "Revenue by Client", route: "/revenue-by-client" },
    { name: "Accounts Receivable Aging", route: "/standard-reports" },
    { name: "Client Statement", route: "/standard-reports" },
  ];

  const timeExpenseReports: ReportConfig[] = [
    { name: "Time by Employee", route: "/time-tracking-dashboard" },
    { name: "Billable Hours Summary", route: "/time-tracking-analytics" },
    { name: "Expense Report", route: "/expenses" },
    { name: "Bank Reconciliation", route: "/bank-reconciliation" },
  ];

  const toggleFavorite = (reportName: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(reportName)) {
        newFavorites.delete(reportName);
        toast({ title: `${reportName} removed from favorites` });
      } else {
        newFavorites.add(reportName);
        toast({ title: `${reportName} added to favorites` });
      }
      return newFavorites;
    });
  };

  const handleRunReport = (report: ReportConfig) => {
    if (report.route) {
      navigate(report.route);
    } else {
      toast({ title: `Running ${report.name}...`, description: "Report is being generated." });
    }
  };

  const handleExportReport = (reportName: string) => {
    toast({ title: `Exporting ${reportName}...`, description: "Your report will be downloaded shortly." });
  };

  const filterReports = (reports: ReportConfig[]) => {
    if (!searchQuery) return reports;
    return reports.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const getFavoriteReports = (): ReportConfig[] => {
    const allReports = [...financialReports, ...taxReports, ...clientReports, ...timeExpenseReports];
    return allReports.filter(r => favorites.has(r.name));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate and view financial reports</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate("/standard-reports")}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            All Standard Reports
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={reportTab} onValueChange={(value) => {
          setReportTab(value);
        }} className="w-full">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0">
            <TabsTrigger 
              value="standard" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              Standard Reports
            </TabsTrigger>
            <TabsTrigger 
              value="custom"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              Custom Reports
            </TabsTrigger>
            <TabsTrigger 
              value="favorites"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-6 py-3"
            >
              Favorites ({favorites.size})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="mt-6">
            {/* Search */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Report Categories */}
            <div className="space-y-4">
              <ReportCategory 
                title="Financial Statements" 
                reports={filterReports(financialReports)}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onRunReport={handleRunReport}
                onExportReport={handleExportReport}
              />
              <ReportCategory 
                title="Tax Reports" 
                reports={filterReports(taxReports)}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onRunReport={handleRunReport}
                onExportReport={handleExportReport}
              />
              <ReportCategory 
                title="Client Reports" 
                reports={filterReports(clientReports)}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onRunReport={handleRunReport}
                onExportReport={handleExportReport}
              />
              <ReportCategory 
                title="Time & Expenses" 
                reports={filterReports(timeExpenseReports)}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onRunReport={handleRunReport}
                onExportReport={handleExportReport}
              />
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-6">
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <h3 className="text-lg font-semibold mb-2">Custom Reports</h3>
                <p>Create and manage custom reports tailored to your needs.</p>
                <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white">
                  Create Custom Report
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            {favorites.size > 0 ? (
              <div className="space-y-4">
                <ReportCategory 
                  title="Favorite Reports" 
                  reports={getFavoriteReports()}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onRunReport={handleRunReport}
                  onExportReport={handleExportReport}
                  defaultOpen={true}
                />
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No Favorite Reports</h3>
                  <p>Star your frequently used reports for quick access.</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Report Category Component
interface ReportCategoryProps {
  title: string;
  reports: ReportConfig[];
  favorites: Set<string>;
  onToggleFavorite: (name: string) => void;
  onRunReport: (report: ReportConfig) => void;
  onExportReport: (name: string) => void;
  defaultOpen?: boolean;
}

const ReportCategory = ({ 
  title, 
  reports, 
  favorites, 
  onToggleFavorite, 
  onRunReport, 
  onExportReport,
  defaultOpen = true 
}: ReportCategoryProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (reports.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-muted/50">
            <h3 className="font-semibold">{title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{reports.length} reports</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t">
            {reports.map((report, index) => (
              <ReportItem 
                key={index} 
                report={report}
                isFavorite={favorites.has(report.name)}
                onToggleFavorite={() => onToggleFavorite(report.name)}
                onRunReport={() => onRunReport(report)}
                onExportReport={() => onExportReport(report.name)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

// Report Item Component
interface ReportItemProps {
  report: ReportConfig;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRunReport: () => void;
  onExportReport: () => void;
}

const ReportItem = ({ report, isFavorite, onToggleFavorite, onRunReport, onExportReport }: ReportItemProps) => {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer group" onClick={onRunReport}>
      <div className="flex items-center gap-3">
        <FileIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm group-hover:text-green-600 transition-colors">{report.name}</span>
        {report.route && (
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleFavorite}
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-green-600 text-green-600' : 'text-muted-foreground'}`} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background">
            <DropdownMenuItem onClick={onRunReport}>Run report</DropdownMenuItem>
            <DropdownMenuItem onClick={onExportReport}>Export</DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleFavorite}>
              {isFavorite ? "Remove from favorites" : "Add to favorites"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Reports;
