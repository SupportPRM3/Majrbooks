import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Calendar, DollarSign, RefreshCw } from "lucide-react";

interface RecurringInvoice {
  id: string;
  client_name: string;
  amount: number;
  frequency: string;
  next_run_date: string;
  status: string;
}

export const UpcomingRecurringInvoices = () => {
  const { user } = useAuth();
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [allInvoices, setAllInvoices] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "client">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const loadRecurringInvoices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("recurring_invoices")
        .select("id, client_name, amount, frequency, next_run_date, status")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      setAllInvoices(data || []);
    } catch (error) {
      console.error("Error loading recurring invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecurringInvoices();

    // Set up real-time subscription
    const channel = supabase
      .channel("recurring_invoices_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recurring_invoices",
        },
        () => {
          loadRecurringInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Apply filters and sorting
  useEffect(() => {
    let filteredData = [...allInvoices];

    // Apply client filter
    if (clientFilter !== "all") {
      filteredData = filteredData.filter(inv => inv.client_name === clientFilter);
    }

    // Apply frequency filter
    if (frequencyFilter !== "all") {
      filteredData = filteredData.filter(inv => inv.frequency === frequencyFilter);
    }

    // Apply amount range filter
    if (minAmount !== "") {
      filteredData = filteredData.filter(inv => inv.amount >= parseFloat(minAmount));
    }
    if (maxAmount !== "") {
      filteredData = filteredData.filter(inv => inv.amount <= parseFloat(maxAmount));
    }

    // Apply sorting
    filteredData.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.next_run_date).getTime() - new Date(b.next_run_date).getTime();
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortBy === "client") {
        comparison = a.client_name.localeCompare(b.client_name);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setRecurringInvoices(filteredData.slice(0, 10));
  }, [allInvoices, clientFilter, frequencyFilter, minAmount, maxAmount, sortBy, sortOrder]);

  // Get unique clients for filter dropdown
  const uniqueClients = Array.from(new Set(allInvoices.map(inv => inv.client_name)));

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case "weekly":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "monthly":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "quarterly":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "yearly":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Upcoming Recurring Invoices
          </CardTitle>
          <CardDescription>Next invoices to be generated automatically</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (allInvoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Upcoming Recurring Invoices
          </CardTitle>
          <CardDescription>Next invoices to be generated automatically</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recurring invoices scheduled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Upcoming Recurring Invoices
        </CardTitle>
        <CardDescription>Next invoices to be generated automatically</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {uniqueClients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Frequencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequencies</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Min Amount"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Max Amount"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
          />

          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [by, order] = value.split('-') as [typeof sortBy, typeof sortOrder];
            setSortBy(by);
            setSortOrder(order);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Date (Earliest)</SelectItem>
              <SelectItem value="date-desc">Date (Latest)</SelectItem>
              <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
              <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
              <SelectItem value="client-asc">Client (A-Z)</SelectItem>
              <SelectItem value="client-desc">Client (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        {recurringInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No invoices match the selected filters</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {recurringInvoices.length} of {allInvoices.length} recurring invoices
            </div>

            {/* Table Section */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Next Generation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.client_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getFrequencyBadgeColor(invoice.frequency)}>
                        {invoice.frequency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{invoice.amount.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(invoice.next_run_date), "MMM dd, yyyy")}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};
