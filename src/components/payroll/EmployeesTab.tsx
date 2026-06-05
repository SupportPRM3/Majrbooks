import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { EditEmployeeDialog } from "./EditEmployeeDialog";
import { EmployeePayConfigDialog } from "./EmployeePayConfigDialog";
import { PayScheduleManager } from "./PayScheduleManager";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Settings } from "lucide-react";
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

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  pay_type: string;
  pay_rate: number;
  tax_withholding_allowances: number;
  hire_date: string | null;
  status: string;
}

export const EmployeesTab = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [payConfigEmployee, setPayConfigEmployee] = useState<Employee | null>(null);
  const [payConfigDialogOpen, setPayConfigDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (employeeId: string) => {
    setEmployeeToDelete(employeeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeToDelete);

      if (error) throw error;

      toast({
        title: "Employee deleted",
        description: "Employee has been successfully deleted.",
      });

      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading employees...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pay Schedules Section */}
      <PayScheduleManager />

      {/* Employees Section */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Employee Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage your employees, their payroll information, and tax withholdings
          </p>
        </div>
        <AddEmployeeDialog onEmployeeAdded={fetchEmployees} />
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No employees yet. Add your first employee to get started.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Pay Type</TableHead>
                <TableHead>Pay Rate</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell>{employee.email || "-"}</TableCell>
                  <TableCell>{employee.phone || "-"}</TableCell>
                  <TableCell className="capitalize">{employee.pay_type}</TableCell>
                  <TableCell>
                    ${employee.pay_rate.toLocaleString()}/{employee.pay_type === "hourly" ? "hr" : "yr"}
                  </TableCell>
                  <TableCell>{employee.tax_withholding_allowances}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Pay Configuration"
                        onClick={() => {
                          setPayConfigEmployee(employee);
                          setPayConfigDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(employee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditEmployeeDialog
        employee={editingEmployee}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onEmployeeUpdated={fetchEmployees}
      />

      {payConfigEmployee && (
        <EmployeePayConfigDialog
          open={payConfigDialogOpen}
          onOpenChange={setPayConfigDialogOpen}
          employeeId={payConfigEmployee.id}
          employeeName={`${payConfigEmployee.first_name} ${payConfigEmployee.last_name}`}
          payType={payConfigEmployee.pay_type}
          payRate={payConfigEmployee.pay_rate}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};