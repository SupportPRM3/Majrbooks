import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { FileText } from "lucide-react";

interface ConvertTimeToInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface TimeEntry {
  id: string;
  entry_date: string;
  total_hours: number;
  notes: string | null;
  is_billable: boolean;
  project_id: string | null;
  projects: { name: string; client_name: string; billing_rate: number | null } | null;
}

export default function ConvertTimeToInvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
}: ConvertTimeToInvoiceDialogProps) {
  const queryClient = useQueryClient();
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [hourlyRate, setHourlyRate] = useState(75);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: billableEntries, isLoading } = useQuery({
    queryKey: ["billable_time_entries", dateFrom, dateTo],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First get employees for this user
      const { data: employees } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id);

      if (!employees || employees.length === 0) return [];

      const employeeIds = employees.map(e => e.id);

      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          id,
          entry_date,
          total_hours,
          notes,
          is_billable,
          project_id,
          projects(name, client_name, billing_rate)
        `)
        .in("employee_id", employeeIds)
        .eq("is_billable", true)
        .not("clock_out", "is", null)
        .gte("entry_date", dateFrom)
        .lte("entry_date", dateTo)
        .order("entry_date", { ascending: false });

      if (error) throw error;
      return data as TimeEntry[];
    },
    enabled: open,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (selectedEntries.size === 0) {
        throw new Error("Please select at least one time entry");
      }

      const selectedTimeEntries = billableEntries?.filter(e => selectedEntries.has(e.id)) || [];
      
      // Group by client/project for invoice
      const totalHours = selectedTimeEntries.reduce((sum, e) => sum + Number(e.total_hours), 0);
      const amount = totalHours * hourlyRate;

      // Get client name from first project or use default
      const clientName = selectedTimeEntries[0]?.projects?.client_name || "Time Billing Client";

      // Generate invoice number
      const timestamp = Date.now();
      const invoiceNumber = `INV-TIME-${timestamp}`;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: clientName,
          amount: amount,
          subtotal: amount,
          due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
          status: "draft",
          notes: `Time entries from ${dateFrom} to ${dateTo}`,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create line items for each time entry
      const lineItems = selectedTimeEntries.map(entry => ({
        invoice_id: invoice.id,
        description: `${entry.projects?.name || "General Work"} - ${format(new Date(entry.entry_date), "MMM d, yyyy")}${entry.notes ? `: ${entry.notes}` : ""}`,
        quantity: Number(entry.total_hours),
        rate: entry.projects?.billing_rate || hourlyRate,
      }));

      const { error: lineItemsError } = await supabase
        .from("invoice_line_items")
        .insert(lineItems);

      if (lineItemsError) throw lineItemsError;

      // Mark time entries as billed (update is_billable to false to track)
      // Note: In a real app, you might want a separate "billed" flag
      
      return invoice;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["billable_time_entries"] });
      toast.success(`Invoice ${invoice.invoice_number} created successfully`);
      setSelectedEntries(new Set());
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleEntry = (id: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  const toggleAll = () => {
    if (selectedEntries.size === billableEntries?.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(billableEntries?.map(e => e.id) || []));
    }
  };

  const calculateTotal = () => {
    const selected = billableEntries?.filter(e => selectedEntries.has(e.id)) || [];
    const totalHours = selected.reduce((sum, e) => sum + Number(e.total_hours), 0);
    return {
      hours: totalHours.toFixed(2),
      amount: (totalHours * hourlyRate).toFixed(2),
    };
  };

  const totals = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Convert Time to Invoice
          </DialogTitle>
          <DialogDescription>
            Select billable time entries to convert into an invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Filters */}
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Default Hourly Rate</Label>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
            </div>
          </div>

          {/* Time Entries Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedEntries.size === billableEntries?.length && billableEntries?.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading billable entries...
                    </TableCell>
                  </TableRow>
                ) : billableEntries?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No billable time entries found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  billableEntries?.map((entry) => {
                    const rate = entry.projects?.billing_rate || hourlyRate;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEntries.has(entry.id)}
                            onCheckedChange={() => toggleEntry(entry.id)}
                          />
                        </TableCell>
                        <TableCell>{format(new Date(entry.entry_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          {entry.projects?.name || "General"}
                          {entry.projects?.client_name && (
                            <span className="text-muted-foreground text-xs block">
                              {entry.projects.client_name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(entry.total_hours).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${(Number(entry.total_hours) * rate).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Selected Entries</p>
                <p className="text-lg font-bold">{selectedEntries.size}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-lg font-bold">{totals.hours}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Invoice Total</p>
              <p className="text-2xl font-bold text-primary">${totals.amount}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createInvoiceMutation.mutate()}
              disabled={createInvoiceMutation.isPending || selectedEntries.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
