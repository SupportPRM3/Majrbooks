import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApproveTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeEntry: any;
  onSuccess?: () => void;
}

export default function ApproveTimeEntryDialog({ open, onOpenChange, timeEntry, onSuccess }: ApproveTimeEntryDialogProps) {
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const approveEntryMutation = useMutation({
    mutationFn: async () => {
      if (!timeEntry) throw new Error("No time entry selected");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update time entry approval status
      const { error: entryError } = await supabase
        .from("time_entries")
        .update({
          approval_status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", timeEntry.id);

      if (entryError) throw entryError;

      // Create approval history record
      const { error: historyError } = await supabase
        .from("time_entry_approvals")
        .insert({
          time_entry_id: timeEntry.id,
          action: "approved",
          approved_by: user.id,
          notes: notes || null,
          user_id: user.id
        });

      if (historyError) throw historyError;

      // Send notification email (call edge function)
      await supabase.functions.invoke("send-time-entry-notification", {
        body: {
          timeEntryId: timeEntry.id,
          action: "approved",
          notes: notes
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      queryClient.invalidateQueries({ queryKey: ["time_entry_approvals"] });
      toast.success("Time entry approved successfully");
      onOpenChange(false);
      setNotes("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve time entry");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Time Entry</DialogTitle>
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
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any approval notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => approveEntryMutation.mutate()} disabled={approveEntryMutation.isPending}>
            {approveEntryMutation.isPending ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}