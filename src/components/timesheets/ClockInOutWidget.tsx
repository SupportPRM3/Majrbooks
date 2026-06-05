import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";

export default function ClockInOutWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());
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
        .select("*")
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const clockInMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get or create active employee
      let { data: employees } = await supabase
        .from("employees")
        .select("id")
        .eq("status", "active")
        .eq("user_id", user.id)
        .limit(1);

      let employeeId: string;

      if (!employees || employees.length === 0) {
        // Get user profile info
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();

        // Auto-create employee record
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
            pay_rate: 0
          })
          .select("id")
          .single();

        if (employeeError) throw employeeError;
        employeeId = newEmployee.id;
      } else {
        employeeId = employees[0].id;
      }

      // Get or create current week's timesheet
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
            period_end: format(endOfWeek, "yyyy-MM-dd")
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
        clock_in: new Date().toISOString()
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active_time_entry"] });
      toast.success("Clocked in successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!activeEntry) throw new Error("No active time entry");

      const clockOutTime = new Date();
      const clockInTime = new Date(activeEntry.clock_in);
      const totalMinutes = differenceInMinutes(clockOutTime, clockInTime);
      const totalHours = (totalMinutes - activeEntry.break_minutes) / 60;

      // Determine if overtime (over 8 hours in a day)
      const isOvertime = totalHours > 8;

      const { error } = await supabase
        .from("time_entries")
        .update({
          clock_out: clockOutTime.toISOString(),
          total_hours: totalHours,
          is_overtime: isOvertime
        })
        .eq("id", activeEntry.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active_time_entry"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast.success("Clocked out successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const getElapsedTime = () => {
    if (!activeEntry) return "00:00:00";
    
    const clockInTime = new Date(activeEntry.clock_in);
    const diff = differenceInMinutes(currentTime, clockInTime);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Clock
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{format(currentTime, "h:mm:ss a")}</p>
            <p className="text-sm text-muted-foreground">{format(currentTime, "EEEE, MMMM d, yyyy")}</p>
            {activeEntry && (
              <p className="text-sm font-medium mt-2">
                Time Elapsed: <span className="text-primary">{getElapsedTime()}</span>
              </p>
            )}
          </div>
          <div>
            {!activeEntry ? (
              <Button
                size="lg"
                onClick={() => clockInMutation.mutate()}
                disabled={clockInMutation.isPending}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Clock In
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                onClick={() => clockOutMutation.mutate()}
                disabled={clockOutMutation.isPending}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Clock Out
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
