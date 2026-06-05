import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import CreateJournalEntryDialog from "@/components/CreateJournalEntryDialog";
import JournalEntryDetailDialog from "@/components/JournalEntryDetailDialog";

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string | null;
  reference: string | null;
  status: string;
  source_type: string | null;
  source_id: string | null;
  created_at: string;
}

const JournalEntries = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchEntries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("entry_date", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
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
    fetchEntries();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "posted":
        return "default";
      case "draft":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleViewLinkedTransaction = (entry: JournalEntry) => {
    if (entry.source_type === 'invoice' && entry.source_id) {
      toast({ title: "Opening linked invoice..." });
      navigate(`/invoices`);
    } else if (entry.source_type === 'payment' && entry.source_id) {
      toast({ title: "Opening linked payment..." });
      navigate(`/invoices`);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Journal Entries</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage manual journal entries
            </p>
          </div>
          <Button onClick={() => {
            toast({ title: "Creating new journal entry..." });
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Journal Entry
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading entries...
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No journal entries yet. Create your first entry to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Linked Transaction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.entry_number}</TableCell>
                      <TableCell>{format(new Date(entry.entry_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{entry.description || "-"}</TableCell>
                      <TableCell>{entry.reference || "-"}</TableCell>
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
                            {!entry.source_type && 'Manual Entry'}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">Manual Entry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({ title: `Viewing entry ${entry.entry_number}...` });
                            setSelectedEntryId(entry.id);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <CreateJournalEntryDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={fetchEntries}
        />

        <JournalEntryDetailDialog
          entryId={selectedEntryId}
          open={!!selectedEntryId}
          onOpenChange={(open) => !open && setSelectedEntryId(null)}
        />
      </div>
    </Layout>
  );
};

export default JournalEntries;
