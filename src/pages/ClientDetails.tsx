import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getScopeOwnerId } from "@/lib/scopeOwner";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, Building, MapPin, User, FileText, Calendar, Download, FileSpreadsheet, DollarSign, Plus, Upload, Trash2, File, FileImage, Loader2, FolderOpen, Folder, FolderPlus, ChevronRight, Pencil, Eye, ExternalLink, FolderInput, ArrowUp } from "lucide-react";
import { format } from "date-fns";
import { CreateInvoiceDialog } from "@/components/CreateInvoiceDialog";
import { EditInvoiceDialog } from "@/components/EditInvoiceDialog";
import { RecurringInvoiceDialog } from "@/components/RecurringInvoiceDialog";
import { EditClientDialog } from "@/components/EditClientDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { exportInvoicesToExcel } from "@/lib/invoiceExport";
import { useToast } from "@/hooks/use-toast";

interface ClientDocument {
  name: string;
  id: string | null;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: { size: number; mimetype: string } | null;
}

interface Client {
  id: string;
  client_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  address: string | null;
  lead_accountant: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
  client_name: string;
}

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [recurringInvoiceOpen, setRecurringInvoiceOpen] = useState(false);
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ClientDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !id) {
      navigate("/dashboard");
      return;
    }
    loadClientData();
    setCurrentPath([]);
  }, [user, id]);

  useEffect(() => {
    if (!user || !id || !ownerId) return;
    loadDocuments();
  }, [user, id, ownerId, currentPath]);

  const loadClientData = async () => {
    if (!user || !id) return;

    setLoading(true);
    try {
      const resolvedOwnerId = await getScopeOwnerId(user.id);
      setOwnerId(resolvedOwnerId);

      // Load client details, scoped to this firm (owner or the team they belong to)
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .eq("user_id", resolvedOwnerId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Load associated invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_name", clientData.client_name)
        .eq("user_id", resolvedOwnerId)
        .order("issue_date", { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error("Error loading client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFolder = (doc: ClientDocument) => doc.id === null;

  const loadDocuments = async (path: string[] = currentPath) => {
    if (!user || !id || !ownerId) return;
    setDocsLoading(true);
    try {
      const fullPath = [ownerId, id, ...path].join("/");
      const { data, error } = await supabase.storage.from("client-documents").list(fullPath);
      if (!error) {
        const filtered = ((data as ClientDocument[]) || []).filter((d) => d.name !== ".keep");
        filtered.sort((a, b) => {
          if (isFolder(a) !== isFolder(b)) return isFolder(a) ? -1 : 1;
          if (isFolder(a)) return a.name.localeCompare(b.name);
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setDocuments(filtered);
      }
    } catch {
      // bucket may not exist yet — silently ignore
    } finally {
      setDocsLoading(false);
    }
  };

  const openFolder = (name: string) => setCurrentPath((prev) => [...prev, name]);

  const goToBreadcrumb = (index: number) => setCurrentPath((prev) => prev.slice(0, index));

  const handleCreateFolder = async () => {
    if (!user || !id || !ownerId) return;
    const name = newFolderName.trim();
    if (!name) return;
    if (documents.some((d) => isFolder(d) && d.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: "Folder already exists", variant: "destructive" });
      return;
    }
    setCreatingFolder(true);
    try {
      const safeName = name.replace(/[\/\\]/g, "-").replace(/[^a-zA-Z0-9 ._-]/g, "_");
      const path = [ownerId, id, ...currentPath, safeName, ".keep"].join("/");
      const { error } = await supabase.storage.from("client-documents").upload(path, new Blob([""]), { upsert: false });
      if (error) throw error;
      toast({ title: "Folder created", description: safeName });
      setNewFolderOpen(false);
      setNewFolderName("");
      loadDocuments();
    } catch (err: any) {
      toast({ title: "Failed to create folder", description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setCreatingFolder(false);
    }
  };

  const deleteFolderRecursive = async (path: string[]) => {
    if (!user || !id || !ownerId) return;
    const fullPath = [ownerId, id, ...path].join("/");
    const { data, error } = await supabase.storage.from("client-documents").list(fullPath);
    if (error) throw error;
    const filePaths: string[] = [];
    for (const entry of (data as ClientDocument[]) || []) {
      if (isFolder(entry)) {
        await deleteFolderRecursive([...path, entry.name]);
      } else {
        filePaths.push(`${fullPath}/${entry.name}`);
      }
    }
    if (filePaths.length > 0) {
      const { error: removeError } = await supabase.storage.from("client-documents").remove(filePaths);
      if (removeError) throw removeError;
    }
  };

  const handleDocUpload = async (file: File) => {
    if (!user || !id || !ownerId) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = [ownerId, id, ...currentPath, `${Date.now()}_${safeName}`].join("/");
      const { error } = await supabase.storage.from("client-documents").upload(path, file, { upsert: false });
      if (error) throw error;
      toast({ title: "Document uploaded", description: file.name });
      loadDocuments();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDocDownload = async (doc: ClientDocument) => {
    if (!user || !id || !ownerId) return;
    const path = [ownerId, id, ...currentPath, doc.name].join("/");
    const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(path, 120);
    if (error || !data?.signedUrl) {
      toast({ title: "Download failed", description: error?.message, variant: "destructive" });
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    // Strip the timestamp prefix we add on upload for the download filename
    a.download = doc.name.replace(/^\d+_/, "");
    a.target = "_blank";
    a.click();
  };

  const getPreviewKind = (name: string): "image" | "pdf" | null => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "image";
    return null;
  };

  const handleDocView = async (doc: ClientDocument) => {
    if (!user || !id || !ownerId) return;
    const path = [ownerId, id, ...currentPath, doc.name].join("/");
    const kind = getPreviewKind(doc.name);

    if (!kind) {
      // No inline preview available for this file type — just open it in a new tab.
      const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(path, 120);
      if (error || !data?.signedUrl) {
        toast({ title: "Preview failed", description: error?.message, variant: "destructive" });
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(path, 300);
      if (error || !data?.signedUrl) throw error || new Error("No signed URL returned");
      setPreviewUrl(data.signedUrl);
    } catch (err: any) {
      toast({ title: "Preview failed", description: err?.message, variant: "destructive" });
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleMoveDoc = async (doc: ClientDocument, destFolderName: string) => {
    if (!user || !id || !ownerId) return;
    const fromPath = [ownerId, id, ...currentPath, doc.name].join("/");
    const destPath = destFolderName === ".." ? currentPath.slice(0, -1) : [...currentPath, destFolderName];
    const toPath = [ownerId, id, ...destPath, doc.name].join("/");
    try {
      const { error } = await supabase.storage.from("client-documents").move(fromPath, toPath);
      if (error) throw error;
      toast({ title: "Document moved", description: getDocLabel(doc.name) });
      setDocuments((prev) => prev.filter((d) => d.name !== doc.name));
    } catch (err: any) {
      toast({ title: "Move failed", description: err?.message || "Unknown error", variant: "destructive" });
    }
  };

  const handleDocDelete = async (doc: ClientDocument) => {
    if (!user || !id || !ownerId) return;
    setDeletingDoc(doc.name);
    try {
      if (isFolder(doc)) {
        await deleteFolderRecursive([...currentPath, doc.name]);
      } else {
        const path = [ownerId, id, ...currentPath, doc.name].join("/");
        const { error } = await supabase.storage.from("client-documents").remove([path]);
        if (error) throw error;
      }
      toast({ title: isFolder(doc) ? "Folder deleted" : "Document deleted" });
      setDocuments((prev) => prev.filter((d) => d.name !== doc.name));
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message, variant: "destructive" });
    } finally {
      setDeletingDoc(null);
    }
  };

  const getDocIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />;
    if (["xls", "xlsx", "csv"].includes(ext || "")) return <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0" />;
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return <FileImage className="h-5 w-5 text-purple-500 flex-shrink-0" />;
    return <File className="h-5 w-5 text-blue-500 flex-shrink-0" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocLabel = (name: string) => {
    // strip the timestamp prefix we add on upload
    return name.replace(/^\d+_/, "");
  };

  const getDocTypeBadge = (name: string) => {
    const lower = getDocLabel(name).toLowerCase();
    if (lower.includes("tax") || lower.includes("w2") || lower.includes("1099") || lower.includes("schedule"))
      return <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Tax</Badge>;
    if (lower.includes("bank") || lower.includes("statement"))
      return <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Bank Statement</Badge>;
    if (lower.includes("invoice") || lower.includes("receipt"))
      return <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Invoice</Badge>;
    if (lower.includes("report") || lower.includes("p&l") || lower.includes("balance"))
      return <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">Report</Badge>;
    if (lower.includes("contract") || lower.includes("agreement"))
      return <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Contract</Badge>;
    return <Badge variant="secondary" className="text-xs">Document</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      inactive: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
      paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
    };
    return variants[status] || variants.active;
  };

  const handleExportAllInvoices = () => {
    if (invoices.length === 0) {
      toast({
        title: "No Invoices",
        description: "There are no invoices to export for this client.",
        variant: "destructive",
      });
      return;
    }

    exportInvoicesToExcel(invoices, client?.client_name);
    toast({
      title: "Invoices Exported",
      description: `${invoices.length} invoice(s) exported to Excel successfully.`,
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading client details…</p>
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Client not found</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{client.client_name}</h1>
              <p className="text-muted-foreground">Client Details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setEditClientOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
            <Button variant="outline" onClick={() => navigate(`/payroll/${client.id}`)}>
              <DollarSign className="h-4 w-4 mr-2" />
              Payroll
            </Button>
            <Badge className={getStatusBadge(client.status)}>
              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Primary contact details for this client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.contact_name && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Contact Name</p>
                    <p className="text-sm text-muted-foreground">{client.contact_name}</p>
                  </div>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline">
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-sm text-primary hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              {client.business_name && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Business Name</p>
                    <p className="text-sm text-muted-foreground">{client.business_name}</p>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{client.address}</p>
                  </div>
                </div>
              )}
              {!client.contact_name && !client.email && !client.phone && !client.business_name && !client.address && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm mb-3">No contact details added yet</p>
                  <Button variant="outline" size="sm" onClick={() => setEditClientOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Add Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Additional details and management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.lead_accountant && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Lead Accountant</p>
                    <p className="text-sm text-muted-foreground">{client.lead_accountant}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Client Since</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(client.created_at), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(client.updated_at), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        {client.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Invoices Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Associated Invoices
                </CardTitle>
                <CardDescription>
                  {invoices.length === 0
                    ? "No invoices found for this client"
                    : `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} found`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {invoices.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export All
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportAllInvoices}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export as Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button onClick={() => navigate(`/invoice?clientId=${id}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Button>
                <Button variant="outline" onClick={() => setRecurringInvoiceOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Recurring
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{invoice.invoice_number}</p>
                        <Badge className={getStatusBadge(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Issued: {format(new Date(invoice.issue_date), "MMM d, yyyy")}</span>
                        <span>Due: {format(new Date(invoice.due_date), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold">${invoice.amount.toFixed(2)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/invoice/${invoice.id}?clientId=${id}`)}
                      >
                        View/Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No invoices created for this client yet</p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Documents Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Client Documents
                </CardTitle>
                <CardDescription>
                  {documents.length === 0
                    ? "No documents uploaded yet"
                    : (() => {
                        const folderCount = documents.filter(isFolder).length;
                        const fileCount = documents.length - folderCount;
                        const parts = [];
                        if (fileCount > 0) parts.push(`${fileCount} document${fileCount !== 1 ? "s" : ""}`);
                        if (folderCount > 0) parts.push(`${folderCount} folder${folderCount !== 1 ? "s" : ""}`);
                        return parts.join(", ");
                      })()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <input
                  ref={docInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.txt,.zip"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleDocUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  onClick={() => docInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" />Upload Document</>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 text-sm mb-3 flex-wrap">
              <button
                className={`hover:underline ${currentPath.length === 0 ? "text-foreground font-medium pointer-events-none" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setCurrentPath([])}
              >
                All Documents
              </button>
              {currentPath.map((seg, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <button
                    className={`hover:underline ${idx === currentPath.length - 1 ? "text-foreground font-medium pointer-events-none" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => goToBreadcrumb(idx + 1)}
                  >
                    {seg}
                  </button>
                </span>
              ))}
            </div>

            {docsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div
                className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => docInputRef.current?.click()}
              >
                <FolderOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-medium text-sm mb-1">
                  {currentPath.length === 0 ? "No documents yet" : "This folder is empty"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">Upload tax returns, bank statements, contracts, reports and more</p>
                <Button variant="outline" size="sm" disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />Browse files
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  isFolder(doc) ? (
                    <div
                      key={doc.name}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer"
                      onClick={() => openFolder(doc.name)}
                    >
                      <Folder className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <span className="text-xs text-muted-foreground">Folder</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleDocDelete(doc); }}
                        disabled={deletingDoc === doc.name}
                        title="Delete folder"
                      >
                        {deletingDoc === doc.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                  <div
                    key={doc.name}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer"
                    onClick={() => handleDocView(doc)}
                  >
                    {getDocIcon(doc.name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getDocLabel(doc.name)}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {getDocTypeBadge(doc.name)}
                        {doc.metadata?.size ? (
                          <span className="text-xs text-muted-foreground">{formatFileSize(doc.metadata.size)}</span>
                        ) : null}
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
                        onClick={(e) => { e.stopPropagation(); handleDocView(doc); }}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDocDownload(doc); }}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            title="Move to folder"
                          >
                            <FolderInput className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          {currentPath.length > 0 && (
                            <DropdownMenuItem onClick={() => handleMoveDoc(doc, "..")}>
                              <ArrowUp className="h-4 w-4 mr-2" />
                              Move to parent folder
                            </DropdownMenuItem>
                          )}
                          {documents.filter(isFolder).length === 0 ? (
                            <DropdownMenuItem disabled>No folders here yet</DropdownMenuItem>
                          ) : (
                            documents.filter(isFolder).map((folder) => (
                              <DropdownMenuItem key={folder.name} onClick={() => handleMoveDoc(doc, folder.name)}>
                                <Folder className="h-4 w-4 mr-2 text-amber-500" />
                                {folder.name}
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDocDelete(doc); }}
                        disabled={deletingDoc === doc.name}
                        title="Delete"
                      >
                        {deletingDoc === doc.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  )
                ))}

                {/* Upload another */}
                <button
                  onClick={() => docInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors mt-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload another document
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RecurringInvoiceDialog
        open={recurringInvoiceOpen}
        onOpenChange={setRecurringInvoiceOpen}
        clientName={client?.client_name || ""}
        clientEmail={client?.email || ""}
      />

      <EditClientDialog
        open={editClientOpen}
        onOpenChange={setEditClientOpen}
        client={client}
        onClientUpdated={loadClientData}
      />

      <Dialog open={newFolderOpen} onOpenChange={(open) => { setNewFolderOpen(open); if (!open) setNewFolderName(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>
              Create a folder to organize documents, e.g. by year.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g. 2026"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()}>
              {creatingFolder ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) { setPreviewDoc(null); setPreviewUrl(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4 pr-6">
              <DialogTitle className="truncate">{previewDoc ? getDocLabel(previewDoc.name) : ""}</DialogTitle>
              {previewUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in new tab
                  </a>
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-[60vh] overflow-auto flex items-center justify-center bg-muted/30 rounded-md">
            {previewLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : previewUrl && previewDoc && getPreviewKind(previewDoc.name) === "image" ? (
              <img src={previewUrl} alt={getDocLabel(previewDoc.name)} className="max-w-full max-h-[75vh] object-contain" />
            ) : previewUrl && previewDoc && getPreviewKind(previewDoc.name) === "pdf" ? (
              <iframe src={previewUrl} title={getDocLabel(previewDoc.name)} className="w-full h-[75vh] rounded-md border-0" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ClientDetails;
