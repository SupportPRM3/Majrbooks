import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckCircle, XCircle, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ClientReviewPortalProps {
  taxReturnId: string;
  onReviewed?: () => void;
}

export const ClientReviewPortal = ({ taxReturnId, onReviewed }: ClientReviewPortalProps) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taxReturn, setTaxReturn] = useState<any>(null);
  const [clientNotes, setClientNotes] = useState("");
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);

  useEffect(() => {
    loadTaxReturn();
    loadReviewHistory();
  }, [taxReturnId]);

  const loadTaxReturn = async () => {
    try {
      const { data, error } = await supabase
        .from("tax_returns")
        .select(`
          *,
          clients (
            client_name,
            contact_name,
            email
          )
        `)
        .eq("id", taxReturnId)
        .single();

      if (error) throw error;
      setTaxReturn(data);
      setClientNotes(data.client_notes || "");
    } catch (error) {
      console.error("Error loading tax return:", error);
      toast.error("Failed to load tax return");
    } finally {
      setLoading(false);
    }
  };

  const loadReviewHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("tax_return_reviews")
        .select("*")
        .eq("tax_return_id", taxReturnId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviewHistory(data || []);
    } catch (error) {
      console.error("Error loading review history:", error);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("tax_returns")
        .update({
          review_status: "approved",
          reviewed_at: new Date().toISOString(),
          client_notes: clientNotes,
        })
        .eq("id", taxReturnId);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("tax_return_reviews")
        .insert({
          tax_return_id: taxReturnId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: "approved",
          notes: clientNotes,
        });

      if (historyError) throw historyError;

      toast.success("Tax return approved successfully");
      onReviewed?.();
      loadTaxReturn();
      loadReviewHistory();
    } catch (error) {
      console.error("Error approving tax return:", error);
      toast.error("Failed to approve tax return");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!clientNotes.trim()) {
      toast.error("Please provide notes about the changes needed");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("tax_returns")
        .update({
          review_status: "changes_requested",
          reviewed_at: new Date().toISOString(),
          client_notes: clientNotes,
        })
        .eq("id", taxReturnId);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("tax_return_reviews")
        .insert({
          tax_return_id: taxReturnId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: "requested_changes",
          notes: clientNotes,
        });

      if (historyError) throw historyError;

      toast.success("Change request submitted successfully");
      onReviewed?.();
      loadTaxReturn();
      loadReviewHistory();
      setClientNotes("");
    } catch (error) {
      console.error("Error requesting changes:", error);
      toast.error("Failed to submit change request");
    } finally {
      setSubmitting(false);
    }
  };

  const getReviewStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      draft: { className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", label: "Draft" },
      pending_review: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending Review" },
      approved: { className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Approved" },
      changes_requested: { className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Changes Requested" },
    };
    const variant = variants[status] || variants.draft;
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      sent_for_review: "Sent for Review",
      approved: "Approved",
      requested_changes: "Requested Changes",
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!taxReturn) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Tax return not found
      </div>
    );
  }

  const isApproved = taxReturn.review_status === "approved";
  const canReview = taxReturn.review_status === "pending_review" || taxReturn.review_status === "changes_requested";

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{taxReturn.clients?.client_name}</h2>
            <p className="text-muted-foreground">Tax Year {taxReturn.tax_year}</p>
          </div>
          {getReviewStatusBadge(taxReturn.review_status)}
        </div>

        <div className="grid gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Filing Deadline:</span>
            <span className="font-medium">{format(new Date(taxReturn.deadline), "MMM dd, yyyy")}</span>
          </div>
          {taxReturn.sent_for_review_at && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sent for Review:</span>
              <span className="font-medium">{format(new Date(taxReturn.sent_for_review_at), "MMM dd, yyyy 'at' h:mm a")}</span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tax Return Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Income:</span>
            <span className="font-medium">${(taxReturn.total_income || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Adjusted Gross Income:</span>
            <span className="font-medium">${(taxReturn.adjusted_gross_income || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Deductions:</span>
            <span className="font-medium">${(taxReturn.total_deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxable Income:</span>
            <span className="font-medium">${(taxReturn.taxable_income || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Tax:</span>
            <span className="font-medium">${(taxReturn.total_tax || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Credits:</span>
            <span className="font-medium">${(taxReturn.total_credits || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <Separator className="my-4" />
          {taxReturn.refund_amount > 0 ? (
            <div className="flex justify-between items-center text-xl font-bold text-green-600 dark:text-green-400">
              <span>Estimated Refund:</span>
              <span>${taxReturn.refund_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-xl font-bold text-red-600 dark:text-red-400">
              <span>Amount Owed:</span>
              <span>${taxReturn.amount_owed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      </Card>

      {canReview && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Review Tax Return</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientNotes">Notes / Questions (Optional for approval, required for changes)</Label>
              <Textarea
                id="clientNotes"
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Add any notes, questions, or requested changes..."
                className="mt-1 min-h-[100px]"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Tax Return
              </Button>
              <Button
                onClick={handleRequestChanges}
                disabled={submitting}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Request Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isApproved && (
        <Card className="p-6 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">Tax Return Approved</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                This tax return has been approved and is ready for filing.
              </p>
              {taxReturn.reviewed_at && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Approved on {format(new Date(taxReturn.reviewed_at), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              )}
            </div>
          </div>
          {taxReturn.client_notes && (
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">Client Notes:</p>
              <p className="text-sm text-green-700 dark:text-green-300">{taxReturn.client_notes}</p>
            </div>
          )}
        </Card>
      )}

      {reviewHistory.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Review History</h3>
          <div className="space-y-3">
            {reviewHistory.map((review) => (
              <div key={review.id} className="flex gap-3 pb-3 border-b border-border last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{getActionLabel(review.action)}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "MMM dd, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  {review.notes && (
                    <p className="text-sm text-muted-foreground">{review.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};