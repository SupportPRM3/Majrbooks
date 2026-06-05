import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TimeEntry {
  id: string;
  entry_date: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number;
  notes: string | null;
  is_billable: boolean;
  is_overtime: boolean;
  break_minutes: number;
  project_id: string | null;
  projects: { name: string; client_name: string } | null;
}

interface TimeEntriesTableProps {
  viewMode: "day" | "week" | "month" | "all";
  selectedDate: Date;
}

export default function TimeEntriesTable({ viewMode, selectedDate }: TimeEntriesTableProps) {
  const queryClient = useQueryClient();

  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ["time_entries", viewMode, format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get employees for this user
      const { data: employees } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id);

      if (!employees || employees.length === 0) return [];

      const employeeIds = employees.map(e => e.id);

      // Calculate date range based on view mode
      let startDate: string;
      let endDate: string;
      
      if (viewMode === "day") {
        startDate = format(selectedDate, "yyyy-MM-dd");
        endDate = startDate;
      } else if (viewMode === "week") {
        const dayOfWeek = selectedDate.getDay();
        const start = new Date(selectedDate);
        start.setDate(selectedDate.getDate() - dayOfWeek);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        startDate = format(start, "yyyy-MM-dd");
        endDate = format(end, "yyyy-MM-dd");
      } else if (viewMode === "month") {
        const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        startDate = format(start, "yyyy-MM-dd");
        endDate = format(end, "yyyy-MM-dd");
      } else {
        // All - last 90 days
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 90);
        startDate = format(start, "yyyy-MM-dd");
        endDate = format(end, "yyyy-MM-dd");
      }

      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          id,
          entry_date,
          clock_in,
          clock_out,
          total_hours,
          notes,
          is_billable,
          is_overtime,
          break_minutes,
          project_id,
          projects(name, client_name)
        `)
        .in("employee_id", employeeIds)
        .gte("entry_date", startDate)
        .lte("entry_date", endDate)
        .order("entry_date", { ascending: false })
        .order("clock_in", { ascending: false });

      if (error) throw error;
      return data as TimeEntry[];
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
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast.success("Time entry deleted");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const formatTime = (isoString: string) => {
    return format(new Date(isoString), "h:mm a");
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const totalHours = timeEntries?.reduce((sum, e) => sum + Number(e.total_hours || 0), 0) || 0;
  const billableHours = timeEntries?.filter(e => e.is_billable).reduce((sum, e) => sum + Number(e.total_hours || 0), 0) || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Time Entries</CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <div>
            Total: <span className="font-bold">{formatDuration(totalHours)}</span>
          </div>
          <div>
            Billable: <span className="font-bold text-green-600">{formatDuration(billableHours)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading time entries...
                </TableCell>
              </TableRow>
            ) : timeEntries?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No time entries found. Start tracking your time!
                </TableCell>
              </TableRow>
            ) : (
              timeEntries?.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {format(new Date(entry.entry_date), "EEE, MMM d")}
                  </TableCell>
                  <TableCell>
                    {entry.projects?.name || "General"}
                    {entry.projects?.client_name && (
                      <span className="text-muted-foreground text-xs block">
                        {entry.projects.client_name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatTime(entry.clock_in)}
                    {entry.clock_out ? (
                      <> - {formatTime(entry.clock_out)}</>
                    ) : (
                      <Badge variant="default" className="ml-2 bg-green-500">Running</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {entry.clock_out ? formatDuration(entry.total_hours) : "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {entry.notes || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {entry.is_billable && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Billable
                        </Badge>
                      )}
                      {entry.is_overtime && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          OT
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.clock_out && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this time entry? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteEntryMutation.mutate(entry.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
