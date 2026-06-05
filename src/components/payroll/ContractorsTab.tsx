import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, DollarSign, FileText, History, Eye, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AddContractorDialog from "./AddContractorDialog";
import EditContractorDialog from "./EditContractorDialog";
import Generate1099Dialog from "./Generate1099Dialog";
import { ContractorInvoiceDialog } from "./ContractorInvoiceDialog";
import { ContractorPaymentsPanel } from "./ContractorPaymentsPanel";
import { Generated1099sTable } from "./Generated1099sTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Contractor {
  id: string;
  first_name: string;
  last_name: string;
  business_name: string | null;
  tax_id?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  email: string | null;
  phone: string | null;
  rate: number;
  payment_terms: string | null;
  status: string;
}

export default function ContractorsTab() {
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [generate1099DialogOpen, setGenerate1099DialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: "",
    description: "",
    tax_year: new Date().getFullYear().toString()
  });
  const queryClient = useQueryClient();

  const { data: contractors, isLoading } = useQuery({
    queryKey: ["contractors"],
    queryFn: async () => {
      // Fetch contractors WITHOUT tax_id for general listing to protect sensitive PII
      const { data, error } = await supabase
        .from("contractors")
        .select("id, first_name, last_name, business_name, address, city, state, zip_code, email, phone, rate, payment_terms, status, user_id, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contractor[];
    },
  });

  // Fetch YTD payments for all contractors
  const currentYear = new Date().getFullYear();
  const { data: ytdPayments } = useQuery({
    queryKey: ["contractor-ytd-payments", currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractor_payments")
        .select("contractor_id, amount")
        .eq("tax_year", currentYear);
      if (error) throw error;
      
      // Aggregate by contractor
      const totals: Record<string, number> = {};
      data?.forEach(p => {
        totals[p.contractor_id] = (totals[p.contractor_id] || 0) + Number(p.amount);
      });
      return totals;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contractors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contractor deleted successfully");
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContractor) throw new Error("No contractor selected");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("contractor_payments").insert({
        user_id: user.id,
        contractor_id: selectedContractor.id,
        payment_date: paymentData.payment_date,
        amount: parseFloat(paymentData.amount),
        description: paymentData.description,
        tax_year: parseInt(paymentData.tax_year)
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      setPaymentDialogOpen(false);
      setPaymentData({
        payment_date: new Date().toISOString().split('T')[0],
        amount: "",
        description: "",
        tax_year: new Date().getFullYear().toString()
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });


  const handleEdit = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setEditDialogOpen(true);
  };

  const handleDelete = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setDeleteDialogOpen(true);
  };

  const handleRecordPayment = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setPaymentDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-4">Loading contractors...</div>;
  }

  const totalYTD = Object.values(ytdPayments || {}).reduce((sum, val) => sum + val, 0);

  return (
    <Tabs defaultValue="contractors" className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
          <TabsTrigger value="1099s">Generated 1099s</TabsTrigger>
        </TabsList>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGenerate1099DialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Generate 1099s
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contractor
          </Button>
        </div>
      </div>

      <TabsContent value="contractors" className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Active Contractors</div>
              <div className="text-2xl font-bold">{contractors?.filter(c => c.status === "active").length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">YTD Payments ({currentYear})</div>
              <div className="text-2xl font-bold text-primary">${totalYTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">1099 Eligible (≥$600)</div>
              <div className="text-2xl font-bold">
                {Object.values(ytdPayments || {}).filter(v => v >= 600).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">YTD Paid</TableHead>
                <TableHead>1099 Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractors?.map((contractor) => {
                const ytd = ytdPayments?.[contractor.id] || 0;
                return (
                  <TableRow key={contractor.id}>
                    <TableCell className="font-medium">
                      {contractor.first_name} {contractor.last_name}
                    </TableCell>
                    <TableCell>{contractor.business_name || "-"}</TableCell>
                    <TableCell>{contractor.email || "-"}</TableCell>
                    <TableCell>${contractor.rate.toFixed(2)}/hr</TableCell>
                    <TableCell className="text-right font-medium">
                      ${ytd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {ytd >= 600 ? (
                        <Badge className="bg-green-500">Eligible</Badge>
                      ) : (
                        <Badge variant="secondary">Under $600</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={contractor.status === "active" ? "default" : "secondary"}>
                        {contractor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="View Details"
                          onClick={() => {
                            setSelectedContractor(contractor);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Create Invoice"
                          onClick={() => {
                            setSelectedContractor(contractor);
                            setInvoiceDialogOpen(true);
                          }}
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Record Payment"
                          onClick={() => handleRecordPayment(contractor)}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(contractor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(contractor)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>

      <TabsContent value="1099s">
        <Generated1099sTable />
      </TabsContent>

      <AddContractorDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["contractors"] })}
      />

      <EditContractorDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contractor={selectedContractor}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["contractors"] })}
      />

      <Generate1099Dialog
        open={generate1099DialogOpen}
        onOpenChange={setGenerate1099DialogOpen}
      />

      {selectedContractor && (
        <ContractorInvoiceDialog
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          contractorId={selectedContractor.id}
          contractorName={`${selectedContractor.first_name} ${selectedContractor.last_name}`}
          defaultRate={selectedContractor.rate}
        />
      )}

      {/* Contractor Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedContractor?.first_name} {selectedContractor?.last_name}
              {selectedContractor?.business_name && ` - ${selectedContractor.business_name}`}
            </DialogTitle>
          </DialogHeader>
          {selectedContractor && (
            <ContractorPaymentsPanel
              contractorId={selectedContractor.id}
              contractorName={`${selectedContractor.first_name} ${selectedContractor.last_name}`}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); recordPaymentMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Contractor</Label>
              <Input disabled value={selectedContractor ? `${selectedContractor.first_name} ${selectedContractor.last_name}` : ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                required
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                required
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_year">Tax Year</Label>
              <Input
                id="tax_year"
                type="number"
                required
                value={paymentData.tax_year}
                onChange={(e) => setPaymentData({ ...paymentData, tax_year: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={paymentData.description}
                onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordPaymentMutation.isPending}>
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedContractor?.first_name} {selectedContractor?.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedContractor && deleteMutation.mutate(selectedContractor.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
