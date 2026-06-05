import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { PayrollTaxSetupWizard } from "@/components/payroll/PayrollTaxSetupWizard";
import { EmployeesTab } from "@/components/payroll/EmployeesTab";
import ContractorsTab from "@/components/payroll/ContractorsTab";
import BenefitsTab from "@/components/payroll/BenefitsTab";
import ComplianceTab from "@/components/payroll/ComplianceTab";
import { PayrollOverview } from "@/components/payroll/PayrollOverview";


const PayrollSetup = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Payroll</h1>
            <div className="flex gap-2">
              <Link to="/timesheets">
                <Button variant="outline">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Timesheets
                </Button>
              </Link>
              <Link to="/payroll-runs">
                <Button variant="outline">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Payroll Runs
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Employees
            </TabsTrigger>
            <TabsTrigger
              value="contractors"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Contractors
            </TabsTrigger>
            <TabsTrigger
              value="payroll-tax"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Payroll Tax
            </TabsTrigger>
            <TabsTrigger
              value="workers-comp"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Workers' Comp
            </TabsTrigger>
            <TabsTrigger
              value="benefits"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Benefits
            </TabsTrigger>
            <TabsTrigger
              value="hr-advisor"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              HR Advisor
            </TabsTrigger>
            <TabsTrigger
              value="compliance"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <PayrollOverview />
          </TabsContent>

          <TabsContent value="employees" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Employees</CardTitle>
                <CardDescription>Manage your employee information and payroll records</CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeesTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contractors" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contractors</CardTitle>
                <CardDescription>Manage your contractor information and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <ContractorsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll-tax" className="mt-6">
            <PayrollTaxSetupWizard />
          </TabsContent>

          <TabsContent value="workers-comp" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Workers' Compensation</CardTitle>
                <CardDescription>Manage workers' compensation insurance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>Workers' compensation management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
                <CardDescription>Manage employee benefits and deductions</CardDescription>
              </CardHeader>
              <CardContent>
                <BenefitsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hr-advisor" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>HR Advisor</CardTitle>
                <CardDescription>Get HR guidance and support</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>HR advisor resources coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
                <CardDescription>Stay compliant with labor laws and regulations</CardDescription>
              </CardHeader>
              <CardContent>
                <ComplianceTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PayrollSetup;
