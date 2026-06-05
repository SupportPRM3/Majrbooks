import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Download, Filter, CalendarIcon, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface CashFlowData {
  startingBalance: number;
  grossCashInflow: number;
  grossCashOutflow: number;
  netCashChange: number;
  endingBalance: number;
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
}

interface ForecastData {
  month: string;
  inflow: number;
  outflow: number;
  netChange: number;
  confidence: string;
}

type DatePreset = "this-month" | "last-month" | "this-quarter" | "this-year" | "custom";

export default function CashFlow() {
  const [datePreset, setDatePreset] = useState<DatePreset>("this-month");
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [businessName, setBusinessName] = useState("Your Business");
  const { toast } = useToast();

  useEffect(() => {
    fetchCashFlowData();
  }, [dateRange]);

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    switch (preset) {
      case "this-month":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case "last-month":
        const lastMonth = subMonths(now, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case "this-quarter":
        setDateRange({ from: startOfQuarter(now), to: endOfQuarter(now) });
        break;
      case "this-year":
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      case "custom":
        setShowCalendar(true);
        break;
    }
  };

  const fetchCashFlowData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile for business name
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.business_name) {
        setBusinessName(profile.business_name);
      }

      // Fetch transactions for the period
      const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("*, chart_of_accounts!transactions_account_id_fkey(account_type, detail_type)")
        .eq("user_id", user.id)
        .gte("date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("date", format(dateRange.to, "yyyy-MM-dd"));

      if (transError) throw transError;

      // Get starting balance (sum of all transactions before start date)
      const { data: previousTransactions } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .lt("date", format(dateRange.from, "yyyy-MM-dd"));

      let startingBalance = 0;
      previousTransactions?.forEach(txn => {
        if (txn.type === "income") {
          startingBalance += Number(txn.amount);
        } else {
          startingBalance -= Number(txn.amount);
        }
      });

      // Calculate cash flows
      let grossCashInflow = 0;
      let grossCashOutflow = 0;
      let operatingActivities = 0;
      let investingActivities = 0;
      let financingActivities = 0;

      transactions?.forEach(txn => {
        const amount = Number(txn.amount);
        const accountType = txn.chart_of_accounts?.account_type?.toLowerCase() || "";
        const detailType = txn.chart_of_accounts?.detail_type?.toLowerCase() || "";

        if (txn.type === "income") {
          grossCashInflow += amount;

          // Categorize by account type
          if (accountType.includes("revenue") || detailType.includes("sales") || detailType.includes("service")) {
            operatingActivities += amount;
          } else if (accountType.includes("investment") || detailType.includes("investment")) {
            investingActivities += amount;
          } else if (accountType.includes("loan") || detailType.includes("loan") || detailType.includes("equity")) {
            financingActivities += amount;
          } else {
            operatingActivities += amount; // Default to operating
          }
        } else {
          grossCashOutflow += amount;

          // Categorize by account type
          if (accountType.includes("expense") || accountType.includes("cost")) {
            operatingActivities -= amount;
          } else if (accountType.includes("asset") || accountType.includes("equipment") || detailType.includes("equipment")) {
            investingActivities -= amount;
          } else if (accountType.includes("loan") || detailType.includes("loan") || detailType.includes("dividend")) {
            financingActivities -= amount;
          } else {
            operatingActivities -= amount; // Default to operating
          }
        }
      });

      const netCashChange = grossCashInflow - grossCashOutflow;
      const endingBalance = startingBalance + netCashChange;

      setCashFlowData({
        startingBalance,
        grossCashInflow,
        grossCashOutflow,
        netCashChange,
        endingBalance,
        operatingActivities,
        investingActivities,
        financingActivities,
      });
    } catch (error) {
      console.error("Error fetching cash flow data:", error);
      toast({
        title: "Error",
        description: "Failed to load cash flow data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!cashFlowData) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Cash Flow", 14, 20);

    doc.setFontSize(10);
    doc.text(businessName, 14, 28);
    doc.text("Currency - USD", 14, 34);
    doc.text(
      `For ${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`,
      14,
      40
    );

    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text("Overview", 14, 52);

    let yPos = 62;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const overviewData = [
      ["Starting Balance", `$${cashFlowData.startingBalance.toFixed(2)}`],
      [`As of ${format(dateRange.from, "MMM d, yyyy")}`, "USD"],
      ["", ""],
      ["Gross Cash Inflow", `$${cashFlowData.grossCashInflow.toFixed(2)}`],
      ["Gross Cash Outflow", `$${cashFlowData.grossCashOutflow.toFixed(2)}`],
      ["Net Cash Change", `$${cashFlowData.netCashChange.toFixed(2)}`],
      ["", ""],
      ["Ending Balance", `$${cashFlowData.endingBalance.toFixed(2)}`],
      [`As of ${format(dateRange.to, "MMM d, yyyy")}`, "USD"],
    ];

    overviewData.forEach(([label, value]) => {
      if (label) {
        doc.text(label, 20, yPos);
        if (value) {
          doc.text(value, 160, yPos, { align: "right" });
        }
      }
      yPos += 6;
    });

    yPos += 5;
    doc.setTextColor(37, 99, 235);
    doc.text("Cash Inflow and Outflow", 14, yPos);
    yPos += 12;

    doc.setTextColor(0, 0, 0);
    const activitiesData = [
      ["Operating Activities", ""],
      ["Net Cash from Operating Activities", `$${cashFlowData.operatingActivities.toFixed(2)}`, "USD"],
      ["", ""],
      ["Investing Activities", ""],
      ["Net Cash from Investing Activities", `$${cashFlowData.investingActivities.toFixed(2)}`, "USD"],
      ["", ""],
      ["Financing Activities", ""],
      ["Net Cash from Financing Activities", `$${cashFlowData.financingActivities.toFixed(2)}`, "USD"],
    ];

    activitiesData.forEach(([label, value, currency]) => {
      if (label && !value) {
        doc.setFont("helvetica", "bold");
        doc.text(label, 20, yPos);
        doc.setFont("helvetica", "normal");
      } else if (label && value) {
        doc.text(label, 20, yPos);
        doc.text(value, 160, yPos, { align: "right" });
        if (currency) {
          doc.setFontSize(8);
          doc.text(currency, 160, yPos + 3, { align: "right" });
          doc.setFontSize(10);
        }
      }
      yPos += 6;
    });

    doc.save(`cash-flow-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const generateForecast = async () => {
    if (!cashFlowData) return;

    setForecastLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get historical data for the past 6 months
      const historicalData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(dateRange.from, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", session.user.id)
          .gte("date", format(monthStart, "yyyy-MM-dd"))
          .lte("date", format(monthEnd, "yyyy-MM-dd"));

        let inflow = 0;
        let outflow = 0;
        transactions?.forEach(txn => {
          if (txn.type === "income") {
            inflow += Number(txn.amount);
          } else {
            outflow += Number(txn.amount);
          }
        });

        historicalData.push({
          month: format(monthDate, "yyyy-MM"),
          inflow,
          outflow,
          netChange: inflow - outflow,
        });
      }

      const response = await supabase.functions.invoke("forecast-cashflow", {
        body: {
          historicalData,
          monthsToForecast: 3,
        },
      });

      if (response.error) {
        if (response.error.message?.includes("Rate limit")) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (response.error.message?.includes("Payment required")) {
          throw new Error("AI credits needed. Please add credits to your workspace.");
        }
        throw response.error;
      }

      setForecast(response.data.forecast);
      toast({
        title: "Forecast Generated",
        description: "Cash flow forecast for the next 3 months is ready",
      });
    } catch (error) {
      console.error("Forecast error:", error);
      toast({
        title: "Forecast Failed",
        description: error instanceof Error ? error.message : "Failed to generate forecast",
        variant: "destructive",
      });
    } finally {
      setForecastLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getChartData = () => {
    if (!cashFlowData) return [];

    const historical = [{
      month: format(dateRange.from, "MMM yyyy"),
      type: "Historical",
      inflow: cashFlowData.grossCashInflow,
      outflow: cashFlowData.grossCashOutflow,
      net: cashFlowData.netCashChange,
    }];

    const forecastData = forecast.map(f => ({
      month: format(new Date(f.month), "MMM yyyy"),
      type: "Forecast",
      inflow: f.inflow,
      outflow: f.outflow,
      net: f.netChange,
    }));

    return [...historical, ...forecastData];
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="border-b bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Cash Flow</h1>
            <div className="flex gap-2">
              <Button variant="outline">More Actions</Button>
              <Button className="bg-green-600 hover:bg-green-700">Send...</Button>
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="flex-1 p-6">
            <Card className="border-2">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl text-blue-600">Cash Flow</CardTitle>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{businessName}</p>
                  <p>Currency - USD</p>
                  <p>For {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}</p>
                </div>
                <div className="pt-2">
                  <Button variant="link" className="text-blue-600 px-0 h-auto">Overview</Button>
                  <Separator className="mt-1" />
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading cash flow data...</div>
                ) : cashFlowData ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Starting Balance</p>
                          <p className="text-sm text-muted-foreground">As of {format(dateRange.from, "MMM d, yyyy")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(cashFlowData.startingBalance)}</p>
                          <p className="text-xs text-muted-foreground">USD</p>
                        </div>
                      </div>

                      <div className="ml-8 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross Cash Inflow</span>
                          <span>{formatCurrency(cashFlowData.grossCashInflow)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross Cash Outflow</span>
                          <span>{formatCurrency(cashFlowData.grossCashOutflow)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-start pt-2">
                        <span className="font-semibold">Net Cash Change</span>
                        <span className="font-semibold">{formatCurrency(cashFlowData.netCashChange)}</span>
                      </div>

                      <div className="flex justify-between items-start pt-2">
                        <div>
                          <p className="font-semibold">Ending Balance</p>
                          <p className="text-sm text-muted-foreground">As of {format(dateRange.to, "MMM d, yyyy")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(cashFlowData.endingBalance)}</p>
                          <p className="text-xs text-muted-foreground">USD</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button variant="link" className="text-blue-600 px-0 h-auto">Cash Inflow and Outflow</Button>
                      <Separator className="mt-1" />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold mb-2">Operating Activities</p>
                        <div className="flex justify-between items-start ml-4">
                          <span>Net Cash from Operating Activities</span>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(cashFlowData.operatingActivities)}</p>
                            <p className="text-xs text-muted-foreground">USD</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <p className="font-semibold mb-2">Investing Activities</p>
                        <div className="flex justify-between items-start ml-4">
                          <span>Net Cash from Investing Activities</span>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(cashFlowData.investingActivities)}</p>
                            <p className="text-xs text-muted-foreground">USD</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <p className="font-semibold mb-2">Financing Activities</p>
                        <div className="flex justify-between items-start ml-4">
                          <span>Net Cash from Financing Activities</span>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(cashFlowData.financingActivities)}</p>
                            <p className="text-xs text-muted-foreground">USD</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Forecast Chart */}
                    {forecast.length > 0 && (
                      <div className="pt-6">
                        <Separator className="mb-4" />
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-blue-600">Cash Flow Forecast</h3>
                          <Badge variant="outline">Next 3 Months</Badge>
                        </div>

                        <div className="h-[300px] mb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getChartData()}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                              />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="inflow"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="Cash Inflow"
                              />
                              <Line
                                type="monotone"
                                dataKey="outflow"
                                stroke="#ef4444"
                                strokeWidth={2}
                                name="Cash Outflow"
                              />
                              <Line
                                type="monotone"
                                dataKey="net"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Net Change"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-2">
                          {forecast.map((f, idx) => (
                            <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{format(new Date(f.month), "MMMM yyyy")}</span>
                                <Badge variant={f.confidence === "high" ? "default" : "secondary"}>
                                  {f.confidence} confidence
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Inflow</p>
                                  <p className="font-semibold text-green-600">{formatCurrency(f.inflow)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Outflow</p>
                                  <p className="font-semibold text-red-600">{formatCurrency(f.outflow)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Net</p>
                                  <p className="font-semibold text-blue-600">{formatCurrency(f.netChange)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">No cash flow data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="w-80 border-l bg-muted/30 p-6">
            <div className="space-y-4">
              <h2 className="font-semibold">Settings</h2>

              {/* Date Range Filter */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Label className="font-medium">Date Range</Label>
                  <Select value={datePreset} onValueChange={(v) => handleDatePresetChange(v as DatePreset)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>

                  {datePreset === "custom" && (
                    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                              </>
                            ) : (
                              format(dateRange.from, "MMM d, yyyy")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => {
                            if (range?.from && range?.to) {
                              setDateRange({ from: range.from, to: range.to });
                              setShowCalendar(false);
                            }
                          }}
                          numberOfMonths={2}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                  </div>
                </CardContent>
              </Card>

              {/* Forecast Section */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Forecast</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI-powered forecast based on historical patterns
                  </p>
                  <Button
                    onClick={generateForecast}
                    variant="outline"
                    className="w-full"
                    disabled={!cashFlowData || forecastLoading}
                  >
                    {forecastLoading ? "Generating..." : "Generate 3-Month Forecast"}
                  </Button>
                  {forecast.length > 0 && (
                    <Badge variant="secondary" className="w-full justify-center">
                      Forecast Ready
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Button onClick={exportToPDF} variant="outline" className="w-full" disabled={!cashFlowData}>
                <Download className="h-4 w-4 mr-2" />
                Export to PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
