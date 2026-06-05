import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ChevronRight, CheckCircle2 } from "lucide-react";

interface TaxSetup {
  federalEIN?: string;
  stateEIN?: string;
  federalWithholdingRate?: number;
  stateWithholdingRate?: number;
  socialSecurityRate?: number;
  medicareRate?: number;
  filingFrequency?: string;
  depositSchedule?: string;
  autoCalculate?: boolean;
}

export const PayrollTaxSetupWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [taxSetup, setTaxSetup] = useState<TaxSetup>({
    socialSecurityRate: 6.2,
    medicareRate: 1.45,
    autoCalculate: true,
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    toast.success("Payroll tax setup completed successfully!");
    console.log("Tax Setup Data:", taxSetup);
  };

  const updateTaxSetup = (field: keyof TaxSetup, value: any) => {
    setTaxSetup((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>Payroll Tax Setup Wizard</CardTitle>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Business Tax Identification</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter your business tax identification numbers for federal and state payroll taxes.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="federalEIN">Federal Employer Identification Number (EIN)</Label>
                  <Input
                    id="federalEIN"
                    placeholder="XX-XXXXXXX"
                    value={taxSetup.federalEIN || ""}
                    onChange={(e) => updateTaxSetup("federalEIN", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is your 9-digit federal tax ID number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stateEIN">State Employer Identification Number</Label>
                  <Input
                    id="stateEIN"
                    placeholder="Enter state EIN"
                    value={taxSetup.stateEIN || ""}
                    onChange={(e) => updateTaxSetup("stateEIN", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for state payroll tax reporting
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Tax Rates Configuration</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure the tax rates that will be applied to payroll calculations.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="federalRate">Federal Withholding Rate (%)</Label>
                  <Input
                    id="federalRate"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={taxSetup.federalWithholdingRate || ""}
                    onChange={(e) =>
                      updateTaxSetup("federalWithholdingRate", parseFloat(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stateRate">State Withholding Rate (%)</Label>
                  <Input
                    id="stateRate"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={taxSetup.stateWithholdingRate || ""}
                    onChange={(e) =>
                      updateTaxSetup("stateWithholdingRate", parseFloat(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialSecurity">Social Security Rate (%)</Label>
                  <Input
                    id="socialSecurity"
                    type="number"
                    step="0.01"
                    value={taxSetup.socialSecurityRate || ""}
                    onChange={(e) =>
                      updateTaxSetup("socialSecurityRate", parseFloat(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Standard rate: 6.2%</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicare">Medicare Rate (%)</Label>
                  <Input
                    id="medicare"
                    type="number"
                    step="0.01"
                    value={taxSetup.medicareRate || ""}
                    onChange={(e) => updateTaxSetup("medicareRate", parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Standard rate: 1.45%</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Filing Schedules</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Set up your tax filing and deposit schedules based on your business requirements.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filingFrequency">Filing Frequency</Label>
                  <Select
                    value={taxSetup.filingFrequency || ""}
                    onValueChange={(value) => updateTaxSetup("filingFrequency", value)}
                  >
                    <SelectTrigger id="filingFrequency">
                      <SelectValue placeholder="Select filing frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How often you need to file payroll tax returns
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositSchedule">Deposit Schedule</Label>
                  <Select
                    value={taxSetup.depositSchedule || ""}
                    onValueChange={(value) => updateTaxSetup("depositSchedule", value)}
                  >
                    <SelectTrigger id="depositSchedule">
                      <SelectValue placeholder="Select deposit schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semi-weekly">Semi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="next-day">Next Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How often you need to deposit payroll taxes
                  </p>
                </div>

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Filing Deadlines</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Form 941 (Quarterly):</span>
                      <span className="font-medium">
                        Last day of month following quarter end
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Form 940 (Annual):</span>
                      <span className="font-medium">January 31</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">W-2 Forms:</span>
                      <span className="font-medium">January 31</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Automatic Calculations</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure automatic tax calculation settings for payroll processing.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoCalculate">Enable Automatic Tax Calculations</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically calculate taxes based on configured rates
                    </p>
                  </div>
                  <Switch
                    id="autoCalculate"
                    checked={taxSetup.autoCalculate}
                    onCheckedChange={(checked) => updateTaxSetup("autoCalculate", checked)}
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tax Calculation Preview</CardTitle>
                    <CardDescription>
                      Example calculation for $5,000 gross pay
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross Pay:</span>
                      <span className="font-medium">$5,000.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Federal Withholding:</span>
                      <span className="font-medium">
                        $
                        {(
                          (5000 * (taxSetup.federalWithholdingRate || 0)) /
                          100
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">State Withholding:</span>
                      <span className="font-medium">
                        $
                        {((5000 * (taxSetup.stateWithholdingRate || 0)) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Social Security:</span>
                      <span className="font-medium">
                        ${((5000 * (taxSetup.socialSecurityRate || 0)) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Medicare:</span>
                      <span className="font-medium">
                        ${((5000 * (taxSetup.medicareRate || 0)) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Net Pay:</span>
                      <span>
                        $
                        {(
                          5000 -
                          (5000 * (taxSetup.federalWithholdingRate || 0)) / 100 -
                          (5000 * (taxSetup.stateWithholdingRate || 0)) / 100 -
                          (5000 * (taxSetup.socialSecurityRate || 0)) / 100 -
                          (5000 * (taxSetup.medicareRate || 0)) / 100
                        ).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Setup Complete</p>
                      <p className="text-muted-foreground">
                        You're ready to process payroll with automatic tax calculations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Button onClick={handleNext}>
              {currentStep === totalSteps ? (
                "Complete Setup"
              ) : (
                <>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
