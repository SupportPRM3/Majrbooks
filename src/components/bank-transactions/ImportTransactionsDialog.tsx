import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Trash2,
  Loader2,
  FolderOpen,
  Eye,
} from "lucide-react";

interface StorageDoc {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  metadata: { size: number; mimetype: string } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
  onSuccess?: (count: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BUCKET = "bank-statements";

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />;
  if (["xls", "xlsx", "csv"].includes(ext || ""))
    return <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
    return <FileImage className="h-5 w-5 text-purple-500 flex-shrink-0" />;
  return <File className="h-5 w-5 text-blue-500 flex-shrink-0" />;
}

function getTypeBadge(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("tax") || lower.includes("w2") || lower.includes("1099"))
    return <Badge className="text-xs bg-red-100 text-red-700 border-0">Tax</Badge>;
  if (lower.includes("bank") || lower.includes("statement"))
    return <Badge className="text-xs bg-blue-100 text-blue-700 border-0">Bank Statement</Badge>;
  if (lower.includes("invoice") || lower.includes("receipt"))
    return <Badge className="text-xs bg-green-100 text-green-700 border-0">Invoice</Badge>;
  if (lower.includes("report") || lower.includes("balance") || lower.includes("pl"))
    return <Badge className="text-xs bg-purple-100 text-purple-700 border-0">Report</Badge>;
  return <Badge variant="secondary" className="text-xs border-0">Document</Badge>;
}

// strip timestamp prefix we add on upload
function displayName(name: string) {
  return name.replace(/^\d+_/, "");
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ImportTransactionsDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<StorageDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storagePath = user ? `${user.id}` : null;

  useEffect(() => {
    if (open && user) {
      ensureBucketsAndLoad();
    }
  }, [open, user]);

  const ensureBuckets = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;
      await supabase.functions.invoke("setup-storage", {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // silently ignore — bucket may already exist
    }
  };

  const ensureBucketsAndLoad = async () => {
    await ensureBuckets();
    loadDocs();
  };

  const loadDocs = async () => {
    if (!storagePath) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(storagePath, { sortBy: { column: "created_at", order: "desc" } });
      if (!error) setDocs((data as StorageDoc[]) || []);
    } catch {
      // bucket may not exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!user || !storagePath) return;
    setUploading(true);
    try {
      // Ensure bucket exists before uploading
      await ensureBuckets();

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${storagePath}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) throw error;
      toast.success(`"${file.name}" uploaded`);
      loadDocs();
    } catch (err: any) {
      toast.error("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: StorageDoc) => {
    if (!storagePath) return;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${storagePath}/${doc.name}`, 120);
    if (error || !data?.signedUrl) {
      toast.error("Could not generate download link");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = displayName(doc.name);
    a.target = "_blank";
    a.click();
  };

  const handleView = async (doc: StorageDoc) => {
    if (!storagePath) return;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${storagePath}/${doc.name}`, 300);
    if (error || !data?.signedUrl) {
      toast.error("Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (doc: StorageDoc) => {
    if (!storagePath) return;
    setDeletingId(doc.name);
    try {
      const { error } = await supabase.storage
        .from(BUCKET)
        .remove([`${storagePath}/${doc.name}`]);
      if (error) throw error;
      toast.success("Document deleted");
      setDocs((prev) => prev.filter((d) => d.name !== doc.name));
    } catch (err: any) {
      toast.error("Delete failed: " + (err?.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f);
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleUpload(f);
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">Bank Statements & Documents</DialogTitle>
            <span className="text-xs text-muted-foreground">{docs.length} file{docs.length !== 1 ? "s" : ""}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">

          {/* Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.csv,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png,.txt,.zip"
              onChange={handleFileChange}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm font-medium">Uploading…</p>
              </div>
            ) : (
              <>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PDF, CSV, Excel, Word, images — any bank statement or financial document
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Document List */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No documents uploaded yet</p>
              <p className="text-xs mt-1">Upload a bank statement, PDF, or CSV above</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Uploaded Documents</p>
              {docs.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/40 transition-colors group"
                >
                  {getDocIcon(doc.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{displayName(doc.name)}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {getTypeBadge(displayName(doc.name))}
                      {doc.metadata?.size && (
                        <span className="text-xs text-muted-foreground">{formatSize(doc.metadata.size)}</span>
                      )}
                      {doc.created_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(doc)}
                      title="View"
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.name}
                      title="Delete"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      {deletingId === doc.name
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border flex-shrink-0 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTransactionsDialog;
