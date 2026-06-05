import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileDown, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generate1099PDF } from "@/lib/generate1099";
import { toast } from "sonner";
import { useState } from "react";

interface Generated1099 {
  id: string;
  contractor_id: string;
  tax_year: number;
  total_compensation: number;
  federal_tax_withheld: number | null;
  state_tax_withheld: number | null;
  state_income: number | null;
  state_payer_number: string | null;
  payer_name: string | null;
  payer_tin: string | null;
  payer_address: string | null;
  payer_city: string | null;
  payer_state: string | null;
  payer_zip: string | null;
  generated_at: string;
  status: string | null;
  contractors: {
    first_name: string;
    last_name: string;
    business_name: string | null;
    tax_id: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  };
}

export default function Form1099History() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ["1099-history", selectedYear],
    queryFn: async () => {
      let query = supabase
        .from("generated_1099s")
        .select(`
          *,
          contractors (
            first_name,
            last_name,
            business_name,
            tax_id,
            address,
            city,
            state,
            zip_code
          )
        `)
        .order("generated_at", { ascending: false });

      if (selectedYear !== "all") {
        query = query.eq("tax_year", parseInt(selectedYear));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Generated1099[];
    },
  });

  const handleDownload = async (record: Generated1099) => {
    try {
      const contractor = record.contractors;
      
      // Fetch payments for the breakdown page
      const { data: payments } = await supabase
        .from("contractor_payments")
        .select("amount, description, payment_date")
        .eq("contractor_id", record.contractor_id)
        .eq("tax_year", record.tax_year);

      const payerInfo = {
        name: record.payer_name || "Business Name",
        tin: record.payer_tin || "XX-XXXXXXX",
        address: record.payer_address || "",
        city: record.payer_city || "",
        state: record.payer_state || "",
        zip: record.payer_zip || ""
      };

      const taxWithholding = (record.federal_tax_withheld || record.state_tax_withheld) ? {
        federalTaxWithheld: record.federal_tax_withheld || 0,
        stateTaxWithheld: record.state_tax_withheld || 0,
        statePayerNumber: record.state_payer_number || "",
        stateIncome: record.state_income || record.total_compensation
      } : undefined;

      const pdf = generate1099PDF(
        contractor,
        payments || [],
        record.tax_year,
        payerInfo,
        taxWithholding
      );

      const recipientName = contractor.business_name || `${contractor.first_name}-${contractor.last_name}`;
      pdf.save(`1099-NEC-${record.tax_year}-${recipientName}.pdf`);
      toast.success("1099 form downloaded");
    } catch (error: any) {
      toast.error(error.message || "Failed to download 1099");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("generated_1099s")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("1099 record deleted");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete record");
    }
  };

  const getStatusBadge = (status: string | null, amount: number) => {
    if (amount < 600) {
      return <Badge variant="secondary">Below $600</Badge>;
    }
    switch (status) {
      case "sent":
        return <Badge className="bg-blue-500">Sent</Badge>;
      case "filed":
        return <Badge className="bg-green-500">Filed</Badge>;
      default:
        return <Badge variant="default">Generated</Badge>;
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div>Loading 1099 history...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Form 1099-NEC History</h1>
            <p className="text-muted-foreground">View all previously generated 1099 forms</p>
          </div>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter by year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contractor Name</TableHead>
              <TableHead>Tax Year</TableHead>
              <TableHead className="text-right">Total Compensation</TableHead>
              <TableHead>Generated Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No 1099 forms have been generated yet
                </TableCell>
              </TableRow>
            ) : (
              history?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.contractors?.business_name || 
                      `${record.contractors?.first_name} ${record.contractors?.last_name}`}
                  </TableCell>
                  <TableCell>{record.tax_year}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ${Number(record.total_compensation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {new Date(record.generated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(record.status, record.total_compensation)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(record)}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {history && history.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            Total 1099 forms: <span className="font-semibold">{history.length}</span>
          </div>
          <div>
            Total compensation reported: <span className="font-semibold">
              ${history.reduce((sum, r) => sum + Number(r.total_compensation), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
