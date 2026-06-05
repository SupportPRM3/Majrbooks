import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Check, X, AlertTriangle, Info, Shield, DollarSign, Users, FileText, Scale, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BusinessStructureComparison = () => {
  const navigate = useNavigate();

  const structures = [
    {
      id: "sole-prop",
      name: "Sole Proprietorship",
      icon: Users,
      description: "Simplest business structure for single owners",
      color: "bg-blue-500/10 text-blue-600",
      bestFor: "Solo freelancers, consultants, side hustles with low liability",
      taxForm: "Schedule C (Form 1040)",
      overview: "A sole proprietorship is the simplest and most common business structure. You and your business are considered the same legal entity.",
      pros: [
        "Easiest and cheapest to form",
        "Complete control over business decisions",
        "No separate business tax return required",
        "All profits go directly to you",
        "Minimal paperwork and compliance"
      ],
      cons: [
        "Unlimited personal liability for business debts",
        "Harder to raise capital or get business loans",
        "Self-employment tax on all profits (15.3%)",
        "Business ends when owner dies or leaves",
        "May appear less credible to clients"
      ],
      taxImplications: [
        "Report income/expenses on Schedule C",
        "Pay self-employment tax (Social Security + Medicare)",
        "Make quarterly estimated tax payments",
        "Deduct business expenses against income",
        "No ability to split income like S-Corp"
      ],
      formationSteps: [
        "Choose a business name",
        "Register DBA (Doing Business As) if using different name",
        "Get business licenses and permits",
        "Open a business bank account",
        "Get an EIN (optional but recommended)"
      ],
      annualCost: "$0 - $500",
      liability: "Unlimited Personal Liability"
    },
    {
      id: "llc",
      name: "LLC",
      icon: Shield,
      description: "Limited liability with flexible tax options",
      color: "bg-green-500/10 text-green-600",
      bestFor: "Small businesses wanting liability protection with flexibility",
      taxForm: "Schedule C, Form 1065, or Form 1120-S",
      overview: "A Limited Liability Company (LLC) provides personal liability protection while offering flexibility in how you're taxed.",
      pros: [
        "Limited liability protection for personal assets",
        "Flexible tax treatment (sole prop, partnership, or S-Corp)",
        "Less paperwork than corporations",
        "No ownership restrictions",
        "Pass-through taxation (no double taxation)"
      ],
      cons: [
        "Self-employment tax on all profits (unless electing S-Corp)",
        "Formation costs and annual fees vary by state",
        "Some states have franchise taxes or fees",
        "May be harder to raise venture capital",
        "Operating agreement recommended but not always required"
      ],
      taxImplications: [
        "Default: Taxed as sole proprietorship (single member) or partnership (multi-member)",
        "Can elect S-Corp taxation to save on self-employment tax",
        "Can elect C-Corp taxation (rare for small businesses)",
        "Pass-through taxation means no entity-level tax",
        "Quarterly estimated tax payments required"
      ],
      formationSteps: [
        "Choose a unique business name",
        "File Articles of Organization with state",
        "Create an Operating Agreement",
        "Get an EIN from the IRS",
        "Register for state taxes and licenses"
      ],
      annualCost: "$100 - $800/year (varies by state)",
      liability: "Limited Liability"
    },
    {
      id: "s-corp",
      name: "S-Corporation",
      icon: Briefcase,
      description: "Tax-efficient structure for profitable businesses",
      color: "bg-purple-500/10 text-purple-600",
      bestFor: "Profitable businesses with $40K+ net income seeking tax savings",
      taxForm: "Form 1120-S",
      overview: "An S-Corporation is a tax election that can be made by LLCs or Corporations, allowing profits to pass through while saving on self-employment taxes.",
      pros: [
        "Save on self-employment taxes (only salary is subject to FICA)",
        "Pass-through taxation (no double taxation)",
        "Limited liability protection",
        "Can appear more credible to clients",
        "Easier to transfer ownership than sole prop"
      ],
      cons: [
        "Must pay yourself a 'reasonable salary'",
        "More compliance requirements (payroll, filings)",
        "Ownership restrictions (100 shareholders max, US persons only)",
        "One class of stock only",
        "More expensive to maintain"
      ],
      taxImplications: [
        "Salary is subject to FICA taxes (15.3%)",
        "Distributions above salary are NOT subject to FICA",
        "Must file Form 1120-S annually (March 15 deadline)",
        "Shareholders receive K-1 for personal tax returns",
        "Reasonable salary must be paid before taking distributions"
      ],
      formationSteps: [
        "Form an LLC or Corporation first",
        "File Form 2553 with IRS to elect S-Corp status",
        "Set up payroll for owner-employees",
        "File annual Form 1120-S",
        "Issue K-1s to shareholders"
      ],
      annualCost: "$500 - $2,000/year (accounting + filing fees)",
      liability: "Limited Liability"
    },
    {
      id: "c-corp",
      name: "C-Corporation",
      icon: Building2,
      description: "Separate legal entity for growth-focused businesses",
      color: "bg-orange-500/10 text-orange-600",
      bestFor: "Businesses seeking investors, going public, or with significant profits to retain",
      taxForm: "Form 1120",
      overview: "A C-Corporation is a separate legal entity that provides the strongest liability protection but faces double taxation on profits.",
      pros: [
        "Strongest liability protection",
        "Unlimited growth potential",
        "Easier to raise capital from investors",
        "Can offer stock options to employees",
        "No limit on shareholders or ownership types"
      ],
      cons: [
        "Double taxation (corporate tax + dividend tax)",
        "Most complex and expensive to form/maintain",
        "Extensive record-keeping requirements",
        "Board of directors and corporate formalities required",
        "Less flexibility in distributions"
      ],
      taxImplications: [
        "Corporate tax rate is flat 21%",
        "Dividends taxed again when distributed to shareholders",
        "Can retain earnings in the business",
        "File Form 1120 annually (April 15 deadline)",
        "Can deduct salaries and benefits as business expenses"
      ],
      formationSteps: [
        "File Articles of Incorporation with state",
        "Create Bylaws",
        "Issue stock certificates",
        "Hold initial board meeting",
        "Get an EIN and register for state taxes"
      ],
      annualCost: "$1,000 - $5,000/year (accounting + compliance)",
      liability: "Limited Liability"
    }
  ];

  const comparisonTable = [
    { feature: "Liability Protection", soleProp: "None", llc: "Yes", sCorp: "Yes", cCorp: "Yes" },
    { feature: "Pass-Through Taxation", soleProp: "Yes", llc: "Yes", sCorp: "Yes", cCorp: "No" },
    { feature: "Self-Employment Tax Savings", soleProp: "No", llc: "No (unless S-Corp election)", sCorp: "Yes", cCorp: "N/A" },
    { feature: "Separate Tax Return", soleProp: "No", llc: "Depends", sCorp: "Yes", cCorp: "Yes" },
    { feature: "Formation Complexity", soleProp: "Very Low", llc: "Low", sCorp: "Medium", cCorp: "High" },
    { feature: "Ongoing Compliance", soleProp: "Minimal", llc: "Low", sCorp: "Medium", cCorp: "High" },
    { feature: "Investor Friendly", soleProp: "No", llc: "Limited", sCorp: "Limited", cCorp: "Yes" },
    { feature: "Ownership Restrictions", soleProp: "None", llc: "None", sCorp: "100 US shareholders max", cCorp: "None" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/resources")} className="gap-1 p-0 h-auto">
            <ArrowLeft className="h-4 w-4" />
            Resources
          </Button>
          <span>/</span>
          <span>Business Structure Comparison</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary/10 p-4 rounded-xl">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Business Structure Comparison</h1>
              <p className="text-muted-foreground">LLC vs S-Corp vs Sole Proprietorship vs C-Corp</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">Comparison Guide</Badge>
            <Badge variant="secondary">IRS Guidelines</Badge>
            <Badge variant="secondary">Tax Implications</Badge>
          </div>
        </motion.div>

        {/* Important Notice */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <Scale className="h-4 w-4" />
          <AlertTitle>Choosing the Right Structure</AlertTitle>
          <AlertDescription>
            Your business structure affects your taxes, personal liability, and administrative requirements. 
            Consult with a CPA and attorney before making this decision.
          </AlertDescription>
        </Alert>

        {/* Quick Comparison Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Comparison</CardTitle>
            <CardDescription>Side-by-side feature comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 font-medium">Feature</th>
                    <th className="text-center py-3 font-medium">Sole Prop</th>
                    <th className="text-center py-3 font-medium">LLC</th>
                    <th className="text-center py-3 font-medium">S-Corp</th>
                    <th className="text-center py-3 font-medium">C-Corp</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-3 font-medium">{row.feature}</td>
                      <td className="py-3 text-center">
                        {row.soleProp === "Yes" ? <Check className="h-4 w-4 text-green-500 mx-auto" /> :
                         row.soleProp === "No" ? <X className="h-4 w-4 text-red-500 mx-auto" /> :
                         <span className="text-muted-foreground text-xs">{row.soleProp}</span>}
                      </td>
                      <td className="py-3 text-center">
                        {row.llc === "Yes" ? <Check className="h-4 w-4 text-green-500 mx-auto" /> :
                         row.llc === "No" ? <X className="h-4 w-4 text-red-500 mx-auto" /> :
                         <span className="text-muted-foreground text-xs">{row.llc}</span>}
                      </td>
                      <td className="py-3 text-center">
                        {row.sCorp === "Yes" ? <Check className="h-4 w-4 text-green-500 mx-auto" /> :
                         row.sCorp === "No" ? <X className="h-4 w-4 text-red-500 mx-auto" /> :
                         <span className="text-muted-foreground text-xs">{row.sCorp}</span>}
                      </td>
                      <td className="py-3 text-center">
                        {row.cCorp === "Yes" ? <Check className="h-4 w-4 text-green-500 mx-auto" /> :
                         row.cCorp === "No" ? <X className="h-4 w-4 text-red-500 mx-auto" /> :
                         <span className="text-muted-foreground text-xs">{row.cCorp}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Structure Cards */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Detailed Breakdown</h2>
          <Tabs defaultValue="sole-prop">
            <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
              {structures.map((structure) => (
                <TabsTrigger 
                  key={structure.id} 
                  value={structure.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {structure.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {structures.map((structure) => (
              <TabsContent key={structure.id} value={structure.id} className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${structure.color}`}>
                        <structure.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle>{structure.name}</CardTitle>
                        <CardDescription>{structure.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium text-sm text-muted-foreground">Tax Form</h4>
                        <p className="font-semibold">{structure.taxForm}</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium text-sm text-muted-foreground">Annual Cost</h4>
                        <p className="font-semibold">{structure.annualCost}</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium text-sm text-muted-foreground">Liability</h4>
                        <p className="font-semibold">{structure.liability}</p>
                      </div>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Best For:</h4>
                      <p className="text-muted-foreground">{structure.bestFor}</p>
                    </div>

                    <p className="text-muted-foreground">{structure.overview}</p>

                    <Separator />

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Advantages
                        </h4>
                        <ul className="space-y-2">
                          {structure.pros.map((pro, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                          <X className="h-4 w-4" />
                          Disadvantages
                        </h4>
                        <ul className="space-y-2">
                          {structure.cons.map((con, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Tax Implications
                      </h4>
                      <ul className="space-y-2">
                        {structure.taxImplications.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        How to Form
                      </h4>
                      <ol className="space-y-2">
                        {structure.formationSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                              {idx + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* When to Change Structure */}
        <Card className="mb-8 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              When to Consider Changing Your Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Net profit exceeds $40,000 (consider S-Corp)",
                "You want to limit personal liability (form an LLC)",
                "You're seeking investors (consider C-Corp)",
                "Self-employment taxes are becoming significant",
                "You want to hire employees",
                "Your business is growing significantly"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-yellow-500" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Need Help Choosing a Structure?</h3>
                <p className="text-muted-foreground">MAJR Books works with all business structures. Start tracking your finances today.</p>
              </div>
              <Button onClick={() => navigate("/settings")}>
                Update Business Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessStructureComparison;
