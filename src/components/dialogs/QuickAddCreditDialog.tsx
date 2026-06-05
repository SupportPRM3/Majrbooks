import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface QuickAddCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickAddCreditDialog = ({ open, onOpenChange }: QuickAddCreditDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    amount: "",
    reason: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: clients } = useQuery({
    queryKey: ["clients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("clients")
        .select("id, client_name, email")
        .eq("user_id", user.id)
        .order("client_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
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
      
      // Create a credit memo as a negative invoice
      const { error } = await supabase.from("invoices").insert({
        user_id: user.id,
        client_name: selectedClient?.client_name || "Unknown",
        client_email: selectedClient?.email || null,
        invoice_number: `CR-${Date.now()}`,
        subtotal: -Math.abs(amount),
        amount: -Math.abs(amount),
        issue_date: formData.date,
        due_date: formData.date,
        status: "paid",
        reference: "credit",
        notes: `Credit Memo: ${formData.reason}`,
      });

      if (error) throw error;

      toast.success("Credit memo created successfully");
      onOpenChange(false);
      setFormData({
        client_id: "",
        amount: "",
        reason: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
    } catch (error) {
      console.error("Error creating credit:", error);
      toast.error("Failed to create credit memo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Credit Memo</DialogTitle>
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
            <Label>Credit Amount *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
              placeholder="Reason for the credit..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Credit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
