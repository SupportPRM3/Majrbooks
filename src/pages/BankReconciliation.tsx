import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Check, X, Link2, AlertCircle, Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface BankTransaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: string;
  is_reconciled: boolean;
  reference_number?: string;
}

interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  is_reconciled: boolean;
  account?: {
    name: string;
  };
}

interface ReconciliationMatch {
  id: string;
  bank_transaction_id: string;
  ledger_transaction_id: string;
}

interface MatchPair {
  bankId: string;
  ledgerId: string;
}

const BankReconciliation = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [matchPairs, setMatchPairs] = useState<MatchPair[]>([]);
  const [selectedBankTxns, setSelectedBankTxns] = useState<Set<string>>(new Set());
  const [selectedLedgerTxns, setSelectedLedgerTxns] = useState<Set<string>>(new Set());
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chart of accounts
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .in("account_type", ["Asset", "Bank", "Cash"])
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch bank transactions
  const { data: bankTransactions, isLoading: loadingBank } = useQuery({
    queryKey: ["bank-transactions", selectedAccount],
    queryFn: async () => {
      if (!selectedAccount) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bank_transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("account_id", selectedAccount)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data as BankTransaction[];
    },
    enabled: !!selectedAccount,
  });

  // Fetch ledger transactions
  const { data: ledgerTransactions, isLoading: loadingLedger } = useQuery({
    queryKey: ["ledger-transactions", selectedAccount],
    queryFn: async () => {
      if (!selectedAccount) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("transactions")
        .select("*, chart_of_accounts!transactions_account_id_fkey(name)")
        .eq("user_id", user.id)
        .eq("account_id", selectedAccount)
        .order("date", { ascending: false });

      if (error) throw error;
      return data.map(txn => ({
        ...txn,
        account: txn.chart_of_accounts as { name: string } | undefined
      })) as LedgerTransaction[];
    },
    enabled: !!selectedAccount,
  });

  // Fetch reconciliation matches
  const { data: matches } = useQuery({
    queryKey: ["reconciliation-matches", selectedAccount],
    queryFn: async () => {
      if (!selectedAccount) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("reconciliation_matches")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as ReconciliationMatch[];
    },
    enabled: !!selectedAccount,
  });

  // CSV Import mutation
  const importCSVMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

      // Find column indices
      const dateIdx = headers.findIndex(h => h.includes('date'));
      const descIdx = headers.findIndex(h => h.includes('description') || h.includes('memo') || h.includes('detail'));
      const amountIdx = headers.findIndex(h => h.includes('amount'));
      const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('withdrawal'));
      const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('deposit'));
      const refIdx = headers.findIndex(h => h.includes('reference') || h.includes('ref') || h.includes('check'));

      if (dateIdx === -1 || descIdx === -1) {
        throw new Error("CSV must contain 'Date' and 'Description' columns");
      }

      if (amountIdx === -1 && (debitIdx === -1 || creditIdx === -1)) {
        throw new Error("CSV must contain 'Amount' or 'Debit'/'Credit' columns");
      }

      const transactions = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        
        let amount = 0;
        let type: 'debit' | 'credit' = 'debit';

        if (amountIdx !== -1) {
          const amountStr = values[amountIdx].replace(/[$,]/g, '');
          amount = Math.abs(parseFloat(amountStr) || 0);
          type = parseFloat(amountStr) < 0 ? 'debit' : 'credit';
        } else {
          const debitAmount = debitIdx !== -1 ? parseFloat(values[debitIdx].replace(/[$,]/g, '') || '0') : 0;
          const creditAmount = creditIdx !== -1 ? parseFloat(values[creditIdx].replace(/[$,]/g, '') || '0') : 0;
          
          if (debitAmount > 0) {
            amount = debitAmount;
            type = 'debit';
          } else if (creditAmount > 0) {
            amount = creditAmount;
            type = 'credit';
          }
        }

        if (amount === 0) continue;

        // Parse date - try multiple formats
        let transactionDate: Date;
        const dateStr = values[dateIdx];
        try {
          // Try common formats
          transactionDate = parse(dateStr, 'MM/dd/yyyy', new Date());
          if (isNaN(transactionDate.getTime())) {
            transactionDate = parse(dateStr, 'yyyy-MM-dd', new Date());
          }
          if (isNaN(transactionDate.getTime())) {
            transactionDate = parse(dateStr, 'M/d/yyyy', new Date());
          }
          if (isNaN(transactionDate.getTime())) {
            transactionDate = new Date(dateStr);
          }
        } catch {
          console.warn(`Could not parse date: ${dateStr}`);
          continue;
        }

        transactions.push({
          user_id: user.id,
          account_id: selectedAccount,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          description: values[descIdx],
          amount: amount,
          transaction_type: type,
          reference_number: refIdx !== -1 ? values[refIdx] : null,
        });
      }

      if (transactions.length === 0) {
        throw new Error("No valid transactions found in CSV");
      }

      const { error } = await supabase
        .from("bank_transactions")
        .insert(transactions);

      if (error) throw error;

      return transactions.length;
    },
    onSuccess: (count) => {
      toast({ 
        title: "Success", 
        description: `Imported ${count} transactions from CSV` 
      });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk reconciliation mutation
  const bulkReconcileMutation = useMutation({
    mutationFn: async (pairs: MatchPair[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create all matches
      const matchRecords = pairs.map(pair => ({
        user_id: user.id,
        bank_transaction_id: pair.bankId,
        ledger_transaction_id: pair.ledgerId,
      }));

      const { error: matchError } = await supabase
        .from("reconciliation_matches")
        .insert(matchRecords);

      if (matchError) throw matchError;

      // Update all bank transactions
      const bankIds = pairs.map(p => p.bankId);
      const { error: bankError } = await supabase
        .from("bank_transactions")
        .update({ is_reconciled: true, reconciled_at: new Date().toISOString() })
        .in("id", bankIds);

      if (bankError) throw bankError;

      // Update all ledger transactions
      const ledgerIds = pairs.map(p => p.ledgerId);
      const { error: ledgerError } = await supabase
        .from("transactions")
        .update({ is_reconciled: true, reconciled_at: new Date().toISOString() })
        .in("id", ledgerIds);

      if (ledgerError) throw ledgerError;

      return pairs.length;
    },
    onSuccess: (count) => {
      toast({ 
        title: "Success", 
        description: `Reconciled ${count} transaction pair${count > 1 ? 's' : ''}` 
      });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["ledger-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliation-matches"] });
      setMatchPairs([]);
      setSelectedBankTxns(new Set());
      setSelectedLedgerTxns(new Set());
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reconcile: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Unmatch mutation
  const unmatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const match = matches?.find(m => m.id === matchId);
      if (!match) throw new Error("Match not found");

      const { error: deleteError } = await supabase
        .from("reconciliation_matches")
        .delete()
        .eq("id", matchId);

      if (deleteError) throw deleteError;

      const { error: bankError } = await supabase
        .from("bank_transactions")
        .update({ is_reconciled: false, reconciled_at: null })
        .eq("id", match.bank_transaction_id);

      if (bankError) throw bankError;

      const { error: ledgerError } = await supabase
        .from("transactions")
        .update({ is_reconciled: false, reconciled_at: null })
        .eq("id", match.ledger_transaction_id);

      if (ledgerError) throw ledgerError;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Match removed successfully" });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["ledger-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliation-matches"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove match: " + error.message,
        variant: "destructive",
      });
    },
  });

  // PDF Analysis mutation
  const analyzePdfMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      setIsAnalyzingPdf(true);
      setAnalysisProgress(10);

      // Upload PDF to temporary storage
      const fileName = `${user.id}/bank-statements/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      setAnalysisProgress(30);

      // Get signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('receipts')
        .createSignedUrl(fileName, 3600);

      if (signedUrlError) throw signedUrlError;
      setAnalysisProgress(50);

      // Call the AI analysis function
      const { data, error } = await supabase.functions.invoke('analyze-bank-statement', {
        body: { 
          fileUrl: signedUrlData.signedUrl,
          accountId: selectedAccount
        }
      });

      setAnalysisProgress(90);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Analysis failed");

      setAnalysisProgress(100);
      return data.data;
    },
    onSuccess: (data) => {
      toast({ 
        title: "PDF Analysis Complete", 
        description: `Imported ${data.transactions_count} transactions from bank statement` 
      });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsAnalyzingPdf(false);
      setAnalysisProgress(0);
    },
    onError: (error) => {
      toast({
        title: "PDF Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsAnalyzingPdf(false);
      setAnalysisProgress(0);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    if (!isPdf && !isCsv) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV or PDF file",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAccount) {
      toast({
        title: "No Account Selected",
        description: "Please select an account first",
        variant: "destructive",
      });
      return;
    }

    if (isPdf) {
      analyzePdfMutation.mutate(file);
    } else {
      importCSVMutation.mutate(file);
    }
  };

  const handleAddPair = () => {
    if (selectedBankTxns.size === 0 || selectedLedgerTxns.size === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one bank and one ledger transaction",
        variant: "destructive",
      });
      return;
    }

    if (selectedBankTxns.size !== selectedLedgerTxns.size) {
      toast({
        title: "Mismatch",
        description: "Number of selected bank and ledger transactions must match",
        variant: "destructive",
      });
      return;
    }

    const bankArray = Array.from(selectedBankTxns);
    const ledgerArray = Array.from(selectedLedgerTxns);
    
    const newPairs = bankArray.map((bankId, idx) => ({
      bankId,
      ledgerId: ledgerArray[idx],
    }));

    setMatchPairs([...matchPairs, ...newPairs]);
    setSelectedBankTxns(new Set());
    setSelectedLedgerTxns(new Set());

    toast({
      title: "Pairs Added",
      description: `Added ${newPairs.length} pair${newPairs.length > 1 ? 's' : ''} to reconciliation queue`,
    });
  };

  const handleBulkReconcile = () => {
    if (matchPairs.length === 0) {
      toast({
        title: "No Pairs",
        description: "Please add transaction pairs to reconcile",
        variant: "destructive",
      });
      return;
    }

    bulkReconcileMutation.mutate(matchPairs);
  };

  const toggleBankSelection = (id: string, isReconciled: boolean) => {
    if (isReconciled) return;
    
    const newSet = new Set(selectedBankTxns);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedBankTxns(newSet);
  };

  const toggleLedgerSelection = (id: string, isReconciled: boolean) => {
    if (isReconciled) return;
    
    const newSet = new Set(selectedLedgerTxns);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedLedgerTxns(newSet);
  };

  const getMatchForTransaction = (txnId: string, isBank: boolean) => {
    return matches?.find(m =>
      isBank ? m.bank_transaction_id === txnId : m.ledger_transaction_id === txnId
    );
  };

  const isPaired = (txnId: string, isBank: boolean) => {
    return matchPairs.some(p =>
      isBank ? p.bankId === txnId : p.ledgerId === txnId
    );
  };

  // Calculate summary
  const unreconciledBankTotal = bankTransactions
    ?.filter(t => !t.is_reconciled)
    .reduce((sum, t) => sum + Number(t.amount) * (t.transaction_type === 'debit' ? -1 : 1), 0) || 0;

  const unreconciledLedgerTotal = ledgerTransactions
    ?.filter(t => !t.is_reconciled)
    .reduce((sum, t) => sum + Number(t.amount) * (t.type === 'expense' ? -1 : 1), 0) || 0;

  const difference = Math.abs(unreconciledBankTotal - unreconciledLedgerTotal);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Bank Reconciliation</h1>
          <p className="text-muted-foreground">
            Match bank statement transactions with ledger entries
          </p>
        </div>

        {/* Account Selection & CSV Import */}
        <Card>
          <CardHeader>
            <CardTitle>Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account">Bank Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="csv-upload">Import Bank Statement</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    id="csv-upload"
                    type="file"
                    accept=".csv,.pdf"
                    onChange={handleFileUpload}
                    disabled={!selectedAccount || importCSVMutation.isPending || isAnalyzingPdf}
                  />
                  <Button
                    variant="outline"
                    disabled={!selectedAccount || isAnalyzingPdf}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isAnalyzingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload CSV or PDF bank statements. AI will automatically extract transactions from PDFs.
                </p>
                {isAnalyzingPdf && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm font-medium">AI is analyzing your bank statement...</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {analysisProgress < 30 && "Uploading document..."}
                      {analysisProgress >= 30 && analysisProgress < 50 && "Preparing for analysis..."}
                      {analysisProgress >= 50 && analysisProgress < 90 && "🔍 AI extracting transactions..."}
                      {analysisProgress >= 90 && "Saving transactions..."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedAccount && (
          <>
            {/* Summary */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <p className="text-sm font-medium">Unreconciled Bank</p>
                    <p className="text-lg font-bold">
                      ${Math.abs(unreconciledBankTotal).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Unreconciled Ledger</p>
                    <p className="text-lg font-bold">
                      ${Math.abs(unreconciledLedgerTotal).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Difference</p>
                    <p className={`text-lg font-bold ${difference < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      ${difference.toFixed(2)}
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Bulk Actions */}
            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      Selected: {selectedBankTxns.size} bank, {selectedLedgerTxns.size} ledger
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Queued pairs: {matchPairs.length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddPair}
                      disabled={selectedBankTxns.size === 0 || selectedLedgerTxns.size === 0}
                      variant="outline"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Add Pairs
                    </Button>
                    {matchPairs.length > 0 && (
                      <>
                        <Button
                          onClick={() => setMatchPairs([])}
                          variant="outline"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Queue
                        </Button>
                        <Button
                          onClick={handleBulkReconcile}
                          disabled={bulkReconcileMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Reconcile {matchPairs.length} Pair{matchPairs.length > 1 ? 's' : ''}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bank Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Bank Transactions</span>
                    <Badge variant="secondary">
                      {bankTransactions?.filter(t => !t.is_reconciled).length || 0} unreconciled
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingBank ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : !bankTransactions || bankTransactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No bank transactions found. Import your bank statement to get started.
                    </p>
                  ) : (
                    <div className="border rounded-lg max-h-[600px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bankTransactions.map((txn) => {
                            const match = getMatchForTransaction(txn.id, true);
                            const isSelected = selectedBankTxns.has(txn.id);
                            const isPairedInQueue = isPaired(txn.id, true);

                            return (
                              <TableRow
                                key={txn.id}
                                className={`cursor-pointer ${isSelected ? 'bg-primary/10' : ''} ${txn.is_reconciled ? 'opacity-50' : ''} ${isPairedInQueue ? 'bg-yellow-50' : ''}`}
                                onClick={() => toggleBankSelection(txn.id, txn.is_reconciled)}
                              >
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={txn.is_reconciled}
                                    onChange={() => {}}
                                    className="cursor-pointer"
                                  />
                                </TableCell>
                                <TableCell className="text-sm">
                                  {format(new Date(txn.transaction_date), "MMM d")}
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                  {txn.description}
                                  {txn.reference_number && (
                                    <span className="text-xs text-muted-foreground block">
                                      Ref: {txn.reference_number}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  <span className={txn.transaction_type === 'debit' ? 'text-red-600' : 'text-green-600'}>
                                    {txn.transaction_type === 'debit' ? '-' : '+'}$
                                    {Math.abs(Number(txn.amount)).toFixed(2)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {txn.is_reconciled && match && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        unmatchMutation.mutate(match.id);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {txn.is_reconciled && !match && (
                                    <Check className="h-4 w-4 text-green-600" />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ledger Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Ledger Transactions</span>
                    <Badge variant="secondary">
                      {ledgerTransactions?.filter(t => !t.is_reconciled).length || 0} unreconciled
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingLedger ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : !ledgerTransactions || ledgerTransactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No ledger transactions found for this account.
                    </p>
                  ) : (
                    <div className="border rounded-lg max-h-[600px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledgerTransactions.map((txn) => {
                            const match = getMatchForTransaction(txn.id, false);
                            const isSelected = selectedLedgerTxns.has(txn.id);
                            const isPairedInQueue = isPaired(txn.id, false);

                            return (
                              <TableRow
                                key={txn.id}
                                className={`cursor-pointer ${isSelected ? 'bg-primary/10' : ''} ${txn.is_reconciled ? 'opacity-50' : ''} ${isPairedInQueue ? 'bg-yellow-50' : ''}`}
                                onClick={() => toggleLedgerSelection(txn.id, txn.is_reconciled)}
                              >
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={txn.is_reconciled}
                                    onChange={() => {}}
                                    className="cursor-pointer"
                                  />
                                </TableCell>
                                <TableCell className="text-sm">
                                  {format(new Date(txn.date), "MMM d")}
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                  {txn.description}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  <span className={txn.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                                    {txn.type === 'expense' ? '-' : '+'}$
                                    {Math.abs(Number(txn.amount)).toFixed(2)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {txn.is_reconciled && match && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        unmatchMutation.mutate(match.id);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {txn.is_reconciled && !match && (
                                    <Check className="h-4 w-4 text-green-600" />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default BankReconciliation;
