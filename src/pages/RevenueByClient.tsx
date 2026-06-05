import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Download,
  Send,
  Settings,
  Filter,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subYears } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PeriodType = "this-year" | "last-quarter" | "year-comparison" | "percentage";
type SortField = "client" | "total";
type SortOrder = "asc" | "desc";

interface ClientRevenue {
  client_name: string;
  total_revenue: number;
  percentage?: number;
}

const RevenueByClient = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("this-year");
  const [dateRange, setDateRange] = useState({
    start: startOfYear(new Date()),
    end: endOfYear(new Date()),
  });
  const [sortField, setSortField] = useState<SortField>("total");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["revenue-by-client", dateRange, selectedPeriod],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch invoices within date range
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("client_name, amount, issue_date")
        .eq("user_id", user.id)
        .gte("issue_date", format(dateRange.start, "yyyy-MM-dd"))
        .lte("issue_date", format(dateRange.end, "yyyy-MM-dd"))
        .in("status", ["paid", "sent"]);

      if (error) throw error;

      // Group by client and calculate totals
      const clientMap = new Map<string, number>();
      invoices?.forEach((invoice) => {
        const current = clientMap.get(invoice.client_name) || 0;
        clientMap.set(invoice.client_name, current + Number(invoice.amount));
      });

      const totalRevenue = Array.from(clientMap.values()).reduce((sum, val) => sum + val, 0);

      const result: ClientRevenue[] = Array.from(clientMap.entries()).map(
        ([client_name, total_revenue]) => ({
          client_name,
          total_revenue,
          percentage: totalRevenue > 0 ? (total_revenue / totalRevenue) * 100 : 0,
        })
      );

      return { clients: result, totalRevenue };
    },
  });

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
    const now = new Date();

    switch (period) {
      case "this-year":
        setDateRange({ start: startOfYear(now), end: endOfYear(now) });
        break;
      case "last-quarter":
        const lastQuarterStart = startOfQuarter(subYears(now, 0));
        const lastQuarterEnd = endOfQuarter(subYears(now, 0));
        setDateRange({ start: lastQuarterStart, end: lastQuarterEnd });
        break;
      case "year-comparison":
        setDateRange({ start: startOfYear(subYears(now, 1)), end: endOfYear(now) });
        break;
      case "percentage":
        setDateRange({ start: startOfYear(now), end: endOfYear(now) });
        break;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedData = [...(revenueData?.clients || [])].sort((a, b) => {
    if (sortField === "client") {
      return sortOrder === "asc"
        ? a.client_name.localeCompare(b.client_name)
        : b.client_name.localeCompare(a.client_name);
    } else {
      return sortOrder === "asc"
        ? a.total_revenue - b.total_revenue
        : b.total_revenue - a.total_revenue;
    }
  });

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Revenue by Client Report", 14, 20);

    doc.setFontSize(10);
    doc.text(
      `Period: ${format(dateRange.start, "MMM d, yyyy")} - ${format(dateRange.end, "MMM d, yyyy")}`,
      14,
      30
    );
    doc.text(`Total Revenue: $${revenueData?.totalRevenue.toFixed(2) || "0.00"}`, 14, 36);

    const tableData = sortedData.map((client) => [
      client.client_name,
      `$${client.total_revenue.toFixed(2)}`,
      selectedPeriod === "percentage" ? `${client.percentage?.toFixed(1)}%` : "",
    ]);

    autoTable(doc, {
      head: [["Client", "Total Revenue", selectedPeriod === "percentage" ? "% of Income" : ""]],
      body: tableData,
      startY: 42,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`revenue-by-client-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Revenue by Client</h1>
        </div>

        {/* Yellow Notification Banner */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-yellow-900">Updated Revenue by Client</p>
                <p className="text-sm text-yellow-800 mt-1">
                  We've updated the style and functionality on our Revenue by Client report, but
                  the old report is still available if you need it.
                </p>
              </div>
              <Button variant="link" className="text-blue-600 hover:text-blue-700">
                View Old Report
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Main Report Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold">
                  {format(dateRange.start, "MMM d")} – {format(dateRange.end, "MMM d, yyyy")}
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send To...
                </Button>
              </div>
            </div>

            {/* Period Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedPeriod === "this-year" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange("this-year")}
                >
                  This Year
                </Button>
                <Button
                  variant={selectedPeriod === "last-quarter" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange("last-quarter")}
                >
                  Last Quarter
                </Button>
                <Button
                  variant={selectedPeriod === "year-comparison" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange("year-comparison")}
                >
                  This Year vs Last Year
                </Button>
                <Button
                  variant={selectedPeriod === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange("percentage")}
                >
                  % of Income
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Summary Stats */}
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${revenueData?.totalRevenue.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Number of Clients</p>
                  <p className="text-2xl font-bold">{revenueData?.clients.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average per Client</p>
                  <p className="text-2xl font-bold">
                    $
                    {revenueData?.clients.length
                      ? (revenueData.totalRevenue / revenueData.clients.length).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              {isLoading ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : sortedData.length === 0 ? (
                <div className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No results found</p>
                  <p className="text-sm text-muted-foreground">
                    Try using different keywords or search criteria.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-semibold"
                          onClick={() => handleSort("client")}
                        >
                          Client
                          {getSortIcon("client")}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-semibold"
                          onClick={() => handleSort("total")}
                        >
                          Total
                          {getSortIcon("total")}
                        </Button>
                      </TableHead>
                      {selectedPeriod === "percentage" && (
                        <TableHead className="text-right">
                          <span className="font-semibold">% of Income</span>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((client, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{client.client_name}</TableCell>
                        <TableCell className="text-right">
                          ${client.total_revenue.toFixed(2)}
                        </TableCell>
                        {selectedPeriod === "percentage" && (
                          <TableCell className="text-right">
                            <Badge variant="secondary">{client.percentage?.toFixed(1)}%</Badge>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RevenueByClient;
