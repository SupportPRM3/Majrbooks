import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RejectTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeEntry: any;
  onSuccess?: () => void;
}

export default function RejectTimeEntryDialog({ open, onOpenChange, timeEntry, onSuccess }: RejectTimeEntryDialogProps) {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const rejectEntryMutation = useMutation({
    mutationFn: async () => {
      if (!timeEntry) throw new Error("No time entry selected");
      if (!reason.trim()) throw new Error("Rejection reason is required");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update time entry approval status
      const { error: entryError } = await supabase
        .from("time_entries")
        .update({
          approval_status: "rejected",
          rejection_reason: reason
        })
        .eq("id", timeEntry.id);

      if (entryError) throw entryError;

      // Create approval history record
      const { error: historyError } = await supabase
        .from("time_entry_approvals")
        .insert({
          time_entry_id: timeEntry.id,
          action: "rejected",
          approved_by: user.id,
          notes: reason,
          user_id: user.id
        });

      if (historyError) throw historyError;

      // Send notification email (call edge function)
      await supabase.functions.invoke("send-time-entry-notification", {
        body: {
          timeEntryId: timeEntry.id,
          action: "rejected",
          notes: reason
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["time_entry_approvals"] });
      toast.success("Time entry rejected");
      onOpenChange(false);
      setReason("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject time entry");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Time Entry</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {timeEntry && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Employee:</span> {timeEntry.employees?.first_name} {timeEntry.employees?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Hours:</span> {timeEntry.total_hours?.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Date:</span> {new Date(timeEntry.entry_date).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for rejection..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              This reason will be sent to the employee via email.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => rejectEntryMutation.mutate()} 
            disabled={rejectEntryMutation.isPending || !reason.trim()}
          >
            {rejectEntryMutation.isPending ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}