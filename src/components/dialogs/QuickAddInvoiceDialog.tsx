import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { DollarSign } from "lucide-react";

interface QuickAddInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickAddInvoiceDialog = ({ open, onOpenChange }: QuickAddInvoiceDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    client_id: "",
    invoice_number: `INV-${Date.now()}`,
    subtotal: "",
    issue_date: format(new Date(), "yyyy-MM-dd"),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-with-user-ids", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Get clients with their linked user_id from invitations
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, client_name, email")
        .eq("user_id", user.id)
        .order("client_name");
      if (clientsError) throw clientsError;
      
      // Get invitation mappings to find client_user_id
      const { data: invitations, error: invError } = await supabase
        .from("client_invitations")
        .select("client_email, client_user_id")
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .not("client_user_id", "is", null);
      if (invError) throw invError;
      
      // Create email -> client_user_id mapping
      const emailToUserId = new Map(
        invitations?.map(inv => [inv.client_email, inv.client_user_id]) || []
      );
      
      // Enrich clients with client_user_id
      return (clientsData || []).map(client => ({
        ...client,
        client_user_id: emailToUserId.get(client.email || "") || null
      }));
    },
    enabled: !!user?.id && open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const subtotal = parseFloat(formData.subtotal);
    if (!subtotal || subtotal <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!formData.client_id) {
      toast.error("Please select a client");
      return;
    }

    setLoading(true);

    try {
      const selectedClient = clients?.find(c => c.id === formData.client_id);
      
      const { error } = await supabase.from("invoices").insert({
        user_id: user.id,
        client_name: selectedClient?.client_name || "Unknown",
        client_email: selectedClient?.email || null,
        client_user_id: selectedClient?.client_user_id || null, // Secure link to client account
        invoice_number: formData.invoice_number,
        subtotal: subtotal,
        amount: subtotal,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        status: "draft",
      });

      if (error) throw error;

      toast.success(`Invoice ${formData.invoice_number} created`);
      onOpenChange(false);
      setFormData({
        client_id: "",
        invoice_number: `INV-${Date.now()}`,
        subtotal: "",
        issue_date: format(new Date(), "yyyy-MM-dd"),
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={formData.client_id} onValueChange={(v) => setFormData(p => ({ ...p, client_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Invoice Number *</Label>
            <Input
              value={formData.invoice_number}
              onChange={(e) => setFormData(p => ({ ...p, invoice_number: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.subtotal}
                onChange={(e) => setFormData(p => ({ ...p, subtotal: e.target.value }))}
                placeholder="0.00"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData(p => ({ ...p, issue_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(p => ({ ...p, due_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
