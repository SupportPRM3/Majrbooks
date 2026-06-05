import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
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

interface PaySchedule {
  id: string;
  name: string;
  frequency: string;
  pay_day: number | null;
  second_pay_day: number | null;
  is_default: boolean;
}

export function PayScheduleManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PaySchedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    frequency: "biweekly",
    pay_day: "",
    second_pay_day: "",
    is_default: false
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["pay-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pay_schedules")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as PaySchedule[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const scheduleData = {
        user_id: user.id,
        name: formData.name,
        frequency: formData.frequency,
        pay_day: formData.pay_day ? parseInt(formData.pay_day) : null,
        second_pay_day: formData.second_pay_day ? parseInt(formData.second_pay_day) : null,
        is_default: formData.is_default
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from("pay_schedules")
          .update(scheduleData)
          .eq("id", editingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pay_schedules")
          .insert(scheduleData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pay-schedules"] });
      toast.success(editingSchedule ? "Schedule updated" : "Schedule created");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pay_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pay-schedules"] });
      toast.success("Schedule deleted");
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setFormData({ name: "", frequency: "biweekly", pay_day: "", second_pay_day: "", is_default: false });
    setEditingSchedule(null);
    setDialogOpen(false);
  };

  const handleEdit = (schedule: PaySchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      frequency: schedule.frequency,
      pay_day: schedule.pay_day?.toString() || "",
      second_pay_day: schedule.second_pay_day?.toString() || "",
      is_default: schedule.is_default
    });
    setDialogOpen(true);
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      "semi-monthly": "Semi-monthly",
      monthly: "Monthly"
    };
    return labels[freq] || freq;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Pay Schedules
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSchedule ? "Edit" : "Create"} Pay Schedule</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Schedule Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard Bi-weekly"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(val) => setFormData({ ...formData, frequency: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="semi-monthly">Semi-monthly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_day">
                  Pay Day {formData.frequency === "weekly" || formData.frequency === "biweekly" ? "(1-7, Mon-Sun)" : "(1-31)"}
                </Label>
                <Input
                  id="pay_day"
                  type="number"
                  min={1}
                  max={formData.frequency === "weekly" || formData.frequency === "biweekly" ? 7 : 31}
                  value={formData.pay_day}
                  onChange={(e) => setFormData({ ...formData, pay_day: e.target.value })}
                />
              </div>
              {formData.frequency === "semi-monthly" && (
                <div className="space-y-2">
                  <Label htmlFor="second_pay_day">Second Pay Day (1-31)</Label>
                  <Input
                    id="second_pay_day"
                    type="number"
                    min={1}
                    max={31}
                    value={formData.second_pay_day}
                    onChange={(e) => setFormData({ ...formData, second_pay_day: e.target.value })}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : schedules?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pay schedules defined. Create one to assign to employees.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Pay Day(s)</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules?.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.name}</TableCell>
                  <TableCell>{getFrequencyLabel(schedule.frequency)}</TableCell>
                  <TableCell>
                    {schedule.pay_day}
                    {schedule.second_pay_day && `, ${schedule.second_pay_day}`}
                  </TableCell>
                  <TableCell>
                    {schedule.is_default && <Badge>Default</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(schedule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setScheduleToDelete(schedule.id); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? Employees using this schedule will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => scheduleToDelete && deleteMutation.mutate(scheduleToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}