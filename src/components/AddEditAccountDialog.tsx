import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: string;
  name: string;
  account_type: string;
  detail_type: string;
  action_type: string;
  quickbooks_balance: number;
  bank_balance: number | null;
  is_active: boolean;
}

interface AddEditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onSuccess: () => void;
}

const accountTypes = ["Asset", "Liability", "Equity", "Income", "Expense"];

const detailTypesByAccountType: Record<string, string[]> = {
  Asset: [
    "Cash",
    "AccountsReceivable",
    "Inventory",
    "FixedAssets",
    "OtherCurrentAssets",
    "OtherAssets",
  ],
  Liability: [
    "AccountsPayable",
    "CreditCard",
    "OtherCurrentLiabilities",
    "LongTermLiabilities",
  ],
  Equity: ["Equity", "RetainedEarnings", "OwnersEquity"],
  Income: ["SalesRevenue", "ServiceRevenue", "OtherIncome"],
  Expense: [
    "CostOfGoodsSold",
    "Advertising",
    "Rent",
    "Utilities",
    "Payroll",
    "OfficeExpenses",
    "OtherExpenses",
  ],
};

const actionTypes = ["report", "register"];

const AddEditAccountDialog = ({
  open,
  onOpenChange,
  account,
  onSuccess,
}: AddEditAccountDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    account_type: "Asset",
    detail_type: "Cash",
    action_type: "report",
    quickbooks_balance: 0,
    bank_balance: null as number | null,
    is_active: true,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        account_type: account.account_type,
        detail_type: account.detail_type,
        action_type: account.action_type,
        quickbooks_balance: account.quickbooks_balance,
        bank_balance: account.bank_balance,
        is_active: account.is_active,
      });
    } else {
      setFormData({
        name: "",
        account_type: "Asset",
        detail_type: "Cash",
        action_type: "report",
        quickbooks_balance: 0,
        bank_balance: null,
        is_active: true,
      });
    }
  }, [account, open]);

  const handleAccountTypeChange = (type: string) => {
    setFormData({
      ...formData,
      account_type: type,
      detail_type: detailTypesByAccountType[type][0],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      if (account) {
        // Update existing account
        const { error } = await supabase
          .from("chart_of_accounts")
          .update(formData)
          .eq("id", account.id)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Account updated successfully",
        });
      } else {
        // Create new account
        const { error } = await supabase
          .from("chart_of_accounts")
          .insert([{ ...formData, user_id: user.id }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Account created successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Add New Account"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Business Checking"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type *</Label>
              <Select
                value={formData.account_type}
                onValueChange={handleAccountTypeChange}
              >
                <SelectTrigger id="account_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail_type">Detail Type *</Label>
              <Select
                value={formData.detail_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, detail_type: value })
                }
              >
                <SelectTrigger id="detail_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {detailTypesByAccountType[formData.account_type].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action_type">Action Type *</Label>
              <Select
                value={formData.action_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, action_type: value })
                }
              >
                <SelectTrigger id="action_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickbooks_balance">Balance *</Label>
              <Input
                id="quickbooks_balance"
                type="number"
                step="0.01"
                value={formData.quickbooks_balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quickbooks_balance: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_balance">Bank Balance (Optional)</Label>
              <Input
                id="bank_balance"
                type="number"
                step="0.01"
                value={formData.bank_balance || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bank_balance: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Account Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : account ? "Update Account" : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditAccountDialog;
