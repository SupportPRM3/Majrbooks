import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { generate1099PDF } from "@/lib/generate1099";

interface Generated1099 {
  id: string;
  contractor_id: string;
  tax_year: number;
  total_compensation: number;
  federal_tax_withheld: number;
  state_tax_withheld: number;
  payer_name: string;
  generated_at: string;
  status: string;
  contractors?: {
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

export function Generated1099sTable() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const queryClient = useQueryClient();

  const { data: generated1099s, isLoading, refetch } = useQuery({
    queryKey: ["generated-1099s", selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq("tax_year", parseInt(selectedYear))
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return data as Generated1099[];
    }
  });

  const handleDownload = async (form: Generated1099) => {
    if (!form.contractors) return;

    try {
      const contractor = form.contractors;
      
      // Fetch payments for the breakdown page
      const { data: payments } = await supabase
        .from("contractor_payments")
        .select("amount, description, payment_date")
        .eq("contractor_id", form.contractor_id)
        .eq("tax_year", form.tax_year);

      const pdf = generate1099PDF(
        {
          first_name: contractor.first_name,
          last_name: contractor.last_name,
          business_name: contractor.business_name,
          tax_id: contractor.tax_id,
          address: contractor.address,
          city: contractor.city,
          state: contractor.state,
          zip_code: contractor.zip_code
        },
        payments || [],
        form.tax_year,
        {
          name: form.payer_name || "",
          tin: "",
          address: "",
          city: "",
          state: "",
          zip: ""
        },
        (form.federal_tax_withheld && form.federal_tax_withheld > 0) || (form.state_tax_withheld && form.state_tax_withheld > 0) ? {
          federalTaxWithheld: form.federal_tax_withheld || 0,
          stateTaxWithheld: form.state_tax_withheld || 0,
          statePayerNumber: "",
          stateIncome: form.total_compensation
        } : undefined
      );
      
      pdf.save(`1099-NEC-${contractor.first_name}-${contractor.last_name}-${form.tax_year}.pdf`);
      toast.success("1099 downloaded");
    } catch (error: any) {
      toast.error("Failed to generate PDF");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-blue-500">Sent</Badge>;
      case "filed":
        return <Badge className="bg-green-500">Filed</Badge>;
      default:
        return <Badge variant="secondary">Generated</Badge>;
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generated 1099 Forms
        </CardTitle>
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
        ) : generated1099s?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No 1099 forms generated for {selectedYear}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contractor</TableHead>
                <TableHead>Tax Year</TableHead>
                <TableHead className="text-right">Total Compensation</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generated1099s?.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">
                    {form.contractors?.business_name || 
                     `${form.contractors?.first_name} ${form.contractors?.last_name}`}
                  </TableCell>
                  <TableCell>{form.tax_year}</TableCell>
                  <TableCell className="text-right">
                    ${Number(form.total_compensation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{format(new Date(form.generated_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>{getStatusBadge(form.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(form)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(form.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}