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

interface QuickAddEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickAddEstimateDialog = ({ open, onOpenChange }: QuickAddEstimateDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    title: "",
    amount: "",
    valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    description: "",
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
      
      // Create as a draft invoice with "estimate" reference
      const { error } = await supabase.from("invoices").insert({
        user_id: user.id,
        client_name: selectedClient?.client_name || "Unknown",
        client_email: selectedClient?.email || null,
        invoice_number: `EST-${Date.now()}`,
        subtotal: amount,
        amount: amount,
        issue_date: format(new Date(), "yyyy-MM-dd"),
        due_date: formData.valid_until,
        status: "draft",
        reference: "estimate",
        notes: formData.description || `Estimate: ${formData.title}`,
      });

      if (error) throw error;

      toast.success("Estimate created successfully");
      onOpenChange(false);
      setFormData({
        client_id: "",
        title: "",
        amount: "",
        valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        description: "",
      });
    } catch (error) {
      console.error("Error creating estimate:", error);
      toast.error("Failed to create estimate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Estimate</DialogTitle>
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
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Website Redesign Project"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Amount *</Label>
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
            <Label>Valid Until</Label>
            <Input
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData(p => ({ ...p, valid_until: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe the scope of work..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Estimate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
