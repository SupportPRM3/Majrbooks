import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths, subYears } from "date-fns";
import { TrendingUp, Download, Calendar, BarChart3 } from "lucide-react";
import jsPDF from "jspdf";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CategoryTotal {
  category_id: string;
  category_name: string;
  total: number;
}

interface ProfitLossData {
  grossReceipts: number;
  costOfGoodsSold: CategoryTotal[];
  totalCOGS: number;
  grossProfit: number;
  operatingExpenses: CategoryTotal[];
  totalOperatingExpenses: number;
  netOperatingIncome: number;
  otherIncome: CategoryTotal[];
  otherExpenses: CategoryTotal[];
  totalOtherIncome: number;
  totalOtherExpenses: number;
  netOtherIncome: number;
  netIncome: number;
}

interface ComparisonData {
  current: ProfitLossData;
  previous: ProfitLossData;
}

const ProfitAndLoss = () => {
  const [data, setData] = useState<ProfitLossData>({
    grossReceipts: 0,
    costOfGoodsSold: [],
    totalCOGS: 0,
    grossProfit: 0,
    operatingExpenses: [],
    totalOperatingExpenses: 0,
    netOperatingIncome: 0,
    otherIncome: [],
    otherExpenses: [],
    totalOtherIncome: 0,
    totalOtherExpenses: 0,
    netOtherIncome: 0,
    netIncome: 0,
  });
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [comparisonType, setComparisonType] = useState<"none" | "mom" | "yoy">("none");
  const { user } = useAuth();
  const { toast } = useToast();

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"];

  const fetchProfitLossData = async (start: string, end: string): Promise<ProfitLossData> => {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(`
        id,
        amount,
        type,
        date,
        description,
        category_id,
        categories (
          id,
          name,
          type
        )
      `)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    if (error) throw error;

    let grossReceipts = 0;
    const cogsMap = new Map<string, CategoryTotal>();
    const operatingExpensesMap = new Map<string, CategoryTotal>();
    const otherIncomeMap = new Map<string, CategoryTotal>();
    const otherExpensesMap = new Map<string, CategoryTotal>();

    transactions?.forEach((transaction) => {
      const amount = Number(transaction.amount);
      const categoryId = transaction.category_id || "uncategorized";
      const categoryName = transaction.categories?.name || "Uncategorized";
      const type = transaction.type;
      const desc = transaction.description?.toLowerCase() || "";

      if (type === "income") {
        if (
          categoryName.toLowerCase().includes("sales") ||
          categoryName.toLowerCase().includes("revenue") ||
          desc.includes("sales") ||
          desc.includes("revenue")
        ) {
          grossReceipts += amount;
        } else {
          if (otherIncomeMap.has(categoryId)) {
            otherIncomeMap.get(categoryId)!.total += amount;
          } else {
            otherIncomeMap.set(categoryId, { category_id: categoryId, category_name: categoryName, total: amount });
          }
        }
      } else if (type === "expense") {
        const isCOGS =
          categoryName.toLowerCase().includes("cost of goods") ||
          categoryName.toLowerCase().includes("cogs") ||
          desc.includes("purchase") ||
          desc.includes("labor");

        if (isCOGS) {
          if (cogsMap.has(categoryId)) {
            cogsMap.get(categoryId)!.total += amount;
          } else {
            cogsMap.set(categoryId, { category_id: categoryId, category_name: categoryName, total: amount });
          }
        } else {
          const isOtherExpense =
            desc.includes("delivery") ||
            desc.includes("freight") ||
            desc.includes("insurance") ||
            desc.includes("legal") ||
            desc.includes("vehicle");

          if (isOtherExpense) {
            if (otherExpensesMap.has(categoryId)) {
              otherExpensesMap.get(categoryId)!.total += amount;
            } else {
              otherExpensesMap.set(categoryId, { category_id: categoryId, category_name: categoryName, total: amount });
            }
          } else {
            if (operatingExpensesMap.has(categoryId)) {
              operatingExpensesMap.get(categoryId)!.total += amount;
            } else {
              operatingExpensesMap.set(categoryId, { category_id: categoryId, category_name: categoryName, total: amount });
            }
          }
        }
      }
    });

    const costOfGoodsSold = Array.from(cogsMap.values()).sort((a, b) => b.total - a.total);
    const operatingExpenses = Array.from(operatingExpensesMap.values()).sort((a, b) => b.total - a.total);
    const otherIncome = Array.from(otherIncomeMap.values()).sort((a, b) => b.total - a.total);
    const otherExpenses = Array.from(otherExpensesMap.values()).sort((a, b) => b.total - a.total);

    const totalCOGS = costOfGoodsSold.reduce((sum, item) => sum + item.total, 0);
    const grossProfit = grossReceipts - totalCOGS;
    const totalOperatingExpenses = operatingExpenses.reduce((sum, item) => sum + item.total, 0);
    const netOperatingIncome = grossProfit - totalOperatingExpenses;
    const totalOtherIncome = otherIncome.reduce((sum, item) => sum + item.total, 0);
    const totalOtherExpenses = otherExpenses.reduce((sum, item) => sum + item.total, 0);
    const netOtherIncome = totalOtherIncome - totalOtherExpenses;
    const netIncome = netOperatingIncome + netOtherIncome;

    return {
      grossReceipts,
      costOfGoodsSold,
      totalCOGS,
      grossProfit,
      operatingExpenses,
      totalOperatingExpenses,
      netOperatingIncome,
      otherIncome,
      otherExpenses,
      totalOtherIncome,
      totalOtherExpenses,
      netOtherIncome,
      netIncome,
    };
  };

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const currentData = await fetchProfitLossData(startDate, endDate);
      setData(currentData);

      if (comparisonType !== "none") {
        let prevStart: string, prevEnd: string;

        if (comparisonType === "mom") {
          const startDateObj = new Date(startDate);
          const prevMonth = subMonths(startDateObj, 1);
          prevStart = format(startOfMonth(prevMonth), "yyyy-MM-dd");
          prevEnd = format(endOfMonth(prevMonth), "yyyy-MM-dd");
        } else {
          const startDateObj = new Date(startDate);
          const prevYear = subYears(startDateObj, 1);
          prevStart = format(prevYear, "yyyy-MM-dd");
          const endDateObj = new Date(endDate);
          prevEnd = format(subYears(endDateObj, 1), "yyyy-MM-dd");
        }

        const previousData = await fetchProfitLossData(prevStart, prevEnd);
        setComparisonData({ current: currentData, previous: previousData });
      } else {
        setComparisonData(null);
      }
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

  useEffect(() => {
    loadData();
  }, [user, startDate, endDate, comparisonType]);

  const handleExport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(18);
    doc.text("Profit and Loss Statement", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(
      `Period: ${format(new Date(startDate), "MMM d, yyyy")} - ${format(new Date(endDate), "MMM d, yyyy")}`,
      pageWidth / 2,
      28,
      { align: "center" }
    );

    let yPos = 40;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Income", 14, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("  Gross Receipts or Sales", 14, yPos);
    doc.text(`$${data.grossReceipts.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
    yPos += 7;

    doc.setFont("helvetica", "bold");
    doc.text("Total for Income", 14, yPos);
    doc.text(`$${data.grossReceipts.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
    yPos += 10;

    doc.text("Cost of Goods Sold", 14, yPos);
    yPos += 7;

    doc.setFont("helvetica", "normal");
    data.costOfGoodsSold.forEach((item) => {
      doc.text(`  ${item.category_name}`, 14, yPos);
      doc.text(`$${item.total.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
      yPos += 6;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Total for Cost of Goods Sold", 14, yPos);
    doc.text(`$${data.totalCOGS.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
    yPos += 7;

    doc.text("Gross Profit", 14, yPos);
    doc.text(`$${data.grossProfit.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
    yPos += 10;

    doc.text("Expenses", 14, yPos);
    yPos += 7;

    doc.setFont("helvetica", "normal");
    data.operatingExpenses.forEach((item) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`  ${item.category_name}`, 14, yPos);
      doc.text(`$${item.total.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
      yPos += 6;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Total for Expenses", 14, yPos);
    doc.text(`$${data.totalOperatingExpenses.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
    yPos += 7;

    doc.text("Net Operating Income", 14, yPos);
    doc.text(`$${data.netOperatingIncome.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
    yPos += 10;

    if (data.otherIncome.length > 0 || data.otherExpenses.length > 0) {
      doc.text("Other Income", 14, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      data.otherIncome.forEach((item) => {
        doc.text(`  ${item.category_name}`, 14, yPos);
        doc.text(`$${item.total.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
        yPos += 6;
      });

      yPos += 3;
      doc.setFont("helvetica", "bold");
      doc.text("Other Expenses", 14, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      data.otherExpenses.forEach((item) => {
        doc.text(`  ${item.category_name}`, 14, yPos);
        doc.text(`$${item.total.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
        yPos += 6;
      });

      doc.setFont("helvetica", "bold");
      doc.text("Total for Other Expenses", 14, yPos);
      doc.text(`$${data.totalOtherExpenses.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
      yPos += 7;

      doc.text("Net Other Income", 14, yPos);
      doc.text(`$${data.netOtherIncome.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });
      yPos += 10;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Net Income", 14, yPos);
    doc.text(`$${data.netIncome.toFixed(2)}`, pageWidth - 14, yPos, { align: "right" });

    doc.save(`profit-and-loss-${format(new Date(), "yyyy-MM-dd")}.pdf`);

    toast({
      title: "Success",
      description: "PDF exported successfully",
    });
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatChange = (current: number, previous: number) => {
    const change = calculateChange(current, previous);
    const sign = change >= 0 ? "+" : "";
    const color = change >= 0 ? "text-green-600" : "text-red-600";
    return <span className={color}>{`${sign}${change.toFixed(1)}%`}</span>;
  };

  const expenseChartData = data.operatingExpenses.map((item) => ({
    name: item.category_name.length > 15 ? item.category_name.substring(0, 15) + "..." : item.category_name,
    value: item.total,
  }));

  const overviewChartData = [
    { name: "Gross Receipts", amount: data.grossReceipts },
    { name: "COGS", amount: -data.totalCOGS },
    { name: "Operating Expenses", amount: -data.totalOperatingExpenses },
    { name: "Net Income", amount: data.netIncome },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Profit and Loss Statement
            </h1>
            <p className="text-muted-foreground mt-1">
              Detailed breakdown of income, expenses, and profitability
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Report Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="comparison">Comparison</Label>
                <Select value={comparisonType} onValueChange={(value: any) => setComparisonType(value)}>
                  <SelectTrigger id="comparison">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Comparison</SelectItem>
                    <SelectItem value="mom">Month-over-Month</SelectItem>
                    <SelectItem value="yoy">Year-over-Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={loadData} className="w-full">
                  Update Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading report...
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="report" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="report">Financial Report</TabsTrigger>
              <TabsTrigger value="charts">
                <BarChart3 className="h-4 w-4 mr-2" />
                Charts & Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="report" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Gross Receipts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${data.grossReceipts.toFixed(2)}
                    </div>
                    {comparisonData && (
                      <div className="text-sm mt-1">
                        {formatChange(data.grossReceipts, comparisonData.previous.grossReceipts)}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Gross Profit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ${data.grossProfit.toFixed(2)}
                    </div>
                    {comparisonData && (
                      <div className="text-sm mt-1">
                        {formatChange(data.grossProfit, comparisonData.previous.grossProfit)}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Operating Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      ${data.netOperatingIncome.toFixed(2)}
                    </div>
                    {comparisonData && (
                      <div className="text-sm mt-1">
                        {formatChange(data.netOperatingIncome, comparisonData.previous.netOperatingIncome)}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Net Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${data.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${data.netIncome.toFixed(2)}
                    </div>
                    {comparisonData && (
                      <div className="text-sm mt-1">
                        {formatChange(data.netIncome, comparisonData.previous.netIncome)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="pl-8">Gross Receipts or Sales</TableCell>
                        <TableCell className="text-right font-medium">
                          ${data.grossReceipts.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-bold">Total for Income</TableCell>
                        <TableCell className="text-right font-bold">
                          ${data.grossReceipts.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost of Goods Sold</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.costOfGoodsSold.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No cost of goods sold in this period
                    </p>
                  ) : (
                    <Table>
                      <TableBody>
                        {data.costOfGoodsSold.map((item) => (
                          <TableRow key={item.category_id}>
                            <TableCell className="pl-8">{item.category_name}</TableCell>
                            <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell className="font-bold">Total for Cost of Goods Sold</TableCell>
                          <TableCell className="text-right font-bold">
                            ${data.totalCOGS.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  )}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Gross Profit</span>
                      <span className="font-bold text-lg text-blue-600">
                        ${data.grossProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.operatingExpenses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No operating expenses in this period
                    </p>
                  ) : (
                    <Table>
                      <TableBody>
                        {data.operatingExpenses.map((item) => (
                          <TableRow key={item.category_id}>
                            <TableCell className="pl-8">{item.category_name}</TableCell>
                            <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell className="font-bold">Total for Expenses</TableCell>
                          <TableCell className="text-right font-bold">
                            ${data.totalOperatingExpenses.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  )}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Net Operating Income</span>
                      <span className="font-bold text-lg text-purple-600">
                        ${data.netOperatingIncome.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(data.otherIncome.length > 0 || data.otherExpenses.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Other Income and Expenses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.otherIncome.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Other Income</h4>
                        <Table>
                          <TableBody>
                            {data.otherIncome.map((item) => (
                              <TableRow key={item.category_id}>
                                <TableCell className="pl-8">{item.category_name}</TableCell>
                                <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {data.otherExpenses.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Other Expenses</h4>
                        <Table>
                          <TableBody>
                            {data.otherExpenses.map((item) => (
                              <TableRow key={item.category_id}>
                                <TableCell className="pl-8">{item.category_name}</TableCell>
                                <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell className="font-bold">Total for Other Expenses</TableCell>
                              <TableCell className="text-right font-bold">
                                ${data.totalOtherExpenses.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Net Other Income</span>
                        <span className="font-bold text-lg">${data.netOtherIncome.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-2 border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">Net Income</div>
                    <div className={`text-3xl font-bold ${data.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${data.netIncome.toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Period: {format(new Date(startDate), "MMM d, yyyy")} - {format(new Date(endDate), "MMM d, yyyy")}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={overviewChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="amount" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expenseChartData.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No expense data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={expenseChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expenseChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {comparisonData && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {comparisonType === "mom" ? "Month-over-Month" : "Year-over-Year"} Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead className="text-right">Current Period</TableHead>
                          <TableHead className="text-right">Previous Period</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Gross Receipts</TableCell>
                          <TableCell className="text-right">${data.grossReceipts.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            ${comparisonData.previous.grossReceipts.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatChange(data.grossReceipts, comparisonData.previous.grossReceipts)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Gross Profit</TableCell>
                          <TableCell className="text-right">${data.grossProfit.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            ${comparisonData.previous.grossProfit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatChange(data.grossProfit, comparisonData.previous.grossProfit)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Operating Expenses</TableCell>
                          <TableCell className="text-right">${data.totalOperatingExpenses.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            ${comparisonData.previous.totalOperatingExpenses.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatChange(data.totalOperatingExpenses, comparisonData.previous.totalOperatingExpenses)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Net Income</TableCell>
                          <TableCell className="text-right">${data.netIncome.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            ${comparisonData.previous.netIncome.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatChange(data.netIncome, comparisonData.previous.netIncome)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default ProfitAndLoss;
