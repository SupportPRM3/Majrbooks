import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const taxReturnSchema = z.object({
  wages: z.coerce.number().min(0).default(0),
  business_income: z.coerce.number().min(0).default(0),
  investment_income: z.coerce.number().min(0).default(0),
  other_income: z.coerce.number().min(0).default(0),
  standard_deduction: z.coerce.number().min(0).default(0),
  itemized_deductions: z.coerce.number().min(0).default(0),
  mortgage_interest: z.coerce.number().min(0).default(0),
  charitable_contributions: z.coerce.number().min(0).default(0),
  state_local_taxes: z.coerce.number().min(0).default(0),
  medical_expenses: z.coerce.number().min(0).default(0),
  child_tax_credit: z.coerce.number().min(0).default(0),
  education_credits: z.coerce.number().min(0).default(0),
  other_credits: z.coerce.number().min(0).default(0),
  federal_withholding: z.coerce.number().min(0).default(0),
  estimated_payments: z.coerce.number().min(0).default(0),
});

type TaxReturnFormData = z.infer<typeof taxReturnSchema>;

interface TaxReturnFormProps {
  taxReturnId: string;
  onSaved?: () => void;
}

export const TaxReturnForm = ({ taxReturnId, onSaved }: TaxReturnFormProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculations, setCalculations] = useState({
    totalIncome: 0,
    totalDeductions: 0,
    totalCredits: 0,
    adjustedGrossIncome: 0,
    taxableIncome: 0,
    totalTax: 0,
    refundAmount: 0,
    amountOwed: 0,
  });

  const form = useForm<TaxReturnFormData>({
    resolver: zodResolver(taxReturnSchema),
    defaultValues: {
      wages: 0,
      business_income: 0,
      investment_income: 0,
      other_income: 0,
      standard_deduction: 0,
      itemized_deductions: 0,
      mortgage_interest: 0,
      charitable_contributions: 0,
      state_local_taxes: 0,
      medical_expenses: 0,
      child_tax_credit: 0,
      education_credits: 0,
      other_credits: 0,
      federal_withholding: 0,
      estimated_payments: 0,
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    loadTaxReturn();
  }, [taxReturnId]);

  useEffect(() => {
    calculateTotals();
  }, [watchedValues]);

  const loadTaxReturn = async () => {
    try {
      const { data, error } = await supabase
        .from("tax_returns")
        .select("*")
        .eq("id", taxReturnId)
        .single();

      if (error) throw error;
      if (data) {
        form.reset({
          wages: data.wages || 0,
          business_income: data.business_income || 0,
          investment_income: data.investment_income || 0,
          other_income: data.other_income || 0,
          standard_deduction: data.standard_deduction || 0,
          itemized_deductions: data.itemized_deductions || 0,
          mortgage_interest: data.mortgage_interest || 0,
          charitable_contributions: data.charitable_contributions || 0,
          state_local_taxes: data.state_local_taxes || 0,
          medical_expenses: data.medical_expenses || 0,
          child_tax_credit: data.child_tax_credit || 0,
          education_credits: data.education_credits || 0,
          other_credits: data.other_credits || 0,
          federal_withholding: data.federal_withholding || 0,
          estimated_payments: data.estimated_payments || 0,
        });
      }
    } catch (error) {
      console.error("Error loading tax return:", error);
      toast.error("Failed to load tax return data");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const values = form.getValues();
    
    const totalIncome = 
      values.wages + 
      values.business_income + 
      values.investment_income + 
      values.other_income;

    const itemizedTotal = 
      values.mortgage_interest + 
      values.charitable_contributions + 
      values.state_local_taxes + 
      values.medical_expenses;

    const totalDeductions = Math.max(values.standard_deduction, itemizedTotal);
    
    const totalCredits = 
      values.child_tax_credit + 
      values.education_credits + 
      values.other_credits;

    const adjustedGrossIncome = totalIncome;
    const taxableIncome = Math.max(0, adjustedGrossIncome - totalDeductions);
    
    // Simple tax calculation (simplified tax brackets for 2024)
    let totalTax = 0;
    if (taxableIncome <= 11000) {
      totalTax = taxableIncome * 0.10;
    } else if (taxableIncome <= 44725) {
      totalTax = 1100 + (taxableIncome - 11000) * 0.12;
    } else if (taxableIncome <= 95375) {
      totalTax = 5147 + (taxableIncome - 44725) * 0.22;
    } else if (taxableIncome <= 182100) {
      totalTax = 16290 + (taxableIncome - 95375) * 0.24;
    } else if (taxableIncome <= 231250) {
      totalTax = 37104 + (taxableIncome - 182100) * 0.32;
    } else if (taxableIncome <= 578125) {
      totalTax = 52832 + (taxableIncome - 231250) * 0.35;
    } else {
      totalTax = 174238.25 + (taxableIncome - 578125) * 0.37;
    }

    totalTax = Math.max(0, totalTax - totalCredits);

    const totalPayments = values.federal_withholding + values.estimated_payments;
    const difference = totalPayments - totalTax;

    setCalculations({
      totalIncome,
      totalDeductions,
      totalCredits,
      adjustedGrossIncome,
      taxableIncome,
      totalTax,
      refundAmount: difference > 0 ? difference : 0,
      amountOwed: difference < 0 ? Math.abs(difference) : 0,
    });
  };

  const onSubmit = async (data: TaxReturnFormData) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tax_returns")
        .update({
          ...data,
          total_income: calculations.totalIncome,
          total_deductions: calculations.totalDeductions,
          total_credits: calculations.totalCredits,
          adjusted_gross_income: calculations.adjustedGrossIncome,
          taxable_income: calculations.taxableIncome,
          total_tax: calculations.totalTax,
          refund_amount: calculations.refundAmount,
          amount_owed: calculations.amountOwed,
          itemized_deductions: Math.max(data.standard_deduction, 
            data.mortgage_interest + 
            data.charitable_contributions + 
            data.state_local_taxes + 
            data.medical_expenses),
        })
        .eq("id", taxReturnId);

      if (error) throw error;
      toast.success("Tax return saved successfully");
      onSaved?.();
    } catch (error) {
      console.error("Error saving tax return:", error);
      toast.error("Failed to save tax return");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="deductions">Deductions</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Income Sources</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="wages">Wages & Salaries (W-2)</Label>
                <Input
                  id="wages"
                  type="number"
                  step="0.01"
                  {...form.register("wages")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="business_income">Business Income (Schedule C)</Label>
                <Input
                  id="business_income"
                  type="number"
                  step="0.01"
                  {...form.register("business_income")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="investment_income">Investment Income (Interest, Dividends)</Label>
                <Input
                  id="investment_income"
                  type="number"
                  step="0.01"
                  {...form.register("investment_income")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="other_income">Other Income</Label>
                <Input
                  id="other_income"
                  type="number"
                  step="0.01"
                  {...form.register("other_income")}
                  className="mt-1"
                />
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Income:</span>
                <span>${calculations.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Deductions</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="standard_deduction">Standard Deduction</Label>
                <Input
                  id="standard_deduction"
                  type="number"
                  step="0.01"
                  {...form.register("standard_deduction")}
                  className="mt-1"
                />
              </div>
              <Separator />
              <h4 className="font-medium">Itemized Deductions</h4>
              <div>
                <Label htmlFor="mortgage_interest">Mortgage Interest</Label>
                <Input
                  id="mortgage_interest"
                  type="number"
                  step="0.01"
                  {...form.register("mortgage_interest")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="charitable_contributions">Charitable Contributions</Label>
                <Input
                  id="charitable_contributions"
                  type="number"
                  step="0.01"
                  {...form.register("charitable_contributions")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state_local_taxes">State & Local Taxes (SALT)</Label>
                <Input
                  id="state_local_taxes"
                  type="number"
                  step="0.01"
                  {...form.register("state_local_taxes")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="medical_expenses">Medical Expenses</Label>
                <Input
                  id="medical_expenses"
                  type="number"
                  step="0.01"
                  {...form.register("medical_expenses")}
                  className="mt-1"
                />
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Deductions:</span>
                <span>${calculations.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tax Credits & Payments</h3>
            <div className="grid gap-4">
              <h4 className="font-medium">Credits</h4>
              <div>
                <Label htmlFor="child_tax_credit">Child Tax Credit</Label>
                <Input
                  id="child_tax_credit"
                  type="number"
                  step="0.01"
                  {...form.register("child_tax_credit")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="education_credits">Education Credits</Label>
                <Input
                  id="education_credits"
                  type="number"
                  step="0.01"
                  {...form.register("education_credits")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="other_credits">Other Credits</Label>
                <Input
                  id="other_credits"
                  type="number"
                  step="0.01"
                  {...form.register("other_credits")}
                  className="mt-1"
                />
              </div>
              <Separator />
              <h4 className="font-medium">Payments</h4>
              <div>
                <Label htmlFor="federal_withholding">Federal Withholding</Label>
                <Input
                  id="federal_withholding"
                  type="number"
                  step="0.01"
                  {...form.register("federal_withholding")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="estimated_payments">Estimated Tax Payments</Label>
                <Input
                  id="estimated_payments"
                  type="number"
                  step="0.01"
                  {...form.register("estimated_payments")}
                  className="mt-1"
                />
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Credits:</span>
                <span>${calculations.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tax Return Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Income:</span>
                <span className="font-medium">${calculations.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adjusted Gross Income:</span>
                <span className="font-medium">${calculations.adjustedGrossIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deductions:</span>
                <span className="font-medium">${calculations.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxable Income:</span>
                <span className="font-medium">${calculations.taxableIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tax:</span>
                <span className="font-medium">${calculations.totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Credits:</span>
                <span className="font-medium">${calculations.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Federal Withholding:</span>
                <span className="font-medium">${form.watch("federal_withholding").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Payments:</span>
                <span className="font-medium">${form.watch("estimated_payments").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <Separator className="my-4" />
              {calculations.refundAmount > 0 ? (
                <div className="flex justify-between items-center text-xl font-bold text-green-600 dark:text-green-400">
                  <span>Estimated Refund:</span>
                  <span>${calculations.refundAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ) : (
                <div className="flex justify-between items-center text-xl font-bold text-red-600 dark:text-red-400">
                  <span>Amount Owed:</span>
                  <span>${calculations.amountOwed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Tax Return"}
        </Button>
      </div>
    </form>
  );
};