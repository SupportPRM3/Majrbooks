import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Upload, X } from "lucide-react";

interface CreateTaxReturnDialogProps {
  clientId?: string;
  onTaxReturnCreated?: () => void;
}

export const CreateTaxReturnDialog = ({ clientId, onTaxReturnCreated }: CreateTaxReturnDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    client_id: clientId || "",
    tax_year: new Date().getFullYear(),
    filing_type: "individual",
    status: "not_started",
    deadline: "",
    notes: "",
  });

  const loadClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("clients")
      .select("id, client_name")
      .eq("user_id", user.id)
      .order("client_name");
    setClients(data || []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments([...documents, ...Array.from(e.target.files)]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.client_id || !formData.deadline) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Create tax return
      const { data: taxReturn, error: insertError } = await supabase
        .from("tax_returns")
        .insert({
          user_id: user.id,
          client_id: formData.client_id,
          tax_year: formData.tax_year,
          filing_type: formData.filing_type,
          status: formData.status,
          deadline: formData.deadline,
          notes: formData.notes,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload documents
      if (documents.length > 0 && taxReturn) {
        for (const file of documents) {
          const filePath = `${user.id}/${taxReturn.id}/${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("tax-documents")
            .upload(filePath, file);

          if (uploadError) throw uploadError;
        }
      }

      toast.success("Tax return created successfully");
      setOpen(false);
      setFormData({
        client_id: clientId || "",
        tax_year: new Date().getFullYear(),
        filing_type: "individual",
        status: "not_started",
        deadline: "",
        notes: "",
      });
      setDocuments([]);
      onTaxReturnCreated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create tax return");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen && !clientId) loadClients();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Tax Return
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Tax Return</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {!clientId && (
              <div className="col-span-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="tax_year">Tax Year *</Label>
              <Input
                id="tax_year"
                type="number"
                value={formData.tax_year}
                onChange={(e) => setFormData({ ...formData, tax_year: parseInt(e.target.value) })}
                min="2000"
                max="2100"
              />
            </div>

            <div>
              <Label htmlFor="filing_type">Filing Type *</Label>
              <Select
                value={formData.filing_type}
                onValueChange={(value) => setFormData({ ...formData, filing_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="filed">Filed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label>Documents</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
                  />
                  <Button type="button" size="icon" variant="outline" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                    </label>
                  </Button>
                </div>
                {documents.length > 0 && (
                  <div className="space-y-1">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm truncate">{doc.name}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeDocument(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Tax Return"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
