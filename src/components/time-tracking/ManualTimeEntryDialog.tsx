import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";

interface ManualTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ManualTimeEntryDialog({
  open,
  onOpenChange,
  onSuccess,
}: ManualTimeEntryDialogProps) {
  const queryClient = useQueryClient();
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [projectId, setProjectId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [breakMinutes, setBreakMinutes] = useState(0);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client_name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, client_name")
        .eq("status", "active")
        .order("client_name");
      if (error) throw error;
      return data;
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get or create employee
      let { data: employees } = await supabase
        .from("employees")
        .select("id")
        .eq("status", "active")
        .eq("user_id", user.id)
        .limit(1);

      let employeeId: string;

      if (!employees || employees.length === 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();

        const nameParts = (profile?.full_name || "Employee").split(" ");
        const { data: newEmployee, error: employeeError } = await supabase
          .from("employees")
          .insert({
            user_id: user.id,
            first_name: nameParts[0] || "Employee",
            last_name: nameParts.slice(1).join(" ") || "User",
            email: profile?.email || user.email,
            status: "active",
            pay_type: "hourly",
            pay_rate: 0,
          })
          .select("id")
          .single();

        if (employeeError) throw employeeError;
        employeeId = newEmployee.id;
      } else {
        employeeId = employees[0].id;
      }

      // Calculate times
      const clockIn = new Date(`${entryDate}T${startTime}:00`);
      const clockOut = new Date(`${entryDate}T${endTime}:00`);
      const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60) - breakMinutes;
      const totalHours = totalMinutes / 60;

      // Get or create timesheet for the week
      const entryDateObj = new Date(entryDate);
      const dayOfWeek = entryDateObj.getDay();
      const startOfWeek = new Date(entryDateObj);
      startOfWeek.setDate(entryDateObj.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      let { data: timesheet } = await supabase
        .from("timesheets")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("period_start", format(startOfWeek, "yyyy-MM-dd"))
        .maybeSingle();

      if (!timesheet) {
        const { data: newTimesheet, error: timesheetError } = await supabase
          .from("timesheets")
          .insert({
            user_id: user.id,
            employee_id: employeeId,
            period_start: format(startOfWeek, "yyyy-MM-dd"),
            period_end: format(endOfWeek, "yyyy-MM-dd"),
            project_id: projectId || null,
          })
          .select()
          .single();

        if (timesheetError) throw timesheetError;
        timesheet = newTimesheet;
      }

      // Create time entry
      const { error } = await supabase.from("time_entries").insert({
        timesheet_id: timesheet.id,
        employee_id: employeeId,
        entry_date: entryDate,
        clock_in: clockIn.toISOString(),
        clock_out: clockOut.toISOString(),
        break_minutes: breakMinutes,
        total_hours: totalHours,
        is_billable: isBillable,
        project_id: projectId || null,
        notes,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast.success("Time entry created successfully");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setEntryDate(format(new Date(), "yyyy-MM-dd"));
    setStartTime("09:00");
    setEndTime("17:00");
    setProjectId("");
    setNotes("");
    setIsBillable(true);
    setBreakMinutes(0);
  };

  const calculateHours = () => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60) - breakMinutes;
    return (totalMinutes / 60).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Time Manually</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Date</Label>
              <Input
                id="entryDate"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project (Optional)</Label>
              <Select value={projectId || "none"} onValueChange={(val) => setProjectId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakMinutes">Break (min)</Label>
              <Input
                id="breakMinutes"
                type="number"
                min="0"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Total Hours:</span>
            <span className="text-lg font-bold text-primary">{calculateHours()} hrs</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="What did you work on?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="billable">Billable</Label>
              <p className="text-xs text-muted-foreground">This time will be available for invoicing</p>
            </div>
            <Switch
              id="billable"
              checked={isBillable}
              onCheckedChange={setIsBillable}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createEntryMutation.mutate()}
              disabled={createEntryMutation.isPending}
            >
              {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
