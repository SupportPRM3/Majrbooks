import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, Send } from "lucide-react";
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import ApproveTimeEntryDialog from "./ApproveTimeEntryDialog";
import RejectTimeEntryDialog from "./RejectTimeEntryDialog";

interface TimesheetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timesheet: any;
}

interface TimeEntry {
  id: string;
  entry_date: string;
  clock_in: string;
  clock_out: string | null;
  break_minutes: number;
  total_hours: number;
  is_overtime: boolean;
  is_billable: boolean;
  approval_status: string;
  notes: string | null;
  employees?: {
    first_name: string;
    last_name: string;
  };
}

export default function TimesheetDetailDialog({ open, onOpenChange, timesheet }: TimesheetDetailDialogProps) {
  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    clockIn: "09:00",
    clockOut: "17:00",
    breakMinutes: 30,
    notes: ""
  });
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<TimeEntry | null>(null);
  const queryClient = useQueryClient();

  const { data: timeEntries } = useQuery({
    queryKey: ["time_entries", timesheet?.id],
    queryFn: async () => {
      if (!timesheet) return [];
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name
          )
        `)
        .eq("timesheet_id", timesheet.id)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data as TimeEntry[];
    },
    enabled: !!timesheet,
  });

  const addEntryMutation = useMutation({
    mutationFn: async () => {
      if (!timesheet) throw new Error("No timesheet selected");

      const clockInTime = new Date(`${newEntry.date}T${newEntry.clockIn}:00`);
      const clockOutTime = new Date(`${newEntry.date}T${newEntry.clockOut}:00`);
      
      const totalMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / 60000;
      const workMinutes = totalMinutes - newEntry.breakMinutes;
      const totalHours = workMinutes / 60;
      const isOvertime = totalHours > 8;

      const { error } = await supabase.from("time_entries").insert({
        timesheet_id: timesheet.id,
        employee_id: timesheet.employee_id,
        entry_date: newEntry.date,
        clock_in: clockInTime.toISOString(),
        clock_out: clockOutTime.toISOString(),
        break_minutes: newEntry.breakMinutes,
        total_hours: totalHours,
        is_overtime: isOvertime,
        notes: newEntry.notes
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries", timesheet?.id] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast.success("Time entry added");
      setNewEntry({
        date: format(new Date(), "yyyy-MM-dd"),
        clockIn: "09:00",
        clockOut: "17:00",
        breakMinutes: 30,
        notes: ""
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries", timesheet?.id] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast.success("Time entry deleted");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const submitTimesheetMutation = useMutation({
    mutationFn: async () => {
      if (!timesheet) throw new Error("No timesheet selected");

      const { error } = await supabase
        .from("timesheets")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString()
        })
        .eq("id", timesheet.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast.success("Timesheet submitted for approval");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  if (!timesheet) return null;

  const canEdit = timesheet.status === "draft" || timesheet.status === "rejected";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Timesheet Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Employee</p>
              <p className="font-medium">{timesheet.employees.first_name} {timesheet.employees.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{timesheet.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="font-medium">
                {format(new Date(timesheet.period_start), "MMM d")} - {format(new Date(timesheet.period_end), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="font-bold text-lg">{timesheet.total_hours.toFixed(2)}</p>
            </div>
          </div>

          {canEdit && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Add Time Entry</h3>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="clockIn">Clock In</Label>
                  <Input
                    id="clockIn"
                    type="time"
                    value={newEntry.clockIn}
                    onChange={(e) => setNewEntry({ ...newEntry, clockIn: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="clockOut">Clock Out</Label>
                  <Input
                    id="clockOut"
                    type="time"
                    value={newEntry.clockOut}
                    onChange={(e) => setNewEntry({ ...newEntry, clockOut: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="break">Break (min)</Label>
                  <Input
                    id="break"
                    type="number"
                    value={newEntry.breakMinutes}
                    onChange={(e) => setNewEntry({ ...newEntry, breakMinutes: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={() => addEntryMutation.mutate()} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Time Entries</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.entry_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(entry.clock_in), "h:mm a")}</TableCell>
                    <TableCell>
                      {entry.clock_out ? format(new Date(entry.clock_out), "h:mm a") : "In Progress"}
                    </TableCell>
                    <TableCell>{entry.break_minutes} min</TableCell>
                    <TableCell className="font-semibold">{entry.total_hours.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.is_overtime ? "destructive" : "default"}>
                        {entry.is_overtime ? "OT" : "REG"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        entry.approval_status === "approved" ? "default" :
                        entry.approval_status === "rejected" ? "destructive" :
                        "secondary"
                      }>
                        {entry.approval_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteEntryMutation.mutate(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {entry.approval_status === "pending" && !canEdit && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedTimeEntry(entry);
                                setApproveDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedTimeEntry(entry);
                                setRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => submitTimesheetMutation.mutate()}>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            </div>
          )}
        </div>

        <ApproveTimeEntryDialog
          open={approveDialogOpen}
          onOpenChange={setApproveDialogOpen}
          timeEntry={selectedTimeEntry}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["time_entries", timesheet?.id] })}
        />

        <RejectTimeEntryDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          timeEntry={selectedTimeEntry}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["time_entries", timesheet?.id] })}
        />
      </DialogContent>
    </Dialog>
  );
}
