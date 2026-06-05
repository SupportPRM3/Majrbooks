import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, DollarSign, Calendar, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  client_name: string;
}

interface PayrollRecord {
  id: string;
  employee_name: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  gross_pay: number;
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
  other_deductions: number;
  net_pay: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const Payroll = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);

  // Form states
  const [employeeName, setEmployeeName] = useState("");
  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [grossPay, setGrossPay] = useState("");
  const [federalTax, setFederalTax] = useState("");
  const [stateTax, setStateTax] = useState("");
  const [socialSecurity, setSocialSecurity] = useState("");
  const [medicare, setMedicare] = useState("");
  const [otherDeductions, setOtherDeductions] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user || !clientId) {
      navigate("/dashboard");
      return;
    }

    loadPayrollData();

    // Real-time subscription
    const channel = supabase
      .channel('payroll-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payroll',
          filter: `client_id=eq.${clientId}`
        },
        () => {
          loadPayrollData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, clientId]);

  const loadPayrollData = async () => {
    if (!user || !clientId) return;

    setLoading(true);
    try {
      // Load client details
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, client_name")
        .eq("id", clientId)
        .eq("user_id", user.id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Load payroll records
      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select("*")
        .eq("client_id", clientId)
        .eq("user_id", user.id)
        .order("pay_date", { ascending: false });

      if (payrollError) throw payrollError;
      setPayrollRecords(payrollData || []);
    } catch (error) {
      console.error("Error loading payroll data:", error);
      toast({
        title: "Error",
        description: "Failed to load payroll data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNetPay = () => {
    const gross = parseFloat(grossPay) || 0;
    const fedTax = parseFloat(federalTax) || 0;
    const stTax = parseFloat(stateTax) || 0;
    const ss = parseFloat(socialSecurity) || 0;
    const med = parseFloat(medicare) || 0;
    const other = parseFloat(otherDeductions) || 0;
    return gross - fedTax - stTax - ss - med - other;
  };

  const resetForm = () => {
    setEmployeeName("");
    setPayPeriodStart("");
    setPayPeriodEnd("");
    setPayDate("");
    setGrossPay("");
    setFederalTax("");
    setStateTax("");
    setSocialSecurity("");
    setMedicare("");
    setOtherDeductions("");
    setStatus("draft");
    setNotes("");
    setEditingRecord(null);
  };

  const handleOpenDialog = (record?: PayrollRecord) => {
    if (record) {
      setEditingRecord(record);
      setEmployeeName(record.employee_name);
      setPayPeriodStart(record.pay_period_start);
      setPayPeriodEnd(record.pay_period_end);
      setPayDate(record.pay_date);
      setGrossPay(record.gross_pay.toString());
      setFederalTax(record.federal_tax.toString());
      setStateTax(record.state_tax.toString());
      setSocialSecurity(record.social_security.toString());
      setMedicare(record.medicare.toString());
      setOtherDeductions(record.other_deductions.toString());
      setStatus(record.status);
      setNotes(record.notes || "");
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clientId) return;

    try {
      const netPay = calculateNetPay();
      const payrollData = {
        user_id: user.id,
        client_id: clientId,
        employee_name: employeeName,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        pay_date: payDate,
        gross_pay: parseFloat(grossPay) || 0,
        federal_tax: parseFloat(federalTax) || 0,
        state_tax: parseFloat(stateTax) || 0,
        social_security: parseFloat(socialSecurity) || 0,
        medicare: parseFloat(medicare) || 0,
        other_deductions: parseFloat(otherDeductions) || 0,
        net_pay: netPay,
        status,
        notes: notes || null,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from("payroll")
          .update(payrollData)
          .eq("id", editingRecord.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Payroll record updated successfully",
        });
      } else {
        const { error } = await supabase.from("payroll").insert([payrollData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Payroll record created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      loadPayrollData();
    } catch (error) {
      console.error("Error saving payroll:", error);
      toast({
        title: "Error",
        description: "Failed to save payroll record",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payroll record?")) return;

    try {
      const { error } = await supabase.from("payroll").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payroll record deleted successfully",
      });
      loadPayrollData();
    } catch (error) {
      console.error("Error deleting payroll:", error);
      toast({
        title: "Error",
        description: "Failed to delete payroll record",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
      processed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
    return variants[status] || variants.draft;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading payroll data…</p>
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Client not found</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(`/client/${clientId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Payroll</h1>
              <p className="text-muted-foreground">{client.client_name}</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payroll Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRecord ? "Edit" : "Add"} Payroll Record</DialogTitle>
                <DialogDescription>
                  {editingRecord ? "Update" : "Create a new"} payroll record for this client
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="employeeName">Employee Name *</Label>
                    <Input
                      id="employeeName"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payPeriodStart">Pay Period Start *</Label>
                    <Input
                      id="payPeriodStart"
                      type="date"
                      value={payPeriodStart}
                      onChange={(e) => setPayPeriodStart(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payPeriodEnd">Pay Period End *</Label>
                    <Input
                      id="payPeriodEnd"
                      type="date"
                      value={payPeriodEnd}
                      onChange={(e) => setPayPeriodEnd(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payDate">Pay Date *</Label>
                    <Input
                      id="payDate"
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="grossPay">Gross Pay *</Label>
                    <Input
                      id="grossPay"
                      type="number"
                      step="0.01"
                      value={grossPay}
                      onChange={(e) => setGrossPay(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="federalTax">Federal Tax</Label>
                    <Input
                      id="federalTax"
                      type="number"
                      step="0.01"
                      value={federalTax}
                      onChange={(e) => setFederalTax(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stateTax">State Tax</Label>
                    <Input
                      id="stateTax"
                      type="number"
                      step="0.01"
                      value={stateTax}
                      onChange={(e) => setStateTax(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="socialSecurity">Social Security</Label>
                    <Input
                      id="socialSecurity"
                      type="number"
                      step="0.01"
                      value={socialSecurity}
                      onChange={(e) => setSocialSecurity(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medicare">Medicare</Label>
                    <Input
                      id="medicare"
                      type="number"
                      step="0.01"
                      value={medicare}
                      onChange={(e) => setMedicare(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="otherDeductions">Other Deductions</Label>
                    <Input
                      id="otherDeductions"
                      type="number"
                      step="0.01"
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Net Pay (Calculated)</Label>
                    <div className="text-2xl font-bold text-primary mt-2">
                      ${calculateNetPay().toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{editingRecord ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Payroll Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payroll Records
            </CardTitle>
            <CardDescription>
              {payrollRecords.length === 0
                ? "No payroll records found"
                : `${payrollRecords.length} payroll record${payrollRecords.length !== 1 ? "s" : ""} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payrollRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead>Pay Date</TableHead>
                    <TableHead className="text-right">Gross Pay</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => {
                    const totalDeductions =
                      record.federal_tax +
                      record.state_tax +
                      record.social_security +
                      record.medicare +
                      record.other_deductions;

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.employee_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(record.pay_period_start), "MMM d")}</div>
                            <div className="text-muted-foreground">
                              to {format(new Date(record.pay_period_end), "MMM d, yyyy")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(record.pay_date), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${record.gross_pay.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          -${totalDeductions.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ${record.net_pay.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(record.status)}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleOpenDialog(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(record.id)}
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
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No payroll records created yet</p>
                <p className="text-sm mt-1">Click "Add Payroll Record" to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Payroll;
