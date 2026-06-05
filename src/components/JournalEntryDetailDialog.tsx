import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface JournalEntryDetailDialogProps {
  entryId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string | null;
  reference: string | null;
  status: string;
  source_type: string | null;
  source_id: string | null;
}

interface JournalEntryLine {
  id: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string | null;
  chart_of_accounts: {
    name: string;
    account_type: string;
  };
}

const JournalEntryDetailDialog = ({
  entryId,
  open,
  onOpenChange,
}: JournalEntryDetailDialogProps) => {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [lines, setLines] = useState<JournalEntryLine[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (entryId && open) {
      fetchEntryDetails();
    }
  }, [entryId, open]);

  const fetchEntryDetails = async () => {
    if (!entryId) return;

    setLoading(true);
    try {
      // Fetch entry
      const { data: entryData, error: entryError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .single();

      if (entryError) throw entryError;
      setEntry(entryData);

      // Fetch lines with account info
      const { data: linesData, error: linesError } = await supabase
        .from("journal_entry_lines")
        .select(`
          *,
          chart_of_accounts (
            name,
            account_type
          )
        `)
        .eq("journal_entry_id", entryId);

      if (linesError) throw linesError;
      setLines(linesData || []);
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

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit), 0);
  const isBalanced = totalDebit === totalCredit;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Journal Entry Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading details...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Entry Header */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Entry Number</div>
                <div className="font-medium">{entry.entry_number}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="font-medium">
                  {format(new Date(entry.entry_date), "MMM d, yyyy")}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant={entry.status === "posted" ? "default" : "secondary"}>
                  {entry.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Source</div>
                <div className="font-medium">
                  {entry.source_type === 'invoice' && `Invoice #${entry.reference}`}
                  {entry.source_type === 'payment' && `Payment - ${entry.reference}`}
                  {(!entry.source_type || entry.source_type === 'manual') && 'Manual Entry'}
                </div>
              </div>
              {entry.description && (
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div className="font-medium">{entry.description}</div>
                </div>
              )}
              {entry.reference && (
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Reference</div>
                  <div className="font-medium">{entry.reference}</div>
                </div>
              )}
            </div>

            <Separator />

            {/* Entry Lines */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Transaction Lines</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">
                        {line.chart_of_accounts.name}
                      </TableCell>
                      <TableCell>{line.chart_of_accounts.account_type}</TableCell>
                      <TableCell>{line.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalDebit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalCredit)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">Balance:</span>
                <Badge variant={isBalanced ? "default" : "destructive"}>
                  {isBalanced ? "Balanced" : "Unbalanced"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JournalEntryDetailDialog;
