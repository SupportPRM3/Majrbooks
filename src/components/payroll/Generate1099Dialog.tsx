import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generate1099PDF } from "@/lib/generate1099";
import { FileDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Generate1099DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Generate1099Dialog({ open, onOpenChange }: Generate1099DialogProps) {
  const queryClient = useQueryClient();
  const [selectedContractor, setSelectedContractor] = useState("");
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [payerInfo, setPayerInfo] = useState({
    name: "",
    tin: "",
    address: "",
    city: "",
    state: "",
    zip: ""
  });
  const [taxWithholding, setTaxWithholding] = useState({
    federalTaxWithheld: "",
    stateTaxWithheld: "",
    statePayerNumber: "",
    stateIncome: ""
  });
  const [sendEmail, setSendEmail] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Load default payer information from profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name, ein, business_address, business_city, business_state, business_zip")
        .eq("id", user.id)
        .single();

      if (profile) {
        setPayerInfo({
          name: profile.business_name || "",
          tin: profile.ein || "",
          address: profile.business_address || "",
          city: profile.business_city || "",
          state: profile.business_state || "",
          zip: profile.business_zip || "",
        });
      }
    };

    if (open) {
      loadProfile();
    }
  }, [open]);

  const { data: contractors } = useQuery({
    queryKey: ["contractors_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  // Get selected contractor details for checklist
  const selectedContractorData = contractors?.find(c => c.id === selectedContractor);

  // Checklist validation
  const checklistItems = selectedContractorData ? [
    { 
      label: "Contractor has Tax ID/SSN", 
      valid: !!selectedContractorData.tax_id,
      required: true 
    },
    { 
      label: "Contractor has complete address", 
      valid: !!(selectedContractorData.address && selectedContractorData.city && selectedContractorData.state && selectedContractorData.zip_code),
      required: true 
    },
    { 
      label: "Contractor has email for sending", 
      valid: !!selectedContractorData.email,
      required: false 
    },
    { 
      label: "Payer business name provided", 
      valid: !!payerInfo.name,
      required: true 
    },
    { 
      label: "Payer TIN/EIN provided", 
      valid: !!payerInfo.tin && /^\d{2}-\d{7}$/.test(payerInfo.tin),
      required: true 
    },
    { 
      label: "Payer complete address provided", 
      valid: !!(payerInfo.address && payerInfo.city && payerInfo.state && payerInfo.zip),
      required: true 
    }
  ] : [];

  const allRequiredValid = checklistItems.filter(item => item.required).every(item => item.valid);
  const validCount = checklistItems.filter(item => item.valid).length;

  const handleGenerate = async () => {
    if (!selectedContractor) {
      toast.error("Please select a contractor");
      return;
    }

    if (!payerInfo.name || !payerInfo.tin) {
      toast.error("Please fill in payer information");
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get contractor details
      const contractor = contractors?.find(c => c.id === selectedContractor);
      if (!contractor) throw new Error("Contractor not found");

      // Get payments for the tax year
      const { data: payments, error: paymentsError } = await supabase
        .from("contractor_payments")
        .select("*")
        .eq("contractor_id", selectedContractor)
        .eq("tax_year", taxYear);

      if (paymentsError) throw paymentsError;

      if (!payments || payments.length === 0) {
        toast.error("No payments found for this contractor in the selected tax year");
        return;
      }

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

      if (totalAmount < 600) {
        toast.info(`Total payments ($${totalAmount.toFixed(2)}) are below the $600 threshold. 1099 may not be required.`);
      }

      const taxWithholdingData = {
        federalTaxWithheld: taxWithholding.federalTaxWithheld ? parseFloat(taxWithholding.federalTaxWithheld) : 0,
        stateTaxWithheld: taxWithholding.stateTaxWithheld ? parseFloat(taxWithholding.stateTaxWithheld) : 0,
        statePayerNumber: taxWithholding.statePayerNumber,
        stateIncome: taxWithholding.stateIncome ? parseFloat(taxWithholding.stateIncome) : totalAmount
      };

      // Generate PDF with optional tax withholding
      const pdf = generate1099PDF(contractor, payments, taxYear, payerInfo, taxWithholdingData);
      
      // Download PDF
      const fileName = `1099-NEC-${taxYear}-${contractor.first_name}-${contractor.last_name}.pdf`;
      pdf.save(fileName);

      // Save to generated_1099s table
      const { error: insertError } = await supabase
        .from("generated_1099s")
        .insert({
          contractor_id: selectedContractor,
          user_id: user.id,
          tax_year: taxYear,
          total_compensation: totalAmount,
          federal_tax_withheld: taxWithholdingData.federalTaxWithheld || null,
          state_tax_withheld: taxWithholdingData.stateTaxWithheld || null,
          state_income: taxWithholdingData.stateIncome || null,
          state_payer_number: taxWithholdingData.statePayerNumber || null,
          payer_name: payerInfo.name,
          payer_tin: payerInfo.tin,
          payer_address: payerInfo.address,
          payer_city: payerInfo.city,
          payer_state: payerInfo.state,
          payer_zip: payerInfo.zip,
          status: "generated"
        });

      if (insertError) throw insertError;

      // Mark payments as 1099 generated
      const { error: updateError } = await supabase
        .from("contractor_payments")
        .update({ is_1099_generated: true })
        .in("id", payments.map(p => p.id));

      if (updateError) throw updateError;

      // Invalidate queries to refresh the 1099 table
      queryClient.invalidateQueries({ queryKey: ["generated-1099s"] });

      toast.success("1099 form generated and saved successfully");

      // Send email if requested
      if (sendEmail && contractor.email) {
        toast.info("Email functionality will be implemented with Resend integration");
      }

      // Reset form
      setSelectedContractor("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate 1099-NEC Form</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          
          {selectedContractor && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {allRequiredValid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span>
                    Preparation Checklist: {validCount}/{checklistItems.length} items complete
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChecklist(!showChecklist)}
                >
                  {showChecklist ? "Hide" : "Show"} Checklist
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {showChecklist && selectedContractor && (
            <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
              <h4 className="font-semibold text-sm mb-3">1099 Preparation Checklist</h4>
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {item.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className={item.valid ? "text-foreground" : "text-muted-foreground"}>
                    {item.label}
                  </span>
                  {item.required && (
                    <Badge variant="secondary" className="ml-auto text-xs">Required</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="tax_year">Tax Year</Label>
            <Input
              id="tax_year"
              type="number"
              value={taxYear}
              onChange={(e) => setTaxYear(parseInt(e.target.value))}
              min={2020}
              max={new Date().getFullYear()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractor">Select Contractor *</Label>
            <Select value={selectedContractor} onValueChange={setSelectedContractor}>
              <SelectTrigger>
                <SelectValue placeholder="Choose contractor" />
              </SelectTrigger>
              <SelectContent>
                {contractors?.map((contractor) => (
                  <SelectItem key={contractor.id} value={contractor.id}>
                    {contractor.first_name} {contractor.last_name}
                    {contractor.business_name && ` (${contractor.business_name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold mb-3">Payer Information (Your Business)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="payer_name">Business Name *</Label>
                <Input
                  id="payer_name"
                  value={payerInfo.name}
                  onChange={(e) => setPayerInfo({ ...payerInfo, name: e.target.value })}
                  placeholder="Your Business Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer_tin">TIN/EIN *</Label>
                <Input
                  id="payer_tin"
                  value={payerInfo.tin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d-]/g, '');
                    setPayerInfo({ ...payerInfo, tin: value });
                  }}
                  placeholder="XX-XXXXXXX"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer_address">Address</Label>
                <Input
                  id="payer_address"
                  value={payerInfo.address}
                  onChange={(e) => setPayerInfo({ ...payerInfo, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer_city">City</Label>
                <Input
                  id="payer_city"
                  value={payerInfo.city}
                  onChange={(e) => setPayerInfo({ ...payerInfo, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer_state">State</Label>
                <Input
                  id="payer_state"
                  value={payerInfo.state}
                  onChange={(e) => setPayerInfo({ ...payerInfo, state: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="payer_zip">ZIP Code</Label>
                <Input
                  id="payer_zip"
                  value={payerInfo.zip}
                  onChange={(e) => setPayerInfo({ ...payerInfo, zip: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-3">Tax Withholding (Optional)</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Complete these fields if federal or state taxes were withheld from contractor payments
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="federal_tax">Box 4 - Federal Income Tax Withheld</Label>
                  <Input
                    id="federal_tax"
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxWithholding.federalTaxWithheld}
                    onChange={(e) => setTaxWithholding({ ...taxWithholding, federalTaxWithheld: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state_tax">Box 5 - State Tax Withheld</Label>
                  <Input
                    id="state_tax"
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxWithholding.stateTaxWithheld}
                    onChange={(e) => setTaxWithholding({ ...taxWithholding, stateTaxWithheld: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state_payer_no">Box 6 - State/Payer's State No.</Label>
                  <Input
                    id="state_payer_no"
                    value={taxWithholding.statePayerNumber}
                    onChange={(e) => setTaxWithholding({ ...taxWithholding, statePayerNumber: e.target.value })}
                    placeholder="State employer ID"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state_income">Box 7 - State Income</Label>
                  <Input
                    id="state_income"
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxWithholding.stateIncome}
                    onChange={(e) => setTaxWithholding({ ...taxWithholding, stateIncome: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t pt-4">
            <input
              type="checkbox"
              id="send_email"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="send_email" className="cursor-pointer">
              Send copy via email to contractor
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={!allRequiredValid}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Generate 1099
            </Button>
          </div>
          
          {!allRequiredValid && selectedContractor && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please complete all required checklist items before generating the 1099 form.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
