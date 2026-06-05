import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const journalEntrySchema = z.object({
  entry_number: z.string().min(1, "Entry number is required"),
  entry_date: z.string().min(1, "Entry date is required"),
  description: z.string().optional(),
  reference: z.string().optional(),
  status: z.enum(["draft", "posted"]),
});

interface JournalEntryLine {
  account_id: string;
  description: string;
  debit: number;
  credit: number;
}

interface Account {
  id: string;
  name: string;
  account_type: string;
}

interface CreateJournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateJournalEntryDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateJournalEntryDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lines, setLines] = useState<JournalEntryLine[]>([
    { account_id: "", description: "", debit: 0, credit: 0 },
    { account_id: "", description: "", debit: 0, credit: 0 },
  ]);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof journalEntrySchema>>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      entry_number: `JE-${Date.now()}`,
      entry_date: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (open) {
      fetchAccounts();
    }
  }, [open]);

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("id, name, account_type")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addLine = () => {
    setLines([...lines, { account_id: "", description: "", debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof JournalEntryLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const getTotals = () => {
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    return { totalDebit, totalCredit };
  };

  const onSubmit = async (values: z.infer<typeof journalEntrySchema>) => {
    if (!user) return;

    const { totalDebit, totalCredit } = getTotals();
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast({
        title: "Error",
        description: "Debits and credits must be equal",
        variant: "destructive",
      });
      return;
    }

    if (lines.some((line) => !line.account_id)) {
      toast({
        title: "Error",
        description: "Please select an account for all lines",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: entryData, error: entryError } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          entry_number: values.entry_number,
          entry_date: values.entry_date,
          description: values.description,
          reference: values.reference,
          status: values.status,
          source_type: 'manual',
        })
        .select()
        .single();

      if (entryError) throw entryError;

      const lineInserts = lines.map((line) => ({
        journal_entry_id: entryData.id,
        account_id: line.account_id,
        description: line.description,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      }));

      const { error: linesError } = await supabase
        .from("journal_entry_lines")
        .insert(lineInserts);

      if (linesError) throw linesError;

      toast({
        title: "Success",
        description: "Journal entry created successfully",
      });

      form.reset();
      setLines([
        { account_id: "", description: "", debit: 0, credit: 0 },
        { account_id: "", description: "", debit: 0, credit: 0 },
      ]);
      onOpenChange(false);
      onSuccess();
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

  const { totalDebit, totalCredit } = getTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Journal Entry</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entry_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional reference number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="posted">Posted</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Line Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4">
                      <Select
                        value={line.account_id}
                        onValueChange={(value) => updateLine(index, "account_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Description"
                        value={line.description}
                        onChange={(e) => updateLine(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Debit"
                        step="0.01"
                        value={line.debit || ""}
                        onChange={(e) => updateLine(index, "debit", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Credit"
                        step="0.01"
                        value={line.credit || ""}
                        onChange={(e) => updateLine(index, "credit", e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(index)}
                        disabled={lines.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-8 pt-4 border-t">
                <div className="text-sm">
                  <span className="font-semibold">Total Debit:</span> ${totalDebit.toFixed(2)}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Total Credit:</span> ${totalCredit.toFixed(2)}
                </div>
                <div className={`text-sm font-semibold ${isBalanced ? "text-green-600" : "text-destructive"}`}>
                  {isBalanced ? "✓ Balanced" : "✗ Not Balanced"}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !isBalanced}>
                {loading ? "Creating..." : "Create Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJournalEntryDialog;
