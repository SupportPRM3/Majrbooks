import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, Building, MapPin, User, FileText, Calendar, Download, FileSpreadsheet, DollarSign, Plus, Upload, Trash2, File, FileImage, Loader2, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { CreateInvoiceDialog } from "@/components/CreateInvoiceDialog";
import { EditInvoiceDialog } from "@/components/EditInvoiceDialog";
import { RecurringInvoiceDialog } from "@/components/RecurringInvoiceDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportInvoicesToExcel } from "@/lib/invoiceExport";
import { useToast } from "@/hooks/use-toast";

interface ClientDocument {
  name: string;
  id: string;
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
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !id) {
      navigate("/dashboard");
      return;
    }
    loadClientData();
    loadDocuments();
  }, [user, id]);

  const loadClientData = async () => {
    if (!user || !id) return;

    setLoading(true);
    try {
      // Load client details
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Load associated invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_name", clientData.client_name)
        .eq("user_id", user.id)
        .order("issue_date", { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error("Error loading client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!user || !id) return;
    setDocsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("client-documents")
        .list(`${user.id}/${id}`, { sortBy: { column: "created_at", order: "desc" } });
      if (!error) setDocuments((data as ClientDocument[]) || []);
    } catch {
      // bucket may not exist yet — silently ignore
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDocUpload = async (file: File) => {
    if (!user || !id) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${id}/${Date.now()}_${safeName}`;
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
    if (!user || !id) return;
    const path = `${user.id}/${id}/${doc.name}`;
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

  const handleDocDelete = async (doc: ClientDocument) => {
    if (!user || !id) return;
    setDeletingDoc(doc.name);
    try {
      const path = `${user.id}/${id}/${doc.name}`;
      const { error } = await supabase.storage.from("client-documents").remove([path]);
      if (error) throw error;
      toast({ title: "Document deleted" });
      setDocuments(prev => prev.filter(d => d.name !== doc.name));
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
                  {documents.length === 0 ? "No documents uploaded yet" : `${documents.length} document${documents.length !== 1 ? "s" : ""}`}
                </CardDescription>
              </div>
              <div>
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
                <p className="font-medium text-sm mb-1">No documents yet</p>
                <p className="text-xs text-muted-foreground mb-3">Upload tax returns, bank statements, contracts, reports and more</p>
                <Button variant="outline" size="sm" disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />Browse files
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors group"
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
                        onClick={() => handleDocDownload(doc)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDocDelete(doc)}
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
    </Layout>
  );
};

export default ClientDetails;
