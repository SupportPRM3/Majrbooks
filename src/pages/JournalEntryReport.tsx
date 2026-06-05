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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Calendar as CalendarIcon, Download, ChevronDown, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface JournalEntryLine {
  id: string;
  date: string;
  entry_number: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  source_type: string | null;
  source_id: string | null;
  journal_entry_id: string;
}

interface AccountGroup {
  accountId: string;
  accountName: string;
  accountType: string;
  entries: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  endingBalance: number;
}

const JournalEntryReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), 0, 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchJournalEntryReport();
  }, [startDate, endDate]);

  const fetchJournalEntryReport = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch journal entries with lines and account details
      const { data: journalEntries, error } = await supabase
        .from("journal_entries")
        .select(`
          id,
          entry_number,
          entry_date,
          description,
          reference,
          source_type,
          source_id,
          status,
          journal_entry_lines(
            id,
            debit,
            credit,
            description,
            account_id,
            chart_of_accounts(
              id,
              name,
              account_type
            )
          )
        `)
        .eq("user_id", user.id)
        .gte("entry_date", format(startDate, "yyyy-MM-dd"))
        .lte("entry_date", format(endDate, "yyyy-MM-dd"))
        .eq("status", "posted")
        .order("entry_date", { ascending: true });

      if (error) throw error;

      // Group entries by account
      const accountMap = new Map<string, AccountGroup>();

      journalEntries?.forEach((entry: any) => {
        entry.journal_entry_lines?.forEach((line: any) => {
          if (!line.chart_of_accounts) return;

          const accountId = line.account_id;
          const accountName = line.chart_of_accounts.name;
          const accountType = line.chart_of_accounts.account_type;

          if (!accountMap.has(accountId)) {
            accountMap.set(accountId, {
              accountId,
              accountName,
              accountType,
              entries: [],
              totalDebit: 0,
              totalCredit: 0,
              endingBalance: 0,
            });
          }

          const group = accountMap.get(accountId)!;
          
          const entryLine: JournalEntryLine = {
            id: line.id,
            date: entry.entry_date,
            entry_number: entry.entry_number,
            description: line.description || entry.description || "",
            reference: entry.reference || "",
            debit: line.debit,
            credit: line.credit,
            balance: 0, // Will calculate running balance next
            source_type: entry.source_type,
            source_id: entry.source_id,
            journal_entry_id: entry.id,
          };

          group.entries.push(entryLine);
          group.totalDebit += line.debit;
          group.totalCredit += line.credit;
        });
      });

      // Calculate running balances for each account
      accountMap.forEach((group) => {
        let runningBalance = 0;
        group.entries.forEach((entry) => {
          runningBalance += entry.debit - entry.credit;
          entry.balance = runningBalance;
        });
        group.endingBalance = runningBalance;
      });

      // Convert to array and sort by account type and name
      const groupsArray = Array.from(accountMap.values()).sort((a, b) => {
        if (a.accountType !== b.accountType) {
          return a.accountType.localeCompare(b.accountType);
        }
        return a.accountName.localeCompare(b.accountName);
      });

      setAccountGroups(groupsArray);
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

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedAccounts(new Set(accountGroups.map(g => g.accountId)));
  };

  const collapseAll = () => {
    setExpandedAccounts(new Set());
  };

  const handleViewLinkedTransaction = (entry: JournalEntryLine) => {
    if (entry.source_type === 'invoice' || entry.source_type === 'payment') {
      navigate(`/invoices`);
    } else {
      navigate(`/journal-entries`);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Journal Entry Report by Account", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Period: ${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`,
      pageWidth / 2,
      30,
      { align: "center" }
    );

    let startY = 40;

    accountGroups.forEach((group, groupIndex) => {
      // Add new page if needed
      if (startY > 250) {
        doc.addPage();
        startY = 20;
      }

      // Account header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${group.accountName} (${group.accountType})`, 14, startY);
      startY += 7;

      // Table for this account
      const tableData = group.entries.map((entry) => [
        format(new Date(entry.date), "MM/dd/yyyy"),
        entry.entry_number,
        entry.description,
        entry.reference || "-",
        entry.debit > 0 ? `$${entry.debit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-",
        entry.credit > 0 ? `$${entry.credit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-",
        `$${entry.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      ]);

      autoTable(doc, {
        startY,
        head: [["Date", "Entry #", "Description", "Ref", "Debit", "Credit", "Balance"]],
        body: tableData,
        foot: [[
          { content: "Total", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
          { content: `$${group.totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, styles: { fontStyle: "bold" } },
          { content: `$${group.totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, styles: { fontStyle: "bold" } },
          { content: `$${group.endingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, styles: { fontStyle: "bold" } },
        ]],
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 1.5 },
        footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0] },
        margin: { left: 14 },
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`journal-entry-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);

    toast({
      title: "Success",
      description: "Journal Entry Report exported to PDF",
    });
  };

  const totalAllDebits = accountGroups.reduce((sum, group) => sum + group.totalDebit, 0);
  const totalAllCredits = accountGroups.reduce((sum, group) => sum + group.totalCredit, 0);

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
              <h1 className="text-3xl font-bold">Journal Entry Report</h1>
              <p className="text-sm text-muted-foreground mt-1">
                All journal entries grouped by account with running balances
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" onClick={collapseAll}>
              Collapse All
            </Button>
            <Button onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accountGroups.length}</div>
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
                ${totalAllDebits.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                ${totalAllCredits.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Groups */}
        <Card>
          <CardHeader>
            <CardTitle>Journal Entries by Account</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading journal entry data...
              </div>
            ) : accountGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No journal entries found for the selected period
              </div>
            ) : (
              <div className="space-y-4">
                {accountGroups.map((group) => (
                  <Collapsible
                    key={group.accountId}
                    open={expandedAccounts.has(group.accountId)}
                    onOpenChange={() => toggleAccount(group.accountId)}
                  >
                    <Card className="border-2">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ChevronDown
                                className={cn(
                                  "h-5 w-5 transition-transform",
                                  expandedAccounts.has(group.accountId) && "transform rotate-180"
                                )}
                              />
                              <div>
                                <CardTitle className="text-lg">{group.accountName}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {group.accountType} • {group.entries.length} entries
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-6 text-right">
                              <div>
                                <p className="text-xs text-muted-foreground">Total Debits</p>
                                <p className="text-lg font-bold text-green-600">
                                  ${group.totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Credits</p>
                                <p className="text-lg font-bold text-blue-600">
                                  ${group.totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Ending Balance</p>
                                <p className="text-lg font-bold">
                                  ${group.endingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Entry Number</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Reference</TableHead>
                                  <TableHead>Linked Transaction</TableHead>
                                  <TableHead className="text-right">Debit</TableHead>
                                  <TableHead className="text-right">Credit</TableHead>
                                  <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.entries.map((entry) => (
                                  <TableRow key={entry.id}>
                                    <TableCell className="whitespace-nowrap">
                                      {format(new Date(entry.date), "MM/dd/yyyy")}
                                    </TableCell>
                                    <TableCell className="font-medium">{entry.entry_number}</TableCell>
                                    <TableCell>{entry.description}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                      {entry.reference || "-"}
                                    </TableCell>
                                    <TableCell>
                                      {entry.source_type ? (
                                        <Button
                                          variant="link"
                                          size="sm"
                                          className="h-auto p-0"
                                          onClick={() => handleViewLinkedTransaction(entry)}
                                        >
                                          {entry.source_type === 'invoice' && `Invoice #${entry.reference}`}
                                          {entry.source_type === 'payment' && `Payment - ${entry.reference}`}
                                          {entry.source_type === 'manual' && 'Manual Entry'}
                                          <ExternalLink className="h-3 w-3 ml-1" />
                                        </Button>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">Manual Entry</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 font-medium">
                                      {entry.debit > 0 ? `$${entry.debit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-"}
                                    </TableCell>
                                    <TableCell className="text-right text-blue-600 font-medium">
                                      {entry.credit > 0 ? `$${entry.credit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                      ${entry.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default JournalEntryReport;
