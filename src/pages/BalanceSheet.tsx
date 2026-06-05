import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download, TrendingUp, TrendingDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AccountData {
  id: string;
  name: string;
  account_type: string;
  detail_type: string;
  balance: number;
}

interface BalanceSheetData {
  currentAssets: AccountData[];
  fixedAssets: AccountData[];
  currentLiabilities: AccountData[];
  longTermLiabilities: AccountData[];
  equity: AccountData[];
  totalCurrentAssets: number;
  totalFixedAssets: number;
  totalAssets: number;
  totalCurrentLiabilities: number;
  totalLongTermLiabilities: number;
  totalLiabilities: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
}

export default function BalanceSheet() {
  const [date, setDate] = useState<Date>(new Date());
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [compareData, setCompareData] = useState<BalanceSheetData | null>(null);
  const [comparisonType, setComparisonType] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBalanceSheetData = async (asOfDate: Date): Promise<BalanceSheetData> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    // Fetch all accounts with their balances
    const { data: accounts, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("user_id", user.user.id)
      .eq("is_active", true);

    if (error) throw error;

    const accountsWithBalance: AccountData[] = (accounts || []).map((account) => ({
      id: account.id,
      name: account.name,
      account_type: account.account_type,
      detail_type: account.detail_type,
      balance: account.bank_balance || account.quickbooks_balance || 0,
    }));

    // Categorize accounts
    const currentAssets = accountsWithBalance.filter(
      (a) => a.account_type === "Asset" && (a.detail_type.includes("Current") || a.detail_type.includes("Cash") || a.detail_type.includes("Bank"))
    );
    const fixedAssets = accountsWithBalance.filter(
      (a) => a.account_type === "Asset" && (a.detail_type.includes("Fixed") || a.detail_type.includes("Property") || a.detail_type.includes("Equipment"))
    );
    const currentLiabilities = accountsWithBalance.filter(
      (a) => a.account_type === "Liability" && a.detail_type.includes("Current")
    );
    const longTermLiabilities = accountsWithBalance.filter(
      (a) => a.account_type === "Liability" && (a.detail_type.includes("Long") || a.detail_type.includes("Term"))
    );
    const equity = accountsWithBalance.filter((a) => a.account_type === "Equity");

    const totalCurrentAssets = currentAssets.reduce((sum, a) => sum + a.balance, 0);
    const totalFixedAssets = fixedAssets.reduce((sum, a) => sum + a.balance, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    const totalCurrentLiabilities = currentLiabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalLongTermLiabilities = longTermLiabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      currentAssets,
      fixedAssets,
      currentLiabilities,
      longTermLiabilities,
      equity,
      totalCurrentAssets,
      totalFixedAssets,
      totalAssets,
      totalCurrentLiabilities,
      totalLongTermLiabilities,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity,
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const currentData = await fetchBalanceSheetData(date);
        setData(currentData);

        const compareDate = comparisonType === "month" ? subMonths(date, 1) : subYears(date, 1);
        const previousData = await fetchBalanceSheetData(compareDate);
        setCompareData(previousData);
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

    loadData();
  }, [date, comparisonType]);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { amount: current, percentage: 0 };
    const amount = current - previous;
    const percentage = (amount / previous) * 100;
    return { amount, percentage };
  };

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.text("Balance Sheet", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`As of ${format(date, "MMMM dd, yyyy")}`, pageWidth / 2, 28, { align: "center" });

    let yPos = 40;

    // Assets Section
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("ASSETS", 14, yPos);
    yPos += 8;

    // Current Assets
    doc.setFontSize(12);
    doc.text("Current Assets", 14, yPos);
    yPos += 6;

    const currentAssetsData = data.currentAssets.map((a) => [a.name, `$${a.balance.toFixed(2)}`]);
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: currentAssetsData,
      margin: { left: 20 },
      theme: "plain",
    });
    yPos = (doc as any).lastAutoTable.finalY + 2;

    doc.setFont(undefined, "bold");
    doc.text(`Total Current Assets: $${data.totalCurrentAssets.toFixed(2)}`, 20, yPos);
    yPos += 8;

    // Fixed Assets
    doc.setFont(undefined, "normal");
    doc.text("Fixed Assets", 14, yPos);
    yPos += 6;

    const fixedAssetsData = data.fixedAssets.map((a) => [a.name, `$${a.balance.toFixed(2)}`]);
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: fixedAssetsData,
      margin: { left: 20 },
      theme: "plain",
    });
    yPos = (doc as any).lastAutoTable.finalY + 2;

    doc.setFont(undefined, "bold");
    doc.text(`Total Fixed Assets: $${data.totalFixedAssets.toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.setFontSize(14);
    doc.text(`TOTAL ASSETS: $${data.totalAssets.toFixed(2)}`, 14, yPos);
    yPos += 12;

    // Liabilities Section
    doc.text("LIABILITIES", 14, yPos);
    yPos += 8;

    // Current Liabilities
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text("Current Liabilities", 14, yPos);
    yPos += 6;

    const currentLiabilitiesData = data.currentLiabilities.map((a) => [a.name, `$${a.balance.toFixed(2)}`]);
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: currentLiabilitiesData,
      margin: { left: 20 },
      theme: "plain",
    });
    yPos = (doc as any).lastAutoTable.finalY + 2;

    doc.setFont(undefined, "bold");
    doc.text(`Total Current Liabilities: $${data.totalCurrentLiabilities.toFixed(2)}`, 20, yPos);
    yPos += 8;

    // Long-term Liabilities
    doc.setFont(undefined, "normal");
    doc.text("Long-term Liabilities", 14, yPos);
    yPos += 6;

    const longTermLiabilitiesData = data.longTermLiabilities.map((a) => [a.name, `$${a.balance.toFixed(2)}`]);
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: longTermLiabilitiesData,
      margin: { left: 20 },
      theme: "plain",
    });
    yPos = (doc as any).lastAutoTable.finalY + 2;

    doc.setFont(undefined, "bold");
    doc.text(`Total Long-term Liabilities: $${data.totalLongTermLiabilities.toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.setFontSize(14);
    doc.text(`TOTAL LIABILITIES: $${data.totalLiabilities.toFixed(2)}`, 14, yPos);
    yPos += 12;

    // Equity Section
    doc.text("EQUITY", 14, yPos);
    yPos += 8;

    doc.setFontSize(12);
    const equityData = data.equity.map((a) => [a.name, `$${a.balance.toFixed(2)}`]);
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: equityData,
      margin: { left: 20 },
      theme: "plain",
    });
    yPos = (doc as any).lastAutoTable.finalY + 2;

    doc.setFont(undefined, "bold");
    doc.setFontSize(14);
    doc.text(`TOTAL EQUITY: $${data.totalEquity.toFixed(2)}`, 14, yPos);
    yPos += 8;
    doc.text(`TOTAL LIABILITIES & EQUITY: $${data.totalLiabilitiesAndEquity.toFixed(2)}`, 14, yPos);

    doc.save(`balance-sheet-${format(date, "yyyy-MM-dd")}.pdf`);

    toast({
      title: "Success",
      description: "Balance sheet exported to PDF",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const assetsChange = compareData ? calculateChange(data!.totalAssets, compareData.totalAssets) : null;
  const liabilitiesChange = compareData ? calculateChange(data!.totalLiabilities, compareData.totalLiabilities) : null;
  const equityChange = compareData ? calculateChange(data!.totalEquity, compareData.totalEquity) : null;

  const chartData = [
    { name: "Current Assets", value: data?.totalCurrentAssets || 0 },
    { name: "Fixed Assets", value: data?.totalFixedAssets || 0 },
    { name: "Current Liabilities", value: data?.totalCurrentLiabilities || 0 },
    { name: "Long-term Liabilities", value: data?.totalLongTermLiabilities || 0 },
    { name: "Equity", value: data?.totalEquity || 0 },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--primary) / 0.7)", "hsl(var(--destructive))", "hsl(var(--destructive) / 0.7)", "hsl(var(--chart-2))"];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Balance Sheet</h1>
            <p className="text-muted-foreground mt-1">Financial position overview</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
              </PopoverContent>
            </Popover>
            <Button
              variant={comparisonType === "month" ? "default" : "outline"}
              onClick={() => setComparisonType("month")}
            >
              MoM
            </Button>
            <Button
              variant={comparisonType === "year" ? "default" : "outline"}
              onClick={() => setComparisonType("year")}
            >
              YoY
            </Button>
            <Button onClick={exportToPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <h3 className="text-2xl font-bold mt-2">${data?.totalAssets.toFixed(2)}</h3>
                {assetsChange && (
                  <div className="flex items-center gap-2 mt-2">
                    {assetsChange.amount >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={cn("text-sm font-medium", assetsChange.amount >= 0 ? "text-green-500" : "text-red-500")}>
                      {assetsChange.percentage.toFixed(1)}% vs {comparisonType === "month" ? "last month" : "last year"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Liabilities</p>
                <h3 className="text-2xl font-bold mt-2">${data?.totalLiabilities.toFixed(2)}</h3>
                {liabilitiesChange && (
                  <div className="flex items-center gap-2 mt-2">
                    {liabilitiesChange.amount >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                    <span className={cn("text-sm font-medium", liabilitiesChange.amount >= 0 ? "text-red-500" : "text-green-500")}>
                      {Math.abs(liabilitiesChange.percentage).toFixed(1)}% vs {comparisonType === "month" ? "last month" : "last year"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Equity</p>
                <h3 className="text-2xl font-bold mt-2">${data?.totalEquity.toFixed(2)}</h3>
                {equityChange && (
                  <div className="flex items-center gap-2 mt-2">
                    {equityChange.amount >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={cn("text-sm font-medium", equityChange.amount >= 0 ? "text-green-500" : "text-red-500")}>
                      {equityChange.percentage.toFixed(1)}% vs {comparisonType === "month" ? "last month" : "last year"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Financial Position Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Detailed Balance Sheet */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Detailed Balance Sheet</h2>

          {/* Assets */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-primary">ASSETS</h3>

            <div className="ml-4">
              <h4 className="font-semibold mb-2">Current Assets</h4>
              <div className="space-y-2 ml-4">
                {data?.currentAssets.map((account) => (
                  <div key={account.id} className="flex justify-between text-sm">
                    <span>{account.name}</span>
                    <span className="font-medium">${account.balance.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold mt-2 ml-4 pt-2 border-t">
                <span>Total Current Assets</span>
                <span>${data?.totalCurrentAssets.toFixed(2)}</span>
              </div>
            </div>

            <div className="ml-4 mt-4">
              <h4 className="font-semibold mb-2">Fixed Assets</h4>
              <div className="space-y-2 ml-4">
                {data?.fixedAssets.map((account) => (
                  <div key={account.id} className="flex justify-between text-sm">
                    <span>{account.name}</span>
                    <span className="font-medium">${account.balance.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold mt-2 ml-4 pt-2 border-t">
                <span>Total Fixed Assets</span>
                <span>${data?.totalFixedAssets.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t-2">
              <span>TOTAL ASSETS</span>
              <span>${data?.totalAssets.toFixed(2)}</span>
            </div>
          </div>

          {/* Liabilities */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-destructive">LIABILITIES</h3>

            <div className="ml-4">
              <h4 className="font-semibold mb-2">Current Liabilities</h4>
              <div className="space-y-2 ml-4">
                {data?.currentLiabilities.map((account) => (
                  <div key={account.id} className="flex justify-between text-sm">
                    <span>{account.name}</span>
                    <span className="font-medium">${account.balance.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold mt-2 ml-4 pt-2 border-t">
                <span>Total Current Liabilities</span>
                <span>${data?.totalCurrentLiabilities.toFixed(2)}</span>
              </div>
            </div>

            <div className="ml-4 mt-4">
              <h4 className="font-semibold mb-2">Long-term Liabilities</h4>
              <div className="space-y-2 ml-4">
                {data?.longTermLiabilities.map((account) => (
                  <div key={account.id} className="flex justify-between text-sm">
                    <span>{account.name}</span>
                    <span className="font-medium">${account.balance.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold mt-2 ml-4 pt-2 border-t">
                <span>Total Long-term Liabilities</span>
                <span>${data?.totalLongTermLiabilities.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t-2">
              <span>TOTAL LIABILITIES</span>
              <span>${data?.totalLiabilities.toFixed(2)}</span>
            </div>
          </div>

          {/* Equity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--chart-2))" }}>
              EQUITY
            </h3>

            <div className="ml-4">
              <div className="space-y-2 ml-4">
                {data?.equity.map((account) => (
                  <div key={account.id} className="flex justify-between text-sm">
                    <span>{account.name}</span>
                    <span className="font-medium">${account.balance.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t-2">
                <span>TOTAL EQUITY</span>
                <span>${data?.totalEquity.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Total Liabilities & Equity */}
          <div className="flex justify-between text-xl font-bold mt-8 pt-6 border-t-4 border-double">
            <span>TOTAL LIABILITIES & EQUITY</span>
            <span>${data?.totalLiabilitiesAndEquity.toFixed(2)}</span>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
