import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, CheckCircle, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
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

interface PayrollRun {
  id: string;
  run_name: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  status: string;
  total_gross_pay: number;
  total_net_pay: number;
  total_taxes: number;
  total_deductions: number;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  pay_rate: number;
  pay_type: string;
  tax_withholding_allowances: number;
}

interface PayrollRunItem {
  id: string;
  employee_id: string;
  hours_worked: number;
  regular_hours: number;
  overtime_hours: number;
  gross_pay: number;
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
  benefit_deductions: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  employees?: {
    first_name: string;
    last_name: string;
  };
}

export default function PayrollRuns() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [formData, setFormData] = useState({
    run_name: "",
    pay_period_start: "",
    pay_period_end: "",
    pay_date: "",
    notes: ""
  });
  const [editFormData, setEditFormData] = useState({
    run_name: "",
    pay_period_start: "",
    pay_period_end: "",
    pay_date: "",
    notes: ""
  });
  const queryClient = useQueryClient();

  const { data: payrollRuns, isLoading } = useQuery({
    queryKey: ["payroll_runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_runs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PayrollRun[];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees_for_payroll"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      return data as Employee[];
    },
  });

  const { data: runItems } = useQuery({
    queryKey: ["payroll_run_items", selectedRun?.id],
    queryFn: async () => {
      if (!selectedRun) return [];
      const { data, error } = await supabase
        .from("payroll_run_items")
        .select("*, employees(first_name, last_name)")
        .eq("payroll_run_id", selectedRun.id);
      if (error) throw error;
      return data as PayrollRunItem[];
    },
    enabled: !!selectedRun && reviewDialogOpen,
  });

  const createPayrollRunMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!employees || employees.length === 0) {
        throw new Error("No active employees found");
      }

      // Get approved timesheets for the pay period
      const { data: timesheets } = await supabase
        .from("timesheets")
        .select("*, employees(*)")
        .eq("status", "approved")
        .gte("period_end", formData.pay_period_start)
        .lte("period_start", formData.pay_period_end);

      let totalGross = 0;
      let totalNet = 0;
      let totalTaxes = 0;
      let totalDeductions = 0;

      const runItems = employees.map((emp) => {
        // Find timesheet for this employee
        const employeeTimesheet = timesheets?.find(ts => ts.employee_id === emp.id);
        const hoursWorked = employeeTimesheet?.total_hours || 0;
        const regularHours = employeeTimesheet?.regular_hours || 0;
        const overtimeHours = employeeTimesheet?.overtime_hours || 0;

        const regularPay = emp.pay_type === "hourly" 
          ? emp.pay_rate * regularHours
          : emp.pay_rate / 26; // Bi-weekly for salary

        const overtimePay = emp.pay_type === "hourly"
          ? emp.pay_rate * 1.5 * overtimeHours
          : 0;

        const grossPay = regularPay + overtimePay;

        // Simple tax calculations
        const federalTax = grossPay * 0.15;
        const stateTax = grossPay * 0.05;
        const socialSecurity = grossPay * 0.062;
        const medicare = grossPay * 0.0145;
        
        const deductions = federalTax + stateTax + socialSecurity + medicare;
        const netPay = grossPay - deductions;

        totalGross += grossPay;
        totalNet += netPay;
        totalTaxes += (federalTax + stateTax + socialSecurity + medicare);
        totalDeductions += deductions;

        return {
          employee_id: emp.id,
          hours_worked: hoursWorked,
          regular_hours: regularHours,
          overtime_hours: overtimeHours,
          gross_pay: grossPay,
          federal_tax: federalTax,
          state_tax: stateTax,
          social_security: socialSecurity,
          medicare: medicare,
          benefit_deductions: 0,
          other_deductions: 0,
          total_deductions: deductions,
          net_pay: netPay
        };
      });

      // Create payroll run
      const { data: run, error: runError } = await supabase
        .from("payroll_runs")
        .insert({
          user_id: user.id,
          run_name: formData.run_name,
          pay_period_start: formData.pay_period_start,
          pay_period_end: formData.pay_period_end,
          pay_date: formData.pay_date,
          notes: formData.notes,
          total_gross_pay: totalGross,
          total_net_pay: totalNet,
          total_taxes: totalTaxes,
          total_deductions: totalDeductions,
          status: "draft"
        })
        .select()
        .single();

      if (runError) throw runError;

      // Create run items
      const itemsWithRunId = runItems.map(item => ({
        ...item,
        payroll_run_id: run.id
      }));

      const { error: itemsError } = await supabase
        .from("payroll_run_items")
        .insert(itemsWithRunId);

      if (itemsError) throw itemsError;

      // Accrue PTO for all employees in this payroll run
      for (const employee of employees) {
        await supabase.rpc("accrue_pto_for_payroll", {
          p_employee_id: employee.id,
          p_user_id: user.id,
        });
      }

      return run;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
      toast.success("Payroll run created successfully");
      setCreateDialogOpen(false);
      setFormData({
        run_name: "",
        pay_period_start: "",
        pay_period_end: "",
        pay_date: "",
        notes: ""
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const approvePayrollMutation = useMutation({
    mutationFn: async (runId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("payroll_runs")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", runId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
      toast.success("Payroll run approved successfully");
      setReviewDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const processPayrollMutation = useMutation({
    mutationFn: async (runId: string) => {
      const { error } = await supabase
        .from("payroll_runs")
        .update({
          status: "processed",
          processed_at: new Date().toISOString()
        })
        .eq("id", runId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
      toast.success("Payroll run processed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deletePayrollMutation = useMutation({
    mutationFn: async (runId: string) => {
      const { error } = await supabase
        .from("payroll_runs")
        .delete()
        .eq("id", runId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
      toast.success("Payroll run deleted successfully");
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updatePayrollMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRun) throw new Error("No payroll run selected");

      const { error } = await supabase
        .from("payroll_runs")
        .update({
          run_name: editFormData.run_name,
          pay_period_start: editFormData.pay_period_start,
          pay_period_end: editFormData.pay_period_end,
          pay_date: editFormData.pay_date,
          notes: editFormData.notes
        })
        .eq("id", selectedRun.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
      toast.success("Payroll run updated successfully");
      setEditDialogOpen(false);
      setSelectedRun(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleReview = (run: PayrollRun) => {
    setSelectedRun(run);
    setReviewDialogOpen(true);
  };

  const handleDelete = (run: PayrollRun) => {
    setSelectedRun(run);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (run: PayrollRun) => {
    setSelectedRun(run);
    setEditFormData({
      run_name: run.run_name,
      pay_period_start: run.pay_period_start,
      pay_period_end: run.pay_period_end,
      pay_date: run.pay_date,
      notes: ""
    });
    setEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "approved":
        return "default";
      case "processed":
        return "default";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4">Loading payroll runs...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Payroll Runs</h1>
            <p className="text-muted-foreground">Create and manage payroll runs for your team</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Payroll Run
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payroll History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run Name</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Pay Date</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRuns?.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">{run.run_name}</TableCell>
                    <TableCell>
                      {format(new Date(run.pay_period_start), "MMM d")} - {format(new Date(run.pay_period_end), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{format(new Date(run.pay_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>${run.total_gross_pay?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>${run.total_net_pay?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(run.status)}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(run)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {run.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(run)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(run)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Payroll Run</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createPayrollRunMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="run_name">Run Name *</Label>
                <Input
                  id="run_name"
                  required
                  value={formData.run_name}
                  onChange={(e) => setFormData({ ...formData, run_name: e.target.value })}
                  placeholder="e.g., Bi-weekly Payroll - Dec 2024"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pay_period_start">Period Start *</Label>
                  <Input
                    id="pay_period_start"
                    type="date"
                    required
                    value={formData.pay_period_start}
                    onChange={(e) => setFormData({ ...formData, pay_period_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay_period_end">Period End *</Label>
                  <Input
                    id="pay_period_end"
                    type="date"
                    required
                    value={formData.pay_period_end}
                    onChange={(e) => setFormData({ ...formData, pay_period_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_date">Pay Date *</Label>
                <Input
                  id="pay_date"
                  type="date"
                  required
                  value={formData.pay_date}
                  onChange={(e) => setFormData({ ...formData, pay_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special notes for this payroll run"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPayrollRunMutation.isPending}>
                  Create Payroll Run
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Review Payroll Run</DialogTitle>
            </DialogHeader>
            {selectedRun && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Run Name</p>
                    <p className="font-medium">{selectedRun.run_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getStatusColor(selectedRun.status)}>
                      {selectedRun.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pay Period</p>
                    <p className="font-medium">
                      {format(new Date(selectedRun.pay_period_start), "MMM d")} - {format(new Date(selectedRun.pay_period_end), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pay Date</p>
                    <p className="font-medium">{format(new Date(selectedRun.pay_date), "MMM d, yyyy")}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Pay</p>
                      <p className="text-lg font-bold">${selectedRun.total_gross_pay?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Taxes</p>
                      <p className="text-lg font-bold text-red-600">${selectedRun.total_taxes?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Deductions</p>
                      <p className="text-lg font-bold text-orange-600">${selectedRun.total_deductions?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Pay</p>
                      <p className="text-lg font-bold text-green-600">${selectedRun.total_net_pay?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>

                {runItems && runItems.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Employee Breakdown</h3>
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Gross Pay</TableHead>
                            <TableHead>Taxes</TableHead>
                            <TableHead>Net Pay</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {runItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.employees?.first_name} {item.employees?.last_name}
                              </TableCell>
                              <TableCell>{item.hours_worked?.toFixed(1) || '0'}</TableCell>
                              <TableCell>${item.gross_pay?.toFixed(2) || '0.00'}</TableCell>
                              <TableCell className="text-red-600">
                                ${((item.federal_tax || 0) + (item.state_tax || 0) + (item.social_security || 0) + (item.medicare || 0)).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-green-600">${item.net_pay?.toFixed(2) || '0.00'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {selectedRun.status === "draft" && (
                    <Button onClick={() => approvePayrollMutation.mutate(selectedRun.id)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                  {selectedRun.status === "approved" && (
                    <Button onClick={() => processPayrollMutation.mutate(selectedRun.id)}>
                      Process Payment
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payroll Run</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedRun?.run_name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedRun && deletePayrollMutation.mutate(selectedRun.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Payroll Run</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); updatePayrollMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_run_name">Run Name *</Label>
                <Input
                  id="edit_run_name"
                  required
                  value={editFormData.run_name}
                  onChange={(e) => setEditFormData({ ...editFormData, run_name: e.target.value })}
                  placeholder="e.g., Bi-weekly Payroll - Dec 2024"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_pay_period_start">Period Start *</Label>
                  <Input
                    id="edit_pay_period_start"
                    type="date"
                    required
                    value={editFormData.pay_period_start}
                    onChange={(e) => setEditFormData({ ...editFormData, pay_period_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_pay_period_end">Period End *</Label>
                  <Input
                    id="edit_pay_period_end"
                    type="date"
                    required
                    value={editFormData.pay_period_end}
                    onChange={(e) => setEditFormData({ ...editFormData, pay_period_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_pay_date">Pay Date *</Label>
                <Input
                  id="edit_pay_date"
                  type="date"
                  required
                  value={editFormData.pay_date}
                  onChange={(e) => setEditFormData({ ...editFormData, pay_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Any special notes for this payroll run"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePayrollMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
