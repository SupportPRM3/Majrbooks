import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Download, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AccountBalance {
  id: string;
  name: string;
  account_type: string;
  detail_type: string;
  quickbooks_balance: number;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  accounts: AccountBalance[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  difference: number;
}

const TrialBalance = () => {
  const [asOfDate] = useState(new Date());

  const { data: trialBalanceData, isLoading } = useQuery({
    queryKey: ["trial-balance", asOfDate],
    queryFn: async (): Promise<TrialBalanceData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: accounts, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("account_type")
        .order("name");

      if (error) throw error;

      // Determine debit or credit based on account type and balance
      const processedAccounts: AccountBalance[] = accounts.map((account) => {
        const balance = Number(account.quickbooks_balance) || 0;
        const accountType = account.account_type.toLowerCase();

        // Assets and Expenses normally have debit balances
        // Liabilities, Equity, and Revenue normally have credit balances
        const isDebitAccount = 
          accountType.includes("asset") || 
          accountType.includes("expense") ||
          accountType.includes("cost");

        let debit = 0;
        let credit = 0;

        if (isDebitAccount) {
          // Debit accounts: positive = debit, negative = credit
          if (balance >= 0) {
            debit = balance;
          } else {
            credit = Math.abs(balance);
          }
        } else {
          // Credit accounts: positive = credit, negative = debit
          if (balance >= 0) {
            credit = balance;
          } else {
            debit = Math.abs(balance);
          }
        }

        return {
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          detail_type: account.detail_type,
          quickbooks_balance: balance,
          debit,
          credit,
        };
      });

      const totalDebits = processedAccounts.reduce((sum, acc) => sum + acc.debit, 0);
      const totalCredits = processedAccounts.reduce((sum, acc) => sum + acc.credit, 0);
      const difference = Math.abs(totalDebits - totalCredits);
      const isBalanced = difference < 0.01; // Allow for small floating point differences

      return {
        accounts: processedAccounts,
        totalDebits,
        totalCredits,
        isBalanced,
        difference,
      };
    },
  });

  const exportToPDF = () => {
    if (!trialBalanceData) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Trial Balance", 14, 20);

    doc.setFontSize(10);
    doc.text(`As of ${format(asOfDate, "MMMM d, yyyy")}`, 14, 30);

    // Group accounts by type
    const groupedAccounts: { [key: string]: AccountBalance[] } = {};
    trialBalanceData.accounts.forEach((account) => {
      if (!groupedAccounts[account.account_type]) {
        groupedAccounts[account.account_type] = [];
      }
      groupedAccounts[account.account_type].push(account);
    });

    let yPosition = 40;

    Object.entries(groupedAccounts).forEach(([accountType, accounts]) => {
      // Account type header
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(accountType, 14, yPosition);
      yPosition += 7;

      // Accounts table
      const tableData = accounts.map((account) => [
        account.name,
        account.debit > 0 ? `$${account.debit.toFixed(2)}` : "",
        account.credit > 0 ? `$${account.credit.toFixed(2)}` : "",
      ]);

      autoTable(doc, {
        head: [["Account", "Debit", "Credit"]],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [241, 245, 249] },
        theme: "plain",
        margin: { left: 20 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 5;
    });

    // Totals
    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    autoTable(doc, {
      body: [
        ["Total", `$${trialBalanceData.totalDebits.toFixed(2)}`, `$${trialBalanceData.totalCredits.toFixed(2)}`],
      ],
      startY: yPosition,
      styles: { fontSize: 10, fontStyle: "bold" },
      theme: "plain",
      margin: { left: 14 },
    });

    // Balance status
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    if (trialBalanceData.isBalanced) {
      doc.setTextColor(0, 128, 0);
      doc.text("✓ Books are balanced", 14, yPosition);
    } else {
      doc.setTextColor(255, 0, 0);
      doc.text(
        `✗ Out of balance by $${trialBalanceData.difference.toFixed(2)}`,
        14,
        yPosition
      );
    }

    doc.save(`trial-balance-${format(asOfDate, "yyyy-MM-dd")}.pdf`);
  };

  // Group accounts by type for display
  const groupedAccounts: { [key: string]: AccountBalance[] } = {};
  trialBalanceData?.accounts.forEach((account) => {
    if (!groupedAccounts[account.account_type]) {
      groupedAccounts[account.account_type] = [];
    }
    groupedAccounts[account.account_type].push(account);
  });

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trial Balance</h1>
            <p className="text-muted-foreground">
              Verify that debits equal credits in your books
            </p>
          </div>
          <Button onClick={exportToPDF} disabled={!trialBalanceData}>
            <Download className="h-4 w-4 mr-2" />
            Export to PDF
          </Button>
        </div>

        {/* Balance Status Alert */}
        {trialBalanceData && (
          <Alert
            className={
              trialBalanceData.isBalanced
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }
          >
            <AlertDescription className="flex items-center gap-2">
              {trialBalanceData.isBalanced ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Books are balanced</p>
                    <p className="text-sm text-green-800">
                      Total debits equal total credits
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Books are out of balance</p>
                    <p className="text-sm text-red-800">
                      Difference: ${trialBalanceData.difference.toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg font-semibold">
                  As of {format(asOfDate, "MMMM d, yyyy")}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Loading trial balance...</p>
              </div>
            ) : !trialBalanceData || trialBalanceData.accounts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-lg font-semibold mb-2">No accounts found</p>
                <p className="text-sm text-muted-foreground">
                  Add accounts to your chart of accounts to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Total Debits</p>
                      <p className="text-2xl font-bold">
                        ${trialBalanceData.totalDebits.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Total Credits</p>
                      <p className="text-2xl font-bold">
                        ${trialBalanceData.totalCredits.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Difference</p>
                      <p className="text-2xl font-bold">
                        ${trialBalanceData.difference.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Accounts Table by Type */}
                {Object.entries(groupedAccounts).map(([accountType, accounts]) => (
                  <div key={accountType} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{accountType}</h3>
                      <Badge variant="secondary">{accounts.length} accounts</Badge>
                    </div>

                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accounts.map((account) => (
                            <TableRow key={account.id}>
                              <TableCell className="font-medium">
                                {account.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {account.detail_type}
                              </TableCell>
                              <TableCell className="text-right">
                                {account.debit > 0 ? (
                                  <span className="font-medium">
                                    ${account.debit.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {account.credit > 0 ? (
                                  <span className="font-medium">
                                    ${account.credit.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}

                {/* Totals Row */}
                <div className="border-t-2 border-primary pt-4">
                  <div className="grid grid-cols-12 gap-4 px-4">
                    <div className="col-span-7 md:col-span-8"></div>
                    <div className="col-span-2 text-right">
                      <p className="text-sm font-semibold mb-1">Total</p>
                      <p className="text-xl font-bold">
                        ${trialBalanceData.totalDebits.toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-3 md:col-span-2 text-right">
                      <p className="text-sm font-semibold mb-1">Total</p>
                      <p className="text-xl font-bold">
                        ${trialBalanceData.totalCredits.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TrialBalance;
