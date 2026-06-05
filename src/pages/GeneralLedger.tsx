import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
} from "@/components/ui/table";
import { ArrowLeft, Calendar as CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LedgerEntry {
  date: string;
  account: string;
  accountType: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

const GeneralLedger = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), 0, 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [accountType, setAccountType] = useState<string>("all");
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const accountTypes = [
    { value: "all", label: "All Account Types" },
    { value: "Asset", label: "Assets" },
    { value: "Liability", label: "Liabilities" },
    { value: "Equity", label: "Equity" },
    { value: "Revenue", label: "Revenue" },
    { value: "Expense", label: "Expenses" },
  ];

  useEffect(() => {
    fetchLedgerData();
  }, [startDate, endDate, accountType]);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all accounts
      let accountsQuery = supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("user_id", user.id);

      if (accountType !== "all") {
        accountsQuery = accountsQuery.eq("account_type", accountType);
      }

      const { data: accounts, error: accountsError } = await accountsQuery;
      if (accountsError) throw accountsError;

      // Fetch transactions
      const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("*, chart_of_accounts(name, account_type)")
        .eq("user_id", user.id)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (transError) throw transError;

      // Fetch journal entries with lines
      const { data: journalEntries, error: journalError } = await supabase
        .from("journal_entries")
        .select(`
          *,
          journal_entry_lines(
            *,
            chart_of_accounts(name, account_type)
          )
        `)
        .eq("user_id", user.id)
        .gte("entry_date", format(startDate, "yyyy-MM-dd"))
        .lte("entry_date", format(endDate, "yyyy-MM-dd"))
        .order("entry_date", { ascending: true });

      if (journalError) throw journalError;

      // Combine and process all entries
      const entries: LedgerEntry[] = [];
      let runningBalance = 0;

      // Process regular transactions
      transactions?.forEach((trans: any) => {
        if (!trans.chart_of_accounts) return;
        
        const debit = trans.type === "expense" ? trans.amount : 0;
        const credit = trans.type === "income" ? trans.amount : 0;
        runningBalance += debit - credit;

        entries.push({
          date: trans.date,
          account: trans.chart_of_accounts.name,
          accountType: trans.chart_of_accounts.account_type,
          description: trans.description,
          reference: trans.id.substring(0, 8),
          debit,
          credit,
          balance: runningBalance,
        });
      });

      // Process journal entries
      journalEntries?.forEach((entry: any) => {
        entry.journal_entry_lines?.forEach((line: any) => {
          if (!line.chart_of_accounts) return;

          runningBalance += line.debit - line.credit;

          entries.push({
            date: entry.entry_date,
            account: line.chart_of_accounts.name,
            accountType: line.chart_of_accounts.account_type,
            description: line.description || entry.description || "Journal Entry",
            reference: entry.entry_number,
            debit: line.debit,
            credit: line.credit,
            balance: runningBalance,
          });
        });
      });

      // Sort by date
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Recalculate running balance after sort
      let balance = 0;
      entries.forEach(entry => {
        balance += entry.debit - entry.credit;
        entry.balance = balance;
      });

      setLedgerData(entries);
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("General Ledger", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Period: ${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`,
      pageWidth / 2,
      30,
      { align: "center" }
    );

    if (accountType !== "all") {
      doc.text(
        `Account Type: ${accountTypes.find(t => t.value === accountType)?.label}`,
        pageWidth / 2,
        37,
        { align: "center" }
      );
    }

    // Table
    const tableData = ledgerData.map((entry) => [
      format(new Date(entry.date), "MM/dd/yyyy"),
      entry.account,
      entry.accountType,
      entry.description,
      entry.reference,
      entry.debit ? `$${entry.debit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-",
      entry.credit ? `$${entry.credit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-",
      `$${entry.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ]);

    // Calculate totals
    const totalDebit = ledgerData.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = ledgerData.reduce((sum, entry) => sum + entry.credit, 0);

    autoTable(doc, {
      startY: accountType !== "all" ? 45 : 38,
      head: [["Date", "Account", "Type", "Description", "Ref", "Debit", "Credit", "Balance"]],
      body: tableData,
      foot: [[
        { content: "Total", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } },
        { content: `$${totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { fontStyle: "bold" } },
        { content: `$${totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { fontStyle: "bold" } },
        ""
      ]],
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0] },
    });

    doc.save(`general-ledger-${format(new Date(), "yyyy-MM-dd")}.pdf`);

    toast({
      title: "Success",
      description: "General Ledger exported to PDF",
    });
  };

  const totalDebit = ledgerData.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = ledgerData.reduce((sum, entry) => sum + entry.credit, 0);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/accounting")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">General Ledger</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Complete record of all account transactions
              </p>
            </div>
          </div>
          <Button onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Account Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Type</label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ledgerData.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Debits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading ledger data...
              </div>
            ) : ledgerData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found for the selected period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerData.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(entry.date), "MM/dd/yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{entry.account}</TableCell>
                        <TableCell>
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {entry.accountType}
                          </span>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {entry.reference}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {entry.debit > 0 ? `$${entry.debit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">
                          {entry.credit > 0 ? `$${entry.credit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${entry.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={5} className="text-right">Total</TableCell>
                      <TableCell className="text-right text-green-600">
                        ${totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ${totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GeneralLedger;
