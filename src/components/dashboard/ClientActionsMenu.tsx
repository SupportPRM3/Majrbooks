import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Eye, Pencil, StickyNote, Upload, Archive, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClientActionsMenuProps {
  client: {
    id: string;
    client_name: string;
    notes?: string | null;
  };
  onClientUpdated: () => void;
}

export const ClientActionsMenu = ({ client, onClientUpdated }: ClientActionsMenuProps) => {
  const navigate = useNavigate();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [note, setNote] = useState(client.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleViewClient = () => {
    toast.info(`Viewing ${client.client_name}...`);
    navigate(`/client/${client.id}`);
  };

  const handleEditClient = () => {
    toast.info(`Editing ${client.client_name}...`);
    navigate(`/client/${client.id}`);
  };

  const handleAddNote = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ notes: note })
        .eq("id", client.id);

      if (error) throw error;

      toast.success("Note saved successfully");
      setNoteDialogOpen(false);
      onClientUpdated();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveClient = async () => {
    if (!confirm(`Are you sure you want to archive ${client.client_name}?`)) return;
    
    try {
      const { error } = await supabase
        .from("clients")
        .update({ status: "archived" })
        .eq("id", client.id);

      if (error) throw error;

      toast.success("Client archived successfully");
      onClientUpdated();
    } catch (error) {
      console.error("Error archiving client:", error);
      toast.error("Failed to archive client");
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm(`Are you sure you want to delete ${client.client_name}? This action cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", client.id);

      if (error) throw error;

      toast.success("Client deleted successfully");
      onClientUpdated();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    }
  };

  const handleUploadDocuments = () => {
    setUploadDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
          <DropdownMenuItem onClick={handleViewClient}>
            <Eye className="h-4 w-4 mr-2" />
            View Client
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditClient}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Client
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setNoteDialogOpen(true)}>
            <StickyNote className="h-4 w-4 mr-2" />
            Add Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleUploadDocuments}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleArchiveClient}>
            <Archive className="h-4 w-4 mr-2" />
            Archive Client
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDeleteClient}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Client
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note for {client.client_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your note here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Documents Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documents for {client.client_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary font-medium">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                multiple
                onChange={() => toast.info("Document upload functionality coming soon")}
              />
              <p className="text-xs text-muted-foreground mt-2">
                PDF, DOC, DOCX, XLS, XLSX up to 10MB
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
