import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddBenefitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddBenefitDialog({ open, onOpenChange, onSuccess }: AddBenefitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    benefit_name: "",
    benefit_type: "health",
    provider: "",
    cost_employee: "",
    cost_employer: "",
    deduction_frequency: "monthly",
    description: "",
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("benefits").insert({
        user_id: user.id,
        ...formData,
        cost_employee: parseFloat(formData.cost_employee) || 0,
        cost_employer: parseFloat(formData.cost_employer) || 0
      });

      if (error) throw error;

      toast.success("Benefit added successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        benefit_name: "",
        benefit_type: "health",
        provider: "",
        cost_employee: "",
        cost_employer: "",
        deduction_frequency: "monthly",
        description: "",
        is_active: true
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Benefit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="benefit_name">Benefit Name *</Label>
            <Input
              id="benefit_name"
              required
              value={formData.benefit_name}
              onChange={(e) => setFormData({ ...formData, benefit_name: e.target.value })}
              placeholder="e.g., Health Insurance PPO"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="benefit_type">Type *</Label>
              <Select value={formData.benefit_type} onValueChange={(value) => setFormData({ ...formData, benefit_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">Health Insurance</SelectItem>
                  <SelectItem value="dental">Dental Insurance</SelectItem>
                  <SelectItem value="vision">Vision Insurance</SelectItem>
                  <SelectItem value="retirement">Retirement Plan</SelectItem>
                  <SelectItem value="life">Life Insurance</SelectItem>
                  <SelectItem value="disability">Disability Insurance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., Blue Cross Blue Shield"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_employee">Employee Cost (per period) *</Label>
              <Input
                id="cost_employee"
                type="number"
                step="0.01"
                required
                value={formData.cost_employee}
                onChange={(e) => setFormData({ ...formData, cost_employee: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_employer">Employer Cost (per period) *</Label>
              <Input
                id="cost_employer"
                type="number"
                step="0.01"
                required
                value={formData.cost_employer}
                onChange={(e) => setFormData({ ...formData, cost_employer: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deduction_frequency">Deduction Frequency</Label>
            <Select value={formData.deduction_frequency} onValueChange={(value) => setFormData({ ...formData, deduction_frequency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about the benefit"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Benefit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
