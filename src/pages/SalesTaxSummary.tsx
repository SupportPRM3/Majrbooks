import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";

const SalesTaxSummary = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().getFullYear(), 11, 31));
  const [filtersApplied, setFiltersApplied] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch sales tax data from invoices
  const { data: salesTaxData, isLoading } = useQuery({
    queryKey: ["sales_tax_summary", user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .gte("issue_date", format(startDate, "yyyy-MM-dd"))
        .lte("issue_date", format(endDate, "yyyy-MM-dd"))
        .not("tax_name", "is", null);

      if (error) throw error;

      // Group by tax name and calculate totals
      const taxGroups = (data || []).reduce((acc: any, invoice) => {
        const taxName = invoice.tax_name || "Unknown";
        if (!acc[taxName]) {
          acc[taxName] = {
            name: taxName,
            taxableAmount: 0,
            taxes: 0,
          };
        }
        acc[taxName].taxableAmount += parseFloat(invoice.subtotal?.toString() || "0");
        acc[taxName].taxes += parseFloat(invoice.tax?.toString() || "0");
        return acc;
      }, {});

      return Object.values(taxGroups);
    },
    enabled: !!user?.id,
  });

  const totalBilled = (salesTaxData as any[] || []).reduce(
    (sum: number, tax: any) => sum + tax.taxes,
    0
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sales Tax Summary</h1>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  More Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Export to PDF</DropdownMenuItem>
                <DropdownMenuItem>Export to Excel</DropdownMenuItem>
                <DropdownMenuItem>Print</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
              Send...
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
          {/* Report Card */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Report Header */}
                <div className="border-b pb-4">
                  <h2 className="text-2xl font-bold text-[hsl(var(--primary))] mb-2">
                    Sales Tax Summary
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {profile?.business_name || "Your Business"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    Total Billed: {totalBilled.toFixed(2)} (USD)
                  </p>
                </div>

                {/* Table */}
                <div>
                  {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[hsl(var(--primary))]">Tax Name</TableHead>
                          <TableHead className="text-right text-[hsl(var(--primary))]">
                            Taxable Amount
                          </TableHead>
                          <TableHead className="text-right text-[hsl(var(--primary))]">
                            Taxes
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!salesTaxData || salesTaxData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                              No tax information found. Please adjust the range.
                            </TableCell>
                          </TableRow>
                        ) : (
                          salesTaxData.map((tax: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{tax.name}</TableCell>
                              <TableCell className="text-right">
                                ${tax.taxableAmount.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                ${tax.taxes.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Panel */}
          <div className="space-y-6">
            <Sheet>
              <SheetTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-shadow lg:hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Settings</h3>
                      <SlidersHorizontal className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SettingsContent
                    filtersApplied={filtersApplied}
                    setFiltersApplied={setFiltersApplied}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Settings */}
            <Card className="hidden lg:block">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Settings</h3>
                <SettingsContent
                  filtersApplied={filtersApplied}
                  setFiltersApplied={setFiltersApplied}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const SettingsContent = ({
  filtersApplied,
  setFiltersApplied,
}: {
  filtersApplied: boolean;
  setFiltersApplied: (value: boolean) => void;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="font-medium">Filters</span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </div>
      {!filtersApplied && (
        <p className="text-sm text-muted-foreground">No filters applied</p>
      )}
    </div>
  );
};

export default SalesTaxSummary;
