import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClockInOutWidget from "@/components/timesheets/ClockInOutWidget";
import CreateTimesheetDialog from "@/components/timesheets/CreateTimesheetDialog";
import TimesheetDetailDialog from "@/components/timesheets/TimesheetDetailDialog";
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

interface Timesheet {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  notes: string | null;
  employees: {
    first_name: string;
    last_name: string;
  };
}

export default function Timesheets() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const queryClient = useQueryClient();

  const { data: timesheets, isLoading } = useQuery({
    queryKey: ["timesheets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name
          )
        `)
        .order("period_start", { ascending: false });
      if (error) throw error;
      return data as Timesheet[];
    },
  });

  const { data: pendingTimesheets } = useQuery({
    queryKey: ["timesheets_pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name
          )
        `)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: true });
      if (error) throw error;
      return data as Timesheet[];
    },
  });

  const approveTimesheetMutation = useMutation({
    mutationFn: async (timesheetId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("timesheets")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", timesheetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets_pending"] });
      toast.success("Timesheet approved successfully");
      setApproveDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const rejectTimesheetMutation = useMutation({
    mutationFn: async ({ timesheetId, reason }: { timesheetId: string; reason: string }) => {
      const { error } = await supabase
        .from("timesheets")
        .update({
          status: "rejected",
          rejection_reason: reason
        })
        .eq("id", timesheetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets_pending"] });
      toast.success("Timesheet rejected");
      setRejectDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleViewDetails = (timesheet: Timesheet) => {
    toast.info(`Viewing timesheet for ${timesheet.employees.first_name} ${timesheet.employees.last_name}...`);
    setSelectedTimesheet(timesheet);
    setDetailDialogOpen(true);
  };

  const handleApprove = (timesheet: Timesheet) => {
    toast.info(`Preparing to approve timesheet...`);
    setSelectedTimesheet(timesheet);
    setApproveDialogOpen(true);
  };

  const handleReject = (timesheet: Timesheet) => {
    toast.info(`Preparing to reject timesheet...`);
    setSelectedTimesheet(timesheet);
    setRejectDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "submitted":
        return "default";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4">Loading timesheets...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Timesheets</h1>
            <p className="text-muted-foreground">Track employee hours and manage approvals</p>
          </div>
          <Button onClick={() => {
            toast.info("Creating new timesheet...");
            setCreateDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Timesheet
          </Button>
        </div>

        {/* Clock In/Out Widget */}
        <ClockInOutWidget />

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Timesheets</TabsTrigger>
            <TabsTrigger value="pending">
              Pending Approval
              {pendingTimesheets && pendingTimesheets.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingTimesheets.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Timesheets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Regular Hours</TableHead>
                      <TableHead>Overtime Hours</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets?.map((timesheet) => (
                      <TableRow key={timesheet.id}>
                        <TableCell className="font-medium">
                          {timesheet.employees.first_name} {timesheet.employees.last_name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(timesheet.period_start), "MMM d")} - {format(new Date(timesheet.period_end), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{timesheet.regular_hours.toFixed(2)}</TableCell>
                        <TableCell>{timesheet.overtime_hours.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">{timesheet.total_hours.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(timesheet.status)}>
                            {timesheet.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(timesheet)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {timesheet.status === "submitted" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(timesheet)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(timesheet)}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTimesheets?.map((timesheet) => (
                      <TableRow key={timesheet.id}>
                        <TableCell className="font-medium">
                          {timesheet.employees.first_name} {timesheet.employees.last_name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(timesheet.period_start), "MMM d")} - {format(new Date(timesheet.period_end), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-semibold">{timesheet.total_hours.toFixed(2)}</TableCell>
                        <TableCell>
                          {timesheet.submitted_at && format(new Date(timesheet.submitted_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(timesheet)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(timesheet)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(timesheet)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateTimesheetDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["timesheets"] })}
        />

        <TimesheetDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          timesheet={selectedTimesheet}
        />

        <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Timesheet</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve this timesheet for {selectedTimesheet?.employees.first_name} {selectedTimesheet?.employees.last_name}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedTimesheet && approveTimesheetMutation.mutate(selectedTimesheet.id)}>
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Timesheet</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reject this timesheet? This will send it back to the employee for corrections.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedTimesheet && rejectTimesheetMutation.mutate({ 
                timesheetId: selectedTimesheet.id, 
                reason: "Please review and correct time entries" 
              })}>
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
