import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, DollarSign, Calculator, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Employee {
  id: string;
  name: string;
  salary: string;
  payType: "hourly" | "salary";
  hoursPerWeek: string;
}

const PayrollCostEstimator = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([
    { id: "1", name: "Employee 1", salary: "", payType: "salary", hoursPerWeek: "40" }
  ]);
  const [benefitsPercent, setBenefitsPercent] = useState<string>("20");
  const [workersCompPercent, setWorkersCompPercent] = useState<string>("1.5");
  const [unemploymentPercent, setUnemploymentPercent] = useState<string>("3");

  // Tax rates
  const SOCIAL_SECURITY_RATE = 0.062;
  const MEDICARE_RATE = 0.0145;
  const SOCIAL_SECURITY_WAGE_BASE = 168600; // 2024

  const addEmployee = () => {
    setEmployees([
      ...employees,
      { id: Date.now().toString(), name: `Employee ${employees.length + 1}`, salary: "", payType: "salary", hoursPerWeek: "40" }
    ]);
  };

  const removeEmployee = (id: string) => {
    if (employees.length > 1) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const updateEmployee = (id: string, field: keyof Employee, value: string) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const calculateAnnualSalary = (emp: Employee): number => {
    const salary = parseFloat(emp.salary) || 0;
    const hours = parseFloat(emp.hoursPerWeek) || 40;
    if (emp.payType === "hourly") {
      return salary * hours * 52;
    }
    return salary;
  };

  const benefitsRate = (parseFloat(benefitsPercent) || 0) / 100;
  const workersCompRate = (parseFloat(workersCompPercent) || 0) / 100;
  const unemploymentRate = (parseFloat(unemploymentPercent) || 0) / 100;

  const totalGrossWages = employees.reduce((sum, emp) => sum + calculateAnnualSalary(emp), 0);
  
  const employerSocialSecurity = employees.reduce((sum, emp) => {
    const annual = calculateAnnualSalary(emp);
    const taxableWage = Math.min(annual, SOCIAL_SECURITY_WAGE_BASE);
    return sum + (taxableWage * SOCIAL_SECURITY_RATE);
  }, 0);
  
  const employerMedicare = totalGrossWages * MEDICARE_RATE;
  const employerFICA = employerSocialSecurity + employerMedicare;
  
  const benefitsCost = totalGrossWages * benefitsRate;
  const workersCompCost = totalGrossWages * workersCompRate;
  const unemploymentCost = totalGrossWages * unemploymentRate;
  
  const totalEmployerCosts = employerFICA + benefitsCost + workersCompCost + unemploymentCost;
  const totalPayrollCost = totalGrossWages + totalEmployerCosts;
  const costPerEmployee = employees.length > 0 ? totalPayrollCost / employees.length : 0;
  const monthlyPayrollCost = totalPayrollCost / 12;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/resources")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resources
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Payroll Cost Estimator</h1>
          <p className="text-muted-foreground mt-2">Calculate total employer costs including taxes and benefits</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Employees
                  </span>
                  <Button size="sm" onClick={addEmployee}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Employee
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employees.map((emp) => (
                  <div key={emp.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={emp.name}
                        onChange={(e) => updateEmployee(emp.id, "name", e.target.value)}
                        className="max-w-[200px] font-medium"
                      />
                      {employees.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeEmployee(emp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Pay Type</Label>
                        <Select
                          value={emp.payType}
                          onValueChange={(value) => updateEmployee(emp.id, "payType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="salary">Annual Salary</SelectItem>
                            <SelectItem value="hourly">Hourly Rate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {emp.payType === "hourly" ? "Hourly Rate ($)" : "Annual Salary ($)"}
                        </Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={emp.salary}
                          onChange={(e) => updateEmployee(emp.id, "salary", e.target.value)}
                        />
                      </div>
                      {emp.payType === "hourly" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Hours/Week</Label>
                          <Input
                            type="number"
                            value={emp.hoursPerWeek}
                            onChange={(e) => updateEmployee(emp.id, "hoursPerWeek", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Annual: {formatCurrency(calculateAnnualSalary(emp))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Employer Cost Rates
                </CardTitle>
                <CardDescription>Adjust rates based on your business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="benefits">Benefits (%)</Label>
                    <Input
                      id="benefits"
                      type="number"
                      value={benefitsPercent}
                      onChange={(e) => setBenefitsPercent(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Health, 401k, etc.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workerscomp">Workers' Comp (%)</Label>
                    <Input
                      id="workerscomp"
                      type="number"
                      value={workersCompPercent}
                      onChange={(e) => setWorkersCompPercent(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Varies by industry</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unemployment">Unemployment (%)</Label>
                    <Input
                      id="unemployment"
                      type="number"
                      value={unemploymentPercent}
                      onChange={(e) => setUnemploymentPercent(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">FUTA + SUTA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Cost Summary
              </CardTitle>
              <CardDescription>Annual employer costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gross Wages</span>
                  <span>{formatCurrency(totalGrossWages)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Social Security (6.2%)</span>
                  <span>{formatCurrency(employerSocialSecurity)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Medicare (1.45%)</span>
                  <span>{formatCurrency(employerMedicare)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Benefits ({benefitsPercent}%)</span>
                  <span>{formatCurrency(benefitsCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Workers' Comp ({workersCompPercent}%)</span>
                  <span>{formatCurrency(workersCompCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unemployment ({unemploymentPercent}%)</span>
                  <span>{formatCurrency(unemploymentCost)}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Employer Costs</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(totalEmployerCosts)}</span>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Annual Cost</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(totalPayrollCost)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Cost</span>
                  <span className="font-semibold">{formatCurrency(monthlyPayrollCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Cost Per Employee</span>
                  <span className="font-semibold">{formatCurrency(costPerEmployee)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Disclaimer:</strong> This calculator provides estimates based on 2024 tax rates.
              Actual costs may vary. Consult with a qualified accountant or payroll specialist.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayrollCostEstimator;
