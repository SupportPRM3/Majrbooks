import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, FileText, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ContractorPaymentsPanelProps {
  contractorId: string;
  contractorName: string;
}

export function ContractorPaymentsPanel({ contractorId, contractorName }: ContractorPaymentsPanelProps) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  // Fetch payments for the contractor
  const { data: payments, isLoading } = useQuery({
    queryKey: ["contractor-payments", contractorId, selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractor_payments")
        .select("*")
        .eq("contractor_id", contractorId)
        .eq("tax_year", parseInt(selectedYear))
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch invoices for the contractor
  const { data: invoices } = useQuery({
    queryKey: ["contractor-invoices", contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractor_invoices")
        .select("*")
        .eq("contractor_id", contractorId)
        .order("invoice_date", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Convert approved invoice to payment
  const convertToPaymentMutation = useMutation({
    mutationFn: async (invoice: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create payment record
      const { error: paymentError } = await supabase.from("contractor_payments").insert({
        user_id: user.id,
        contractor_id: contractorId,
        payment_date: new Date().toISOString().split('T')[0],
        amount: invoice.total,
        description: `Payment for invoice ${invoice.invoice_number}`,
        tax_year: new Date().getFullYear()
      });
      if (paymentError) throw paymentError;

      // Update invoice status to paid
      const { error: invoiceError } = await supabase
        .from("contractor_invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", invoice.id);
      if (invoiceError) throw invoiceError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractor-payments"] });
      queryClient.invalidateQueries({ queryKey: ["contractor-invoices"] });
      toast.success("Invoice converted to payment");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const ytdTotal = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const pendingInvoices = invoices?.filter(i => i.status === "approved") || [];
  const pendingTotal = pendingInvoices.reduce((sum, i) => sum + Number(i.total), 0);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">YTD Total ({selectedYear})</p>
                <p className="text-2xl font-bold text-primary">${ytdTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Invoices</p>
                <p className="text-2xl font-bold">${pendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">1099 Status</p>
                <p className="text-lg font-semibold">
                  {ytdTotal >= 600 ? (
                    <Badge className="bg-green-500">Ready</Badge>
                  ) : (
                    <Badge variant="secondary">Under $600</Badge>
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invoices to Convert */}
      {pendingInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Approved Invoices (Ready to Pay)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{invoice.description || "-"}</TableCell>
                    <TableCell className="text-right">${Number(invoice.total).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => convertToPaymentMutation.mutate(invoice)}
                        disabled={convertToPaymentMutation.isPending}
                      >
                        Convert to Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Payment History</CardTitle>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : payments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments recorded for {selectedYear}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>1099</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.payment_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{payment.description || "-"}</TableCell>
                    <TableCell className="text-right font-medium">${Number(payment.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      {payment.is_1099_generated ? (
                        <Badge variant="secondary">Generated</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}