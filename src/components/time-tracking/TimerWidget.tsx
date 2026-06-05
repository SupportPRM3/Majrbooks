import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInSeconds } from "date-fns";

interface TimerWidgetProps {
  onTimerStop?: () => void;
}

export default function TimerWidget({ onTimerStop }: TimerWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [projectId, setProjectId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: activeEntry } = useQuery({
    queryKey: ["active_time_entry"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("time_entries")
        .select("*, projects(name)")
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 1000,
  });

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

  const startTimerMutation = useMutation({
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

      // Get or create timesheet
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
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
        entry_date: format(today, "yyyy-MM-dd"),
        clock_in: new Date().toISOString(),
        project_id: projectId || null,
        notes: notes || null,
        is_billable: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active_time_entry"] });
      toast.success("Timer started");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: async () => {
      if (!activeEntry) throw new Error("No active time entry");

      const clockOutTime = new Date();
      const clockInTime = new Date(activeEntry.clock_in);
      const totalSeconds = differenceInSeconds(clockOutTime, clockInTime);
      const totalHours = totalSeconds / 3600;

      const { error } = await supabase
        .from("time_entries")
        .update({
          clock_out: clockOutTime.toISOString(),
          total_hours: totalHours,
          is_overtime: totalHours > 8,
        })
        .eq("id", activeEntry.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active_time_entry"] });
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast.success("Timer stopped");
      setNotes("");
      setProjectId("");
      onTimerStop?.();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const getElapsedTime = () => {
    if (!activeEntry) return "00:00:00";
    
    const clockInTime = new Date(activeEntry.clock_in);
    const diff = differenceInSeconds(currentTime, clockInTime);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={activeEntry ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Timer Display */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${activeEntry ? "bg-green-500 animate-pulse" : "bg-muted"}`}>
              <Clock className={`h-5 w-5 ${activeEntry ? "text-white" : "text-muted-foreground"}`} />
            </div>
            <div className="text-2xl font-mono font-bold">
              {getElapsedTime()}
            </div>
          </div>

          {/* Project & Notes */}
          {!activeEntry && (
            <div className="flex-1 flex items-center gap-3">
              <Select value={projectId || "none"} onValueChange={(val) => setProjectId(val === "none" ? "" : val)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="What are you working on?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1"
              />
            </div>
          )}

          {activeEntry && (
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Working on: <span className="font-medium text-foreground">{activeEntry.projects?.name || "General"}</span>
              </p>
              {activeEntry.notes && (
                <p className="text-sm text-muted-foreground">{activeEntry.notes}</p>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!activeEntry ? (
              <Button
                onClick={() => startTimerMutation.mutate()}
                disabled={startTimerMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            ) : (
              <Button
                onClick={() => stopTimerMutation.mutate()}
                disabled={stopTimerMutation.isPending}
                variant="destructive"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
