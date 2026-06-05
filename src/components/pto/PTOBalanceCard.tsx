import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PTOBalanceCardProps {
  employee: any;
  balances?: any[];
}

export default function PTOBalanceCard({ employee, balances }: PTOBalanceCardProps) {
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [ptoType, setPtoType] = useState("vacation");
  const [accrualRate, setAccrualRate] = useState("8");
  const [maxBalance, setMaxBalance] = useState("160");
  const queryClient = useQueryClient();

  const createBalanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("pto_balances").insert({
        employee_id: employee.id,
        pto_type: data.ptoType,
        balance_hours: 0,
        accrued_hours: 0,
        used_hours: 0,
        accrual_rate: parseFloat(data.accrualRate),
        max_balance: data.maxBalance ? parseFloat(data.maxBalance) : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pto_balances"] });
      toast.success("PTO balance created successfully");
      setSetupDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBalanceMutation.mutate({ ptoType, accrualRate, maxBalance });
  };

  const vacationBalance = balances?.find((b) => b.pto_type === "vacation");
  const sickBalance = balances?.find((b) => b.pto_type === "sick");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {employee.first_name} {employee.last_name}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSetupDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Vacation</span>
              </div>
            </div>
            {vacationBalance ? (
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {vacationBalance.balance_hours.toFixed(1)} hrs
                </p>
                <p className="text-xs text-muted-foreground">
                  Accrued: {vacationBalance.accrued_hours.toFixed(1)} hrs | Used:{" "}
                  {vacationBalance.used_hours.toFixed(1)} hrs
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not set up</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Sick Leave</span>
              </div>
            </div>
            {sickBalance ? (
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {sickBalance.balance_hours.toFixed(1)} hrs
                </p>
                <p className="text-xs text-muted-foreground">
                  Accrued: {sickBalance.accrued_hours.toFixed(1)} hrs | Used:{" "}
                  {sickBalance.used_hours.toFixed(1)} hrs
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not set up</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up PTO Balance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ptoType">PTO Type</Label>
              <Select value={ptoType} onValueChange={setPtoType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accrualRate">
                Accrual Rate (hours per pay period)
              </Label>
              <Input
                id="accrualRate"
                type="number"
                step="0.01"
                value={accrualRate}
                onChange={(e) => setAccrualRate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxBalance">Max Balance (hours)</Label>
              <Input
                id="maxBalance"
                type="number"
                step="0.01"
                value={maxBalance}
                onChange={(e) => setMaxBalance(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSetupDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBalanceMutation.isPending}>
                {createBalanceMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
