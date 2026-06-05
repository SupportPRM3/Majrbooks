import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Star, MoreVertical, FileText, Filter, CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Report {
  name: string;
  isFavorite?: boolean;
}

interface ReportCategory {
  title: string;
  reports: Report[];
}

const StandardReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set([
      "Balance Sheet",
      "Profit and Loss",
      "Accounts receivable aging summary",
    ])
  );
  
  // Filter states
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const businessOverview: ReportCategory = {
    title: "Business overview",
    reports: [
      { name: "Audit Log" },
      { name: "Balance Sheet", isFavorite: true },
      { name: "Balance Sheet Comparison" },
      { name: "Balance Sheet Detail" },
      { name: "Balance Sheet Summary" },
      { name: "Statement of Cash Flows" },
      { name: "Business Snapshot" },
      { name: "Custom Summary Report" },
      { name: "Profit and Loss", isFavorite: true },
      { name: "Profit and Loss by Customer" },
      { name: "Profit and Loss by Month" },
      { name: "Profit and Loss by Tag Group" },
      { name: "Profit and Loss Comparison" },
      { name: "Profit and Loss Detail" },
      { name: "Profit and Loss as % of total income" },
      { name: "Profit and Loss year-to-date comparison" },
      { name: "Quarterly Profit and Loss Summary" },
    ],
  };

  const whoOwesYou: ReportCategory = {
    title: "Who owes you",
    reports: [
      { name: "Accounts receivable aging summary", isFavorite: true },
      { name: "Accounts receivable aging detail" },
      { name: "Collections Report" },
      { name: "Customer Balance Summary" },
      { name: "Customer Balance Detail" },
      { name: "Invoice List" },
      { name: "Invoices and Received Payments" },
      { name: "Open Invoices" },
      { name: "Statement List" },
      { name: "Terms List" },
      { name: "Unbilled charges" },
      { name: "Unbilled time" },
    ],
  };

  const salesAndCustomers: ReportCategory = {
    title: "Sales and customers",
    reports: [
      { name: "Sales by Customer Type Detail" },
      { name: "Estimates & Progress Invoicing Summary by Customer" },
      { name: "Customer Contact List" },
      { name: "Income by Customer Summary" },
      { name: "Customer Phone List" },
      { name: "Sales by Customer Summary" },
      { name: "Sales by Customer Detail" },
      { name: "Deposit Detail" },
      { name: "Estimates by Customer" },
      { name: "Inventory Valuation Detail" },
      { name: "Inventory Valuation Summary" },
      { name: "Product/Service List" },
      { name: "Sales by Product/Service Summary" },
      { name: "Sales by Product/Service Detail" },
      { name: "Payment Method List" },
      { name: "Physical Inventory Worksheet" },
      { name: "Time Activities by Customer Detail" },
      { name: "Transaction List by Customer" },
      { name: "Transaction List by Tag Group" },
    ],
  };

  const toggleFavorite = (reportName: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(reportName)) {
        newFavorites.delete(reportName);
      } else {
        newFavorites.add(reportName);
      }
      return newFavorites;
    });
  };

  const clearFilters = () => {
    setShowOnlyFavorites(false);
    setSelectedCategory("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchQuery("");
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (showOnlyFavorites) count++;
    if (selectedCategory !== "all") count++;
    if (dateFrom || dateTo) count++;
    if (searchQuery) count++;
    return count;
  };

  const filterReports = (reports: Report[]) => {
    return reports.filter((report) => {
      // Search filter
      if (searchQuery && !report.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Favorites filter
      if (showOnlyFavorites && !favorites.has(report.name)) {
        return false;
      }
      return true;
    });
  };

  const shouldShowCategory = (categoryTitle: string) => {
    if (selectedCategory === "all") return true;
    return categoryTitle.toLowerCase() === selectedCategory.toLowerCase();
  };

  const ReportItem = ({ name }: { name: string }) => {
    const isFavorite = favorites.has(name);

    return (
      <div className="flex items-center justify-between py-2 px-4 hover:bg-accent/50 transition-colors group">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{name}</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => toggleFavorite(name)}
          >
            <Star
              className={cn(
                "h-4 w-4",
                isFavorite ? "fill-green-500 text-green-500" : "text-muted-foreground"
              )}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border border-border z-50">
              <DropdownMenuItem>View</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const ReportCategory = ({ category }: { category: ReportCategory }) => {
    const [isOpen, setIsOpen] = useState(true);
    const filteredReports = filterReports(category.reports);

    if (!shouldShowCategory(category.title) || filteredReports.length === 0) {
      return null;
    }

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full py-3 px-4 hover:bg-accent/50 transition-colors">
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-90"
            )}
          />
          <span className="font-medium">{category.title}</span>
          <Badge variant="secondary" className="ml-2">
            {filteredReports.length}
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 gap-px bg-border">
            {filteredReports.map((report, index) => (
              <div key={index} className="bg-background">
                <ReportItem name={report.name} />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Standard reports</h1>
        </div>

        <Tabs defaultValue="standard" className="space-y-4">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0">
            <TabsTrigger
              value="standard"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Standard reports
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Custom reports
            </TabsTrigger>
            <TabsTrigger
              value="management"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Management reports
            </TabsTrigger>
            <TabsTrigger
              value="kpis"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent relative"
            >
              KPIs
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </TabsTrigger>
            <TabsTrigger
              value="spreadsheet"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Spreadsheet sync
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Performance center
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xs">
                <Input
                  type="text"
                  placeholder="Type report name here"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {getActiveFiltersCount() > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
                    >
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Create new report
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Favorites Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="favorites"
                      checked={showOnlyFavorites}
                      onCheckedChange={setShowOnlyFavorites}
                    />
                    <Label htmlFor="favorites" className="cursor-pointer">
                      Show only favorites
                    </Label>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border z-50">
                        <SelectItem value="all">All categories</SelectItem>
                        <SelectItem value="business overview">Business overview</SelectItem>
                        <SelectItem value="who owes you">Who owes you</SelectItem>
                        <SelectItem value="sales and customers">Sales and customers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From */}
                  <div className="space-y-2">
                    <Label>Date From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border border-border z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <Label>Date To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border border-border z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          disabled={(date) => dateFrom ? date < dateFrom : false}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    {getActiveFiltersCount() > 0 && (
                      <span>{getActiveFiltersCount()} filter(s) active</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden">
              <ReportCategory category={businessOverview} />
              <ReportCategory category={whoOwesYou} />
              <ReportCategory category={salesAndCustomers} />
            </div>
          </TabsContent>

          <TabsContent value="custom">
            <div className="text-center py-12 text-muted-foreground">
              Custom reports content
            </div>
          </TabsContent>

          <TabsContent value="management">
            <div className="text-center py-12 text-muted-foreground">
              Management reports content
            </div>
          </TabsContent>

          <TabsContent value="kpis">
            <div className="text-center py-12 text-muted-foreground">
              KPIs content
            </div>
          </TabsContent>

          <TabsContent value="spreadsheet">
            <div className="text-center py-12 text-muted-foreground">
              Spreadsheet sync content
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="text-center py-12 text-muted-foreground">
              Performance center content
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default StandardReports;
