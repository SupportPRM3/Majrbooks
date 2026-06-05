import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function PTORequestsTable() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["pto_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pto_requests")
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get request details
      const { data: request } = await supabase
        .from("pto_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (!request) throw new Error("Request not found");

      // Update request status
      const { error: requestError } = await supabase
        .from("pto_requests")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // Get current balance
      const { data: balance } = await supabase
        .from("pto_balances")
        .select("balance_hours, used_hours")
        .eq("employee_id", request.employee_id)
        .eq("pto_type", request.pto_type)
        .single();

      if (balance) {
        // Update PTO balance
        const { error: balanceError } = await supabase
          .from("pto_balances")
          .update({
            balance_hours: balance.balance_hours - request.hours_requested,
            used_hours: balance.used_hours + request.hours_requested,
          })
          .eq("employee_id", request.employee_id)
          .eq("pto_type", request.pto_type);

        if (balanceError) throw balanceError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pto_requests"] });
      queryClient.invalidateQueries({ queryKey: ["pto_balances"] });
      toast.success("Request approved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { error } = await supabase
        .from("pto_requests")
        .update({
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pto_requests"] });
      toast.success("Request rejected");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
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
    return <div>Loading requests...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Off Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests?.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.employees.first_name} {request.employees.last_name}
                </TableCell>
                <TableCell className="capitalize">{request.pto_type}</TableCell>
                <TableCell>
                  {format(new Date(request.start_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {format(new Date(request.end_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{request.hours_requested}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => approveRequestMutation.mutate(request.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          rejectRequestMutation.mutate({
                            requestId: request.id,
                            reason: "Rejected by manager",
                          })
                        }
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
