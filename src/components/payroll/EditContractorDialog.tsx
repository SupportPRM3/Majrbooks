import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Contractor {
  id: string;
  first_name: string;
  last_name: string;
  business_name: string | null;
  tax_id?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  email: string | null;
  phone: string | null;
  rate: number;
  payment_terms: string | null;
  status: string;
}

interface EditContractorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractor: Contractor | null;
  onSuccess: () => void;
}

export default function EditContractorDialog({ open, onOpenChange, contractor, onSuccess }: EditContractorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    business_name: "",
    tax_id: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    email: "",
    phone: "",
    rate: "",
    payment_terms: "",
    status: "active"
  });

  useEffect(() => {
    if (contractor && open) {
      // Fetch full contractor data including tax_id when editing
      const fetchFullContractor = async () => {
        const { data, error } = await supabase
          .from("contractors")
          .select("tax_id")
          .eq("id", contractor.id)
          .single();
        
        setFormData({
          first_name: contractor.first_name,
          last_name: contractor.last_name,
          business_name: contractor.business_name || "",
          tax_id: (data?.tax_id) || contractor.tax_id || "",
          address: contractor.address || "",
          city: contractor.city || "",
          state: contractor.state || "",
          zip_code: contractor.zip_code || "",
          email: contractor.email || "",
          phone: contractor.phone || "",
          rate: contractor.rate.toString(),
          payment_terms: contractor.payment_terms || "",
          status: contractor.status
        });
      };
      fetchFullContractor();
    }
  }, [contractor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractor) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from("contractors")
        .update({
          ...formData,
          rate: parseFloat(formData.rate) || 0
        })
        .eq("id", contractor.id);

      if (error) throw error;

      toast.success("Contractor updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contractor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_id">Tax ID / EIN / SSN</Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">Zip Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Hourly/Project Rate *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                required
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Textarea
              id="payment_terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              placeholder="e.g., Net 30, Payment upon completion"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Contractor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
