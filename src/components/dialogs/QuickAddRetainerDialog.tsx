import { useState } from "react";
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

interface QuickAddRetainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickAddRetainerDialog = ({ open, onOpenChange }: QuickAddRetainerDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    amount: "",
    frequency: "monthly",
    start_date: format(new Date(), "yyyy-MM-dd"),
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
      
      // Calculate next run date based on frequency
      const startDate = new Date(formData.start_date);
      let nextRunDate = startDate;
      
      const { error } = await supabase.from("recurring_invoices").insert({
        user_id: user.id,
        client_name: selectedClient?.client_name || "Unknown",
        client_email: selectedClient?.email || null,
        invoice_number_prefix: `RET-${Date.now().toString().slice(-6)}`,
        amount: amount,
        subtotal: amount,
        frequency: formData.frequency,
        start_date: formData.start_date,
        next_run_date: format(nextRunDate, "yyyy-MM-dd"),
        status: "active",
      });

      if (error) throw error;

      toast.success("Retainer created successfully");
      onOpenChange(false);
      setFormData({
        client_id: "",
        amount: "",
        frequency: "monthly",
        start_date: format(new Date(), "yyyy-MM-dd"),
      });
    } catch (error) {
      console.error("Error creating retainer:", error);
      toast.error("Failed to create retainer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Retainer</DialogTitle>
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
            <Label>Retainer Amount *</Label>
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
            <Label>Billing Frequency</Label>
            <Select value={formData.frequency} onValueChange={(v) => setFormData(p => ({ ...p, frequency: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Retainer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
