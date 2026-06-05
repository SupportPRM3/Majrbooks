import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Calculator, HelpCircle, ExternalLink } from "lucide-react";
import TaxDocumentAnalysis from "@/components/tax-ai/TaxDocumentAnalysis";
import TaxQAChat from "@/components/tax-ai/TaxQAChat";

const TaxMajrAi = () => {

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Tax Majr AI
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered tax assistance for your practice
            </p>
          </div>
          <Button asChild>
            <a href="https://taxmajr.ai/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              Visit TaxMajr.ai
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Analysis
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Tax Calculations
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Tax Q&A
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <TaxDocumentAnalysis />
          </TabsContent>

          <TabsContent value="calculator">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Tax Calculations
                </CardTitle>
                <CardDescription>
                  Calculate estimated taxes and projections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Tax calculation features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qa">
            <TaxQAChat />
          </TabsContent>
        </Tabs>

        {/* Capabilities Overview */}
        <Card>
          <CardHeader>
            <CardTitle>What Tax Majr AI Can Help With</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Review tax documents and highlight key information
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Provide estimated quarterly tax calculations for review
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Suggest potential deductions and credits to explore
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Provide general information about tax regulations
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Create tax preparation checklists for reference
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Outline filing options and strategies for consideration
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4 border-t pt-4">
              <strong>Disclaimer:</strong> AI-generated insights are for informational purposes only and should be reviewed by a qualified tax professional before acting on them.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TaxMajrAi;
