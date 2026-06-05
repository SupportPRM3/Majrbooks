import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";

interface CreateTimesheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateTimesheetDialog({ open, onOpenChange, onSuccess }: CreateTimesheetDialogProps) {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [periodType, setPeriodType] = useState<"weekly" | "biweekly">("weekly");
  const [periodStart, setPeriodStart] = useState(format(startOfWeek(new Date()), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ["employees_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const handlePeriodStartChange = (date: string) => {
    setPeriodStart(date);
  };

  const calculatePeriodEnd = () => {
    const start = new Date(periodStart);
    const end = periodType === "weekly" 
      ? endOfWeek(start)
      : endOfWeek(addWeeks(start, 1));
    return format(end, "yyyy-MM-dd");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!selectedEmployee) {
        throw new Error("Please select an employee");
      }

      const { error } = await supabase.from("timesheets").insert({
        user_id: user.id,
        employee_id: selectedEmployee,
        period_start: periodStart,
        period_end: calculatePeriodEnd(),
        project_id: selectedProject || null,
        status: "draft"
      });

      if (error) throw error;

      toast.success("Timesheet created successfully");
      onSuccess();
      onOpenChange(false);
      setSelectedEmployee("");
      setSelectedProject("");
      setPeriodStart(format(startOfWeek(new Date()), "yyyy-MM-dd"));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Timesheet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employee *</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
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
            <Label htmlFor="project">Project (Optional)</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period_type">Period Type</Label>
            <Select value={periodType} onValueChange={(value: "weekly" | "biweekly") => setPeriodType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period_start">Period Start Date *</Label>
            <Input
              id="period_start"
              type="date"
              required
              value={periodStart}
              onChange={(e) => handlePeriodStartChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Period End Date</Label>
            <Input
              type="date"
              disabled
              value={calculatePeriodEnd()}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Timesheet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
