import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import AddBenefitDialog from "./AddBenefitDialog";
import EditBenefitDialog from "./EditBenefitDialog";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Benefit {
  id: string;
  benefit_name: string;
  benefit_type: string;
  provider: string | null;
  cost_employee: number;
  cost_employer: number;
  deduction_frequency: string;
  description: string | null;
  is_active: boolean;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

export default function BenefitsTab() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  const { data: benefits, isLoading } = useQuery({
    queryKey: ["benefits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Benefit[];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .eq("status", "active");
      if (error) throw error;
      return data as Employee[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("benefits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits"] });
      toast.success("Benefit deleted successfully");
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBenefit || !selectedEmployee) throw new Error("Missing required fields");

      const { error } = await supabase.from("employee_benefits").insert({
        employee_id: selectedEmployee,
        benefit_id: selectedBenefit.id,
        enrollment_date: enrollmentDate
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee enrolled successfully");
      setEnrollDialogOpen(false);
      setSelectedEmployee("");
      setEnrollmentDate(new Date().toISOString().split('T')[0]);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setEditDialogOpen(true);
  };

  const handleDelete = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setDeleteDialogOpen(true);
  };

  const handleEnroll = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setEnrollDialogOpen(true);
  };

  const calculateTotalCost = (benefit: Benefit) => {
    return benefit.cost_employee + benefit.cost_employer;
  };

  if (isLoading) {
    return <div className="p-4">Loading benefits...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Benefits Administration</h2>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Benefit
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Benefit Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Employee Cost</TableHead>
              <TableHead>Employer Cost</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {benefits?.map((benefit) => (
              <TableRow key={benefit.id}>
                <TableCell className="font-medium">{benefit.benefit_name}</TableCell>
                <TableCell className="capitalize">{benefit.benefit_type.replace('_', ' ')}</TableCell>
                <TableCell>{benefit.provider || "-"}</TableCell>
                <TableCell>${benefit.cost_employee.toFixed(2)}</TableCell>
                <TableCell>${benefit.cost_employer.toFixed(2)}</TableCell>
                <TableCell className="font-semibold">${calculateTotalCost(benefit).toFixed(2)}</TableCell>
                <TableCell className="capitalize">{benefit.deduction_frequency}</TableCell>
                <TableCell>
                  <Badge variant={benefit.is_active ? "default" : "secondary"}>
                    {benefit.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEnroll(benefit)}
                      title="Enroll Employee"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(benefit)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(benefit)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AddBenefitDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["benefits"] })}
      />

      <EditBenefitDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        benefit={selectedBenefit}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["benefits"] })}
      />

      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Employee in Benefit</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); enrollMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Benefit</Label>
              <Input disabled value={selectedBenefit?.benefit_name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrollment_date">Enrollment Date *</Label>
              <Input
                id="enrollment_date"
                type="date"
                required
                value={enrollmentDate}
                onChange={(e) => setEnrollmentDate(e.target.value)}
              />
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>Employee Deduction:</span>
                <span className="font-semibold">${selectedBenefit?.cost_employee.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Employer Contribution:</span>
                <span className="font-semibold">${selectedBenefit?.cost_employer.toFixed(2) || "0.00"}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEnrollDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={enrollMutation.isPending || !selectedEmployee}>
                Enroll Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedBenefit?.benefit_name}? This action cannot be undone and will affect all enrolled employees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedBenefit && deleteMutation.mutate(selectedBenefit.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
