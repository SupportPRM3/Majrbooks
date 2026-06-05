import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

interface QuickAddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickAddBillDialog = ({ open, onOpenChange }: QuickAddBillDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendor: "",
    amount: "",
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!formData.vendor.trim()) {
      toast.error("Please enter a vendor name");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("bills").insert({
        user_id: user.id,
        vendor_name: formData.vendor,
        amount: amount,
        due_date: formData.due_date,
        notes: formData.description || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Bill added successfully");
      onOpenChange(false);
      setFormData({
        vendor: "",
        amount: "",
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        description: "",
      });
    } catch (error) {
      console.error("Error adding bill:", error);
      toast.error("Failed to add bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Bill</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Input
              value={formData.vendor}
              onChange={(e) => setFormData(p => ({ ...p, vendor: e.target.value }))}
              placeholder="Enter vendor name"
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
            <Label>Due Date *</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(p => ({ ...p, due_date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Add any notes about this bill"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
