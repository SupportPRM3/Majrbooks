import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calculator, DollarSign, FileText, Calendar } from "lucide-react";

interface EmployeePayConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  payType: string;
  payRate: number;
}

export function EmployeePayConfigDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  payType,
  payRate
}: EmployeePayConfigDialogProps) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    overtime_rate: "1.5",
    allowances: "0",
    bonuses: "0",
    reimbursements: "0",
    federal_filing_status: "single",
    state_filing_status: "single",
    additional_federal_withholding: "0",
    additional_state_withholding: "0",
    pre_tax_deductions: "0",
    post_tax_deductions: "0",
    pay_schedule_id: ""
  });

  // Fetch existing config
  const { data: existingConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ["employee-pay-config", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_pay_config")
        .select("*")
        .eq("employee_id", employeeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!employeeId
  });

  // Fetch pay schedules
  const { data: paySchedules } = useQuery({
    queryKey: ["pay-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pay_schedules")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  useEffect(() => {
    if (existingConfig) {
      setConfig({
        overtime_rate: existingConfig.overtime_rate?.toString() || "1.5",
        allowances: existingConfig.allowances?.toString() || "0",
        bonuses: existingConfig.bonuses?.toString() || "0",
        reimbursements: existingConfig.reimbursements?.toString() || "0",
        federal_filing_status: existingConfig.federal_filing_status || "single",
        state_filing_status: existingConfig.state_filing_status || "single",
        additional_federal_withholding: existingConfig.additional_federal_withholding?.toString() || "0",
        additional_state_withholding: existingConfig.additional_state_withholding?.toString() || "0",
        pre_tax_deductions: existingConfig.pre_tax_deductions?.toString() || "0",
        post_tax_deductions: existingConfig.post_tax_deductions?.toString() || "0",
        pay_schedule_id: existingConfig.pay_schedule_id || ""
      });
    }
  }, [existingConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const configData = {
        employee_id: employeeId,
        user_id: user.id,
        overtime_rate: parseFloat(config.overtime_rate) || 1.5,
        allowances: parseFloat(config.allowances) || 0,
        bonuses: parseFloat(config.bonuses) || 0,
        reimbursements: parseFloat(config.reimbursements) || 0,
        federal_filing_status: config.federal_filing_status,
        state_filing_status: config.state_filing_status,
        additional_federal_withholding: parseFloat(config.additional_federal_withholding) || 0,
        additional_state_withholding: parseFloat(config.additional_state_withholding) || 0,
        pre_tax_deductions: parseFloat(config.pre_tax_deductions) || 0,
        post_tax_deductions: parseFloat(config.post_tax_deductions) || 0,
        pay_schedule_id: config.pay_schedule_id || null
      };

      if (existingConfig) {
        const { error } = await supabase
          .from("employee_pay_config")
          .update(configData)
          .eq("id", existingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employee_pay_config")
          .insert(configData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-pay-config", employeeId] });
      toast.success("Pay configuration saved");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Calculate estimated taxes (simplified)
  const calculateEstimatedTaxes = () => {
    const annual = payType === "salary" ? payRate : payRate * 2080;
    const grossWithAdditions = annual + parseFloat(config.allowances || "0") + parseFloat(config.bonuses || "0");
    
    // Simplified tax estimates
    const federalTax = grossWithAdditions * 0.22; // Simplified 22% bracket
    const stateTax = grossWithAdditions * 0.05; // Simplified 5% state
    const socialSecurity = Math.min(grossWithAdditions, 160200) * 0.062;
    const medicare = grossWithAdditions * 0.0145;
    
    const totalDeductions = parseFloat(config.pre_tax_deductions || "0") + parseFloat(config.post_tax_deductions || "0");
    const netPay = grossWithAdditions - federalTax - stateTax - socialSecurity - medicare - totalDeductions + parseFloat(config.reimbursements || "0");
    
    return {
      gross: grossWithAdditions,
      federalTax,
      stateTax,
      socialSecurity,
      medicare,
      netPay
    };
  };

  const estimates = calculateEstimatedTaxes();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Pay Configuration: {employeeName}
          </DialogTitle>
          <DialogDescription>
            Configure pay details, withholdings, and deductions
          </DialogDescription>
        </DialogHeader>

        {loadingConfig ? (
          <div className="p-4 text-center">Loading configuration...</div>
        ) : (
          <Tabs defaultValue="pay" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pay">Pay</TabsTrigger>
              <TabsTrigger value="taxes">Taxes</TabsTrigger>
              <TabsTrigger value="deductions">Deductions</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="pay" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pay Type</Label>
                  <Input disabled value={payType === "hourly" ? "Hourly" : "Salary"} />
                </div>
                <div className="space-y-2">
                  <Label>Base Rate</Label>
                  <Input disabled value={`$${payRate.toLocaleString()}${payType === "hourly" ? "/hr" : "/yr"}`} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtime_rate">Overtime Multiplier</Label>
                  <Input
                    id="overtime_rate"
                    type="number"
                    step="0.1"
                    value={config.overtime_rate}
                    onChange={(e) => setConfig({ ...config, overtime_rate: e.target.value })}
                    placeholder="1.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay_schedule">Pay Schedule</Label>
                  <Select 
                    value={config.pay_schedule_id} 
                    onValueChange={(val) => setConfig({ ...config, pay_schedule_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      {paySchedules?.map((schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id}>
                          {schedule.name} ({schedule.frequency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowances">Allowances ($)</Label>
                  <Input
                    id="allowances"
                    type="number"
                    step="0.01"
                    value={config.allowances}
                    onChange={(e) => setConfig({ ...config, allowances: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonuses">Bonuses ($)</Label>
                  <Input
                    id="bonuses"
                    type="number"
                    step="0.01"
                    value={config.bonuses}
                    onChange={(e) => setConfig({ ...config, bonuses: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="reimbursements">Reimbursements ($)</Label>
                  <Input
                    id="reimbursements"
                    type="number"
                    step="0.01"
                    value={config.reimbursements}
                    onChange={(e) => setConfig({ ...config, reimbursements: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="taxes" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="federal_filing_status">Federal Filing Status</Label>
                  <Select
                    value={config.federal_filing_status}
                    onValueChange={(val) => setConfig({ ...config, federal_filing_status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married_filing_jointly">Married Filing Jointly</SelectItem>
                      <SelectItem value="married_filing_separately">Married Filing Separately</SelectItem>
                      <SelectItem value="head_of_household">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state_filing_status">State Filing Status</Label>
                  <Select
                    value={config.state_filing_status}
                    onValueChange={(val) => setConfig({ ...config, state_filing_status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="exempt">Exempt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional_federal">Additional Federal Withholding ($)</Label>
                  <Input
                    id="additional_federal"
                    type="number"
                    step="0.01"
                    value={config.additional_federal_withholding}
                    onChange={(e) => setConfig({ ...config, additional_federal_withholding: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional_state">Additional State Withholding ($)</Label>
                  <Input
                    id="additional_state"
                    type="number"
                    step="0.01"
                    value={config.additional_state_withholding}
                    onChange={(e) => setConfig({ ...config, additional_state_withholding: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deductions" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pre_tax">Pre-Tax Deductions ($)</Label>
                  <Input
                    id="pre_tax"
                    type="number"
                    step="0.01"
                    value={config.pre_tax_deductions}
                    onChange={(e) => setConfig({ ...config, pre_tax_deductions: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">401(k), HSA, etc.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post_tax">Post-Tax Deductions ($)</Label>
                  <Input
                    id="post_tax"
                    type="number"
                    step="0.01"
                    value={config.post_tax_deductions}
                    onChange={(e) => setConfig({ ...config, post_tax_deductions: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Roth contributions, garnishments, etc.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Annual Pay Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span>Gross Pay</span>
                    <span className="font-semibold">${estimates.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm text-muted-foreground">
                    <span>Federal Tax (est.)</span>
                    <span>-${estimates.federalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm text-muted-foreground">
                    <span>State Tax (est.)</span>
                    <span>-${estimates.stateTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm text-muted-foreground">
                    <span>Social Security</span>
                    <span>-${estimates.socialSecurity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm text-muted-foreground">
                    <span>Medicare</span>
                    <span>-${estimates.medicare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t font-bold text-lg">
                    <span>Estimated Net Pay</span>
                    <span className="text-primary">${estimates.netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * This is an estimate. Actual taxes may vary based on deductions, credits, and tax law changes.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}