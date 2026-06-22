import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ClientLayout from "@/components/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  Info,
} from "lucide-react";

interface StorageDoc {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
}

const BUCKET = "client-documents";

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />;
  if (["xls", "xlsx", "csv"].includes(ext || "")) return <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return <FileImage className="h-5 w-5 text-purple-500 flex-shrink-0" />;
  return <File className="h-5 w-5 text-blue-500 flex-shrink-0" />;
}

function getTypeBadge(name: string) {
  const lower = name.replace(/^\d+_/, "").toLowerCase();
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

function displayName(name: string) {
  return name.replace(/^\d+_/, "");
}

const ClientDocuments = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<StorageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storagePath = user ? `${user.id}` : null;

  useEffect(() => {
    if (user) ensureAndLoad();
  }, [user]);

  const ensureBuckets = async () => {
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s?.session?.access_token;
      if (!token) return;
      await supabase.functions.invoke("setup-storage", {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* silent */ }
  };

  const ensureAndLoad = async () => {
    await ensureBuckets();
    loadDocs();
  };

  const loadDocs = async () => {
    if (!storagePath) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(`${storagePath}`, { sortBy: { column: "created_at", order: "desc" } });
      if (!error) setDocs((data as StorageDoc[]) || []);
    } catch { /* bucket may not exist yet */ }
    finally { setLoading(false); }
  };

  const handleUpload = async (file: File) => {
    if (!user || !storagePath) return;
    setUploading(true);
    try {
      await ensureBuckets();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${storagePath}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) throw error;
      toast.success(`"${file.name}" uploaded successfully`);
      loadDocs();
    } catch (err: any) {
      toast.error("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleUpload(f);
  }, [user]);

  const handleView = async (doc: StorageDoc) => {
    if (!storagePath) return;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${storagePath}/${doc.name}`, 300);
    if (error || !data?.signedUrl) { toast.error("Could not open file"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const handleDownload = async (doc: StorageDoc) => {
    if (!storagePath) return;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${storagePath}/${doc.name}`, 120);
    if (error || !data?.signedUrl) { toast.error("Could not download file"); return; }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = displayName(doc.name);
    a.click();
  };

  const handleDelete = async (doc: StorageDoc) => {
    if (!storagePath) return;
    setDeletingId(doc.name);
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([`${storagePath}/${doc.name}`]);
      if (error) throw error;
      toast.success("Document deleted");
      setDocs((prev) => prev.filter((d) => d.name !== doc.name));
    } catch (err: any) {
      toast.error("Delete failed: " + (err?.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Documents</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            Upload and access your financial documents securely
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Upload any financial documents here — tax forms, bank statements, receipts, or reports.
            Your accountant can access these to help with your books.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upload Zone */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Upload Document</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors text-center",
                    isDragging ? "border-primary bg-primary/5" : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    uploading && "pointer-events-none opacity-60"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.csv,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png,.txt,.zip"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-sm font-medium text-gray-600">Uploading…</p>
                    </>
                  ) : (
                    <>
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Drag & drop or click
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF, Excel, Word, images up to 50 MB
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Accepted formats</p>
                  {["PDF documents", "Excel / CSV", "Word documents", "Images (JPG, PNG)", "ZIP archives"].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="h-1 w-1 rounded-full bg-gray-300" />
                      {t}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    Uploaded Documents
                  </CardTitle>
                  <span className="text-xs text-gray-400">{docs.length} file{docs.length !== 1 ? "s" : ""}</span>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : docs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No documents yet</p>
                    <p className="text-xs mt-1">Upload your first document using the panel on the left</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div
                        key={doc.name}
                        className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        {getIcon(doc.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {displayName(doc.name)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {getTypeBadge(displayName(doc.name))}
                            {doc.metadata?.size && (
                              <span className="text-xs text-gray-400">{formatSize(doc.metadata.size)}</span>
                            )}
                            {doc.created_at && (
                              <span className="text-xs text-gray-400">
                                {format(new Date(doc.created_at), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => handleView(doc)} title="View" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)} title="Download" className="h-8 w-8 p-0">
                            <Download className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc.name}
                            title="Delete"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientDocuments;
