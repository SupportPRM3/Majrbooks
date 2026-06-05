import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Landmark } from "lucide-react";

interface ConnectBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onBankConnected: () => void;
}

const popularBanks = [
  "Chase",
  "Bank of America",
  "Wells Fargo",
  "Citibank",
  "US Bank",
  "Capital One",
  "PNC Bank",
  "TD Bank",
  "Other"
];

export const ConnectBankDialog = ({ 
  open, 
  onOpenChange, 
  clientId, 
  clientName,
  onBankConnected 
}: ConnectBankDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    institution_name: "",
    account_name: "",
    account_number_last4: "",
    account_type: "checking",
    balance: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("client_bank_accounts")
        .insert({
          client_id: clientId,
          user_id: user.id,
          institution_name: formData.institution_name,
          account_name: formData.account_name,
          account_number_last4: formData.account_number_last4 || null,
          account_type: formData.account_type,
          balance: parseFloat(formData.balance) || 0,
          status: "connected",
          last_synced: new Date().toISOString()
        });

      if (error) throw error;

      toast.success("Bank account connected successfully");
      onBankConnected();
      onOpenChange(false);
      setFormData({
        institution_name: "",
        account_name: "",
        account_number_last4: "",
        account_type: "checking",
        balance: ""
      });
    } catch (error) {
      console.error("Error connecting bank:", error);
      toast.error("Failed to connect bank account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Connect Bank Account
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect a bank account for {clientName}
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="institution">Bank Institution</Label>
              <Select
                value={formData.institution_name}
                onValueChange={(value) => setFormData({ ...formData, institution_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {popularBanks.map((bank) => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                placeholder="e.g., Business Checking"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) => setFormData({ ...formData, account_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="last4">Last 4 Digits (Optional)</Label>
              <Input
                id="last4"
                placeholder="1234"
                maxLength={4}
                value={formData.account_number_last4}
                onChange={(e) => setFormData({ ...formData, account_number_last4: e.target.value.replace(/\D/g, '') })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.institution_name || !formData.account_name}>
              {isSubmitting ? "Connecting..." : "Connect Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
