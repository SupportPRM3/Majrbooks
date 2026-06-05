import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateTaxReturnDialog } from "@/components/CreateTaxReturnDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaxReturnForm } from "@/components/TaxReturnForm";
import { ClientReviewPortal } from "@/components/ClientReviewPortal";
import { toast } from "sonner";
import { MoreHorizontal, FileText, Download, Calendar, Edit, Send, Eye, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const TaxReturns = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [taxReturns, setTaxReturns] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [selectedTaxReturn, setSelectedTaxReturn] = useState<string | null>(null);
  const [reviewTaxReturn, setReviewTaxReturn] = useState<string | null>(null);

  const loadTaxReturns = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from("tax_returns")
        .select(`
          *,
          clients (
            client_name,
            contact_name
          )
        `)
        .eq("user_id", user.id)
        .order("deadline", { ascending: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (yearFilter !== "all") {
        query = query.eq("tax_year", parseInt(yearFilter));
      }

      const { data, error } = await query;

      if (error) throw error;
      setTaxReturns(data || []);
    } catch (error) {
      console.error("Error loading tax returns:", error);
      toast.error("Failed to load tax returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTaxReturns();
    }
  }, [user, statusFilter, yearFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      not_started: { className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", label: "Not Started" },
      in_progress: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "In Progress" },
      review: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Review" },
      filed: { className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", label: "Filed" },
      completed: { className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Completed" },
    };
    const variant = variants[status] || variants.not_started;
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const getFilingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      individual: "Individual",
      business: "Business",
      partnership: "Partnership",
      corporate: "Corporate",
    };
    return labels[type] || type;
  };

  const handleDelete = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete the tax return for ${clientName}?`)) return;

    try {
      const { error } = await supabase.from("tax_returns").delete().eq("id", id);
      if (error) throw error;
      toast.success("Tax return deleted successfully");
      loadTaxReturns();
    } catch (error) {
      toast.error("Failed to delete tax return");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tax_returns")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Status updated successfully");
      loadTaxReturns();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSendForReview = async (id: string, clientName: string) => {
    try {
      const { error: updateError } = await supabase
        .from("tax_returns")
        .update({
          review_status: "pending_review",
          sent_for_review_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("tax_return_reviews")
        .insert({
          tax_return_id: id,
          user_id: user!.id,
          action: "sent_for_review",
        });

      if (historyError) throw historyError;

      toast.success(`Tax return sent to ${clientName} for review`);
      loadTaxReturns();
    } catch (error) {
      console.error("Error sending for review:", error);
      toast.error("Failed to send tax return for review");
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

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const isOverdue = (deadline: string, status: string) => {
    return status !== "completed" && status !== "filed" && new Date(deadline) < new Date();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tax Returns</h1>
            <p className="text-muted-foreground mt-1">Manage client tax returns and deadlines</p>
          </div>
          <CreateTaxReturnDialog onTaxReturnCreated={loadTaxReturns} />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="filed">Filed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">Tax Year</label>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-semibold">Client</th>
                  <th className="text-left p-4 text-sm font-semibold">Tax Year</th>
                  <th className="text-left p-4 text-sm font-semibold">Filing Type</th>
                  <th className="text-left p-4 text-sm font-semibold">Status</th>
                  <th className="text-left p-4 text-sm font-semibold">Review Status</th>
                  <th className="text-left p-4 text-sm font-semibold">Deadline</th>
                  <th className="text-left p-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </td>
                  </tr>
                ) : taxReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      No tax returns found. Click "Create Tax Return" to get started.
                    </td>
                  </tr>
                ) : (
                  taxReturns.map((taxReturn) => (
                    <tr key={taxReturn.id} className="border-b border-border hover:bg-accent/50">
                      <td className="p-4">
                        <div>
                          <div className="font-semibold">{taxReturn.clients?.client_name}</div>
                          {taxReturn.clients?.contact_name && (
                            <div className="text-sm text-muted-foreground">
                              {taxReturn.clients.contact_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{taxReturn.tax_year}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{getFilingTypeLabel(taxReturn.filing_type)}</span>
                      </td>
                      <td className="p-4">{getStatusBadge(taxReturn.status)}</td>
                      <td className="p-4">{getReviewStatusBadge(taxReturn.review_status || 'draft')}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={isOverdue(taxReturn.deadline, taxReturn.status) ? "text-destructive font-medium" : ""}>
                            {format(new Date(taxReturn.deadline), "MMM dd, yyyy")}
                          </span>
                          {isOverdue(taxReturn.deadline, taxReturn.status) && (
                            <Badge variant="destructive" className="ml-2">Overdue</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Actions
                              <MoreHorizontal className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => setSelectedTaxReturn(taxReturn.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Tax Return
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setReviewTaxReturn(taxReturn.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Client Portal
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSendForReview(taxReturn.id, taxReturn.clients?.client_name)}
                              disabled={!taxReturn.total_income || taxReturn.review_status === 'approved'}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send for Client Review
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(taxReturn.id, "in_progress")}>
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(taxReturn.id, "review")}>
                              Mark for Review
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(taxReturn.id, "filed")}>
                              Mark as Filed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(taxReturn.id, "completed")}>
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.open('https://www.crosslinktax.com/crosslink-university/', '_blank')}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              File a Tax
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Document download coming soon")}>
                              <Download className="mr-2 h-4 w-4" />
                              Download Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(taxReturn.id, taxReturn.clients?.client_name)}
                              className="text-destructive focus:text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={!!selectedTaxReturn} onOpenChange={() => setSelectedTaxReturn(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tax Return Organizer</DialogTitle>
            </DialogHeader>
            {selectedTaxReturn && (
              <TaxReturnForm 
                taxReturnId={selectedTaxReturn} 
                onSaved={() => {
                  setSelectedTaxReturn(null);
                  loadTaxReturns();
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!reviewTaxReturn} onOpenChange={() => setReviewTaxReturn(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Review Portal</DialogTitle>
            </DialogHeader>
            {reviewTaxReturn && (
              <ClientReviewPortal 
                taxReturnId={reviewTaxReturn} 
                onReviewed={() => {
                  setReviewTaxReturn(null);
                  loadTaxReturns();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default TaxReturns;
