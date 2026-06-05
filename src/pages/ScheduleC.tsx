import { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, AlertTriangle, DollarSign, TrendingUp, TrendingDown, RefreshCw, ClipboardList, X, File, Printer, CheckCircle2, Save, Loader2, FolderOpen, Calendar, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense" | "personal" | "needs_review";
  notes: string;
}

interface FlaggedItem {
  date: string;
  description: string;
  amount: number;
  reason: string;
}

interface RecurringSub {
  description: string;
  amount: number;
  frequency: string;
  category: string;
}

interface ScheduleCResult {
  summary: {
    total_income: number;
    expense_totals: Record<string, number>;
    total_expenses: number;
    net_profit: number;
  };
  transactions: Transaction[];
  flagged_items: FlaggedItem[];
  recurring_subscriptions: RecurringSub[];
}

interface UploadedFile {
  name: string;
  size: number;
  content: string;
  isPdf?: boolean;
  pdfBase64?: string;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const typeBadgeVariant = (type: string) => {
  switch (type) {
    case "income": return "default";
    case "expense": return "secondary";
    case "personal": return "outline";
    case "needs_review": return "destructive";
    default: return "outline";
  }
};

export default function ScheduleC() {
  const { user } = useAuth();
  const [clientName, setClientName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clients, setClients] = useState<{ id: string; client_name: string }[]>([]);
  const [rawText, setRawText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScheduleCResult | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [showSavedReports, setShowSavedReports] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch clients
  useEffect(() => {
    if (!user) return;
    const fetchClients = async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, client_name")
        .order("client_name");
      if (data) setClients(data);
    };
    fetchClients();
  }, [user]);

  // Fetch saved reports
  const fetchSavedReports = useCallback(async () => {
    if (!user) return;
    setIsLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from("schedule_c_reports")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setSavedReports(data || []);
    } catch (err: any) {
      toast({ title: "Error loading reports", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingReports(false);
    }
  }, [user]);

  const handleLoadReport = useCallback((report: any) => {
    setClientName(report.client_name || "");
    setSelectedClientId(report.client_id || "");
    setSavedReportId(report.id);
    setIsConfirmed(report.is_confirmed || false);
    setResult({
      summary: report.summary || { total_income: 0, expense_totals: {}, total_expenses: 0, net_profit: 0 },
      transactions: report.transactions || [],
      flagged_items: report.flagged_items || [],
      recurring_subscriptions: report.recurring_subscriptions || [],
    });
    setShowSavedReports(false);
    toast({ title: "Report loaded", description: `Loaded report for ${report.client_name}.` });
  }, []);

  const handleDeleteReport = useCallback(async (reportId: string) => {
    try {
      const { error } = await supabase.from("schedule_c_reports").delete().eq("id", reportId);
      if (error) throw error;
      setSavedReports(prev => prev.filter(r => r.id !== reportId));
      if (savedReportId === reportId) setSavedReportId(null);
      toast({ title: "Report deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  }, [savedReportId]);

  // Save report to database
  const handleSaveReport = useCallback(async () => {
    if (!result || !user) return;
    if (!clientName.trim() && !selectedClientId) {
      toast({ title: "Client required", description: "Please enter a client name or select a client to save.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const reportData = {
        user_id: user.id,
        client_name: clientName.trim() || clients.find(c => c.id === selectedClientId)?.client_name || "Unknown",
        client_id: selectedClientId || null,
        tax_year: new Date().getFullYear(),
        summary: result.summary as any,
        transactions: result.transactions as any,
        flagged_items: result.flagged_items as any,
        recurring_subscriptions: result.recurring_subscriptions as any,
        is_confirmed: isConfirmed,
        confirmed_at: isConfirmed ? new Date().toISOString() : null,
      };

      if (savedReportId) {
        const { error } = await supabase
          .from("schedule_c_reports")
          .update({ ...reportData, updated_at: new Date().toISOString() })
          .eq("id", savedReportId);
        if (error) throw error;
        toast({ title: "Report updated", description: `Schedule C report saved for ${reportData.client_name}.` });
      } else {
        const { data, error } = await supabase
          .from("schedule_c_reports")
          .insert(reportData)
          .select("id")
          .single();
        if (error) throw error;
        setSavedReportId(data.id);
        toast({ title: "Report saved", description: `Schedule C report saved for ${reportData.client_name}.` });
      }
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [result, user, clientName, selectedClientId, clients, isConfirmed, savedReportId]);
  const handlePrintSummary = useCallback(() => {
    if (!result) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Schedule C Summary - ${clientName || "Client"}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
        .kpi-row { display: flex; gap: 32px; margin-bottom: 16px; }
        .kpi-label { font-size: 12px; color: #666; }
        .kpi-value { font-size: 22px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .text-right { text-align: right; }
        .confirmed-badge { display: inline-block; background: #22c55e; color: white; padding: 2px 10px; border-radius: 4px; font-size: 12px; margin-left: 12px; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>Schedule C Expense Summary ${isConfirmed ? '<span class="confirmed-badge">✓ Client Confirmed</span>' : ''}</h1>
      <p class="subtitle">${clientName ? `Client: ${clientName} • ` : ''}Generated: ${new Date().toLocaleDateString()}</p>
      <div class="kpi-row">
        <div><div class="kpi-label">Gross Income</div><div class="kpi-value">${formatCurrency(result.summary.total_income)}</div></div>
        <div><div class="kpi-label">Total Expenses</div><div class="kpi-value">${formatCurrency(result.summary.total_expenses)}</div></div>
        <div><div class="kpi-label">Net Profit</div><div class="kpi-value">${formatCurrency(result.summary.net_profit)}</div></div>
      </div>
      <h2 style="font-size:16px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:24px;">Expense Breakdown by IRS Category</h2>
      <table><thead><tr><th>Category</th><th class="text-right">Amount</th></tr></thead><tbody>
      ${Object.entries(result.summary.expense_totals).sort(([, a], [, b]) => b - a).map(([cat, amt]) => `<tr><td>${cat}</td><td class="text-right">${formatCurrency(amt)}</td></tr>`).join("")}
      <tr style="font-weight:bold;border-top:2px solid #333"><td>Total Expenses</td><td class="text-right">${formatCurrency(result.summary.total_expenses)}</td></tr>
      </tbody></table>
      ${result.flagged_items.length > 0 ? `
        <h2 style="font-size:16px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:24px;">Flagged Items (${result.flagged_items.length})</h2>
        <table><thead><tr><th>Date</th><th>Description</th><th class="text-right">Amount</th><th>Reason</th></tr></thead><tbody>
        ${result.flagged_items.map(it => `<tr><td>${it.date}</td><td>${it.description}</td><td class="text-right">${formatCurrency(it.amount)}</td><td>${it.reason}</td></tr>`).join("")}
        </tbody></table>
      ` : ''}
      <p class="footer">Generated by MAJR Books Schedule C Preparation tool. Please review all categorizations before filing.</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [result, clientName, isConfirmed]);

  const handlePrintScheduleC = useCallback(() => {
    if (!result) return;
    const s = result.summary;
    const exp = s.expense_totals;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const lineItems = [
      { line: "8", label: "Advertising", keys: ["Advertising"] },
      { line: "9", label: "Car and truck expenses", keys: ["Car & Truck Expenses", "Car and Truck"] },
      { line: "10", label: "Commissions and fees", keys: ["Commissions & Fees", "Commissions"] },
      { line: "11", label: "Contract labor", keys: ["Contract Labor"] },
      { line: "13", label: "Depreciation and section 179", keys: ["Depreciation"] },
      { line: "14", label: "Employee benefit programs", keys: ["Employee Benefits"] },
      { line: "15", label: "Insurance (other than health)", keys: ["Insurance"] },
      { line: "16a", label: "Mortgage interest paid to banks", keys: ["Mortgage Interest"] },
      { line: "17", label: "Legal and professional services", keys: ["Legal & Professional Services", "Legal"] },
      { line: "18", label: "Office expense", keys: ["Office Expenses", "Office Supplies"] },
      { line: "20a", label: "Rent or lease — Vehicles, machinery, equipment", keys: ["Rent - Equipment"] },
      { line: "20b", label: "Rent or lease — Other business property", keys: ["Rent - Business Property", "Rent"] },
      { line: "21", label: "Repairs and maintenance", keys: ["Repairs & Maintenance", "Repairs"] },
      { line: "22", label: "Supplies (not in Part III)", keys: ["Supplies"] },
      { line: "23", label: "Taxes and licenses", keys: ["Taxes & Licenses"] },
      { line: "24a", label: "Travel", keys: ["Travel"] },
      { line: "24b", label: "Deductible meals", keys: ["Meals", "Meals & Entertainment"] },
      { line: "25", label: "Utilities", keys: ["Utilities"] },
      { line: "26", label: "Wages", keys: ["Wages"] },
      { line: "27a", label: "Other expenses (from line 48)", keys: ["Other Expenses", "Software & Subscriptions", "Education & Training", "Bank Fees", "Telephone", "Internet", "Postage & Shipping", "Tools"] },
    ];

    const getAmount = (keys: string[]) => {
      let total = 0;
      for (const k of keys) {
        for (const [cat, amt] of Object.entries(exp)) {
          if (cat.toLowerCase().includes(k.toLowerCase())) total += amt;
        }
      }
      return total;
    };

    const otherKeys = ["Software & Subscriptions", "Education & Training", "Bank Fees", "Telephone", "Internet", "Postage & Shipping", "Tools", "Other Expenses"];
    const otherDetails = Object.entries(exp).filter(([cat]) => otherKeys.some(k => cat.toLowerCase().includes(k.toLowerCase())));

    printWindow.document.write(`
      <html><head><title>Schedule C (Form 1040) - ${clientName || "Taxpayer"}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 30px; color: #000; font-size: 12px; }
        h1 { font-size: 16px; text-align: center; margin-bottom: 2px; font-family: Arial, sans-serif; }
        h2 { font-size: 13px; text-align: center; margin-bottom: 2px; font-family: Arial, sans-serif; font-weight: normal; }
        .form-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .dept { font-size: 10px; color: #666; }
        .section-title { font-weight: bold; font-size: 13px; background: #eee; padding: 4px 8px; margin: 16px 0 8px; font-family: Arial, sans-serif; }
        .line-row { display: flex; align-items: baseline; padding: 3px 0; border-bottom: 1px dotted #ccc; }
        .line-num { width: 40px; font-weight: bold; flex-shrink: 0; }
        .line-label { flex: 1; }
        .line-amount { width: 120px; text-align: right; font-weight: bold; border-bottom: 1px solid #000; padding: 0 4px; }
        .line-amount.total { border-bottom: 3px double #000; }
        .info-row { display: flex; gap: 20px; margin-bottom: 6px; }
        .info-label { font-size: 10px; color: #666; }
        .info-field { border-bottom: 1px solid #000; padding: 2px 4px; min-width: 180px; display: inline-block; }
        .other-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        .other-table td { border: 1px solid #ccc; padding: 3px 6px; }
        .confirmed-stamp { position: fixed; top: 40%; right: 10%; transform: rotate(-15deg); font-size: 48px; color: rgba(34,197,94,0.2); font-weight: bold; font-family: Arial; border: 4px solid rgba(34,197,94,0.2); padding: 10px 20px; border-radius: 12px; pointer-events: none; }
        .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; }
        @media print { body { padding: 15px; } }
      </style></head><body>
      ${isConfirmed ? '<div class="confirmed-stamp">CLIENT CONFIRMED</div>' : ''}
      <div class="form-header">
        <h1>SCHEDULE C (Form 1040)</h1>
        <h2>Profit or Loss From Business (Sole Proprietorship)</h2>
        <p class="dept">Department of the Treasury — Internal Revenue Service</p>
      </div>
      <div class="info-row"><span class="info-label">Name of proprietor:</span> <span class="info-field">${clientName || ''}</span> <span class="info-label" style="margin-left:20px">Tax Year:</span> <span class="info-field">${new Date().getFullYear()}</span></div>
      <div class="info-row"><span class="info-label">SSN:</span> <span class="info-field">___-__-____</span> <span class="info-label" style="margin-left:20px">EIN:</span> <span class="info-field">__-_______</span></div>
      <div class="info-row"><span class="info-label">Principal business:</span> <span class="info-field"></span> <span class="info-label" style="margin-left:20px">Business code:</span> <span class="info-field"></span></div>
      <div class="info-row"><span class="info-label">Business name:</span> <span class="info-field"></span> <span class="info-label" style="margin-left:20px">Accounting method: ☐ Cash ☐ Accrual ☐ Other</span></div>

      <div class="section-title">Part I — Income</div>
      <div class="line-row"><span class="line-num">1</span><span class="line-label">Gross receipts or sales</span><span class="line-amount">${formatCurrency(s.total_income)}</span></div>
      <div class="line-row"><span class="line-num">2</span><span class="line-label">Returns and allowances</span><span class="line-amount"></span></div>
      <div class="line-row"><span class="line-num">3</span><span class="line-label">Subtract line 2 from line 1</span><span class="line-amount">${formatCurrency(s.total_income)}</span></div>
      <div class="line-row"><span class="line-num">4</span><span class="line-label">Cost of goods sold (from line 42)</span><span class="line-amount"></span></div>
      <div class="line-row"><span class="line-num">5</span><span class="line-label">Gross profit</span><span class="line-amount">${formatCurrency(s.total_income)}</span></div>
      <div class="line-row"><span class="line-num">7</span><span class="line-label">Gross income</span><span class="line-amount total">${formatCurrency(s.total_income)}</span></div>

      <div class="section-title">Part II — Expenses</div>
      ${lineItems.map(item => {
        const amt = getAmount(item.keys);
        return `<div class="line-row"><span class="line-num">${item.line}</span><span class="line-label">${item.label}</span><span class="line-amount">${amt > 0 ? formatCurrency(amt) : ''}</span></div>`;
      }).join("")}
      <div class="line-row"><span class="line-num">28</span><span class="line-label"><strong>Total expenses</strong></span><span class="line-amount total">${formatCurrency(s.total_expenses)}</span></div>
      <div class="line-row"><span class="line-num">29</span><span class="line-label">Tentative profit or (loss)</span><span class="line-amount">${formatCurrency(s.net_profit)}</span></div>
      <div class="line-row"><span class="line-num">30</span><span class="line-label">Expenses for business use of your home</span><span class="line-amount"></span></div>
      <div class="line-row"><span class="line-num">31</span><span class="line-label"><strong>Net profit or (loss)</strong></span><span class="line-amount total">${formatCurrency(s.net_profit)}</span></div>

      ${otherDetails.length > 0 ? `
        <div class="section-title">Part V — Other Expenses (Line 27a detail)</div>
        <table class="other-table">
          ${otherDetails.map(([cat, amt]) => `<tr><td>${cat}</td><td style="text-align:right;width:120px">${formatCurrency(amt)}</td></tr>`).join("")}
        </table>
      ` : ''}
      <p class="footer">Pre-filled by MAJR Books • ${new Date().toLocaleDateString()} • For reference only — verify before filing.</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [result, clientName, isConfirmed]);

  const processFile = useCallback(async (file: globalThis.File): Promise<UploadedFile | null> => {
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: `${file.name} exceeds 20MB limit.`, variant: "destructive" });
      return null;
    }

    let content = "";
    let isPdf = false;
    let pdfBase64 = "";

    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      content = await file.text();
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // Convert PDF to full base64 for AI vision processing
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      pdfBase64 = btoa(binary);
      isPdf = true;
      content = `[PDF file: ${file.name} - will be processed via AI vision]`;
    } else if (
      file.name.endsWith(".xlsx") || file.name.endsWith(".xls") ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      // Parse Excel files using xlsx library
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const allSheets: string[] = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          allSheets.push(`--- Sheet: ${sheetName} ---\n${csv}`);
        }
        content = allSheets.join("\n\n");
      } catch {
        content = await file.text();
        toast({ title: "Note", description: `${file.name}: Could not parse Excel format. For best results, export as CSV.` });
      }
    } else {
      content = await file.text();
    }

    return { name: file.name, size: file.size, content, isPdf, pdfBase64 };
  }, []);

  const addFiles = useCallback(async (files: FileList | globalThis.File[]) => {
    const fileArray = Array.from(files);
    const processed: UploadedFile[] = [];
    for (const f of fileArray) {
      const result = await processFile(f);
      if (result) processed.push(result);
    }
    if (processed.length > 0) {
      setUploadedFiles(prev => [...prev, ...processed]);
      const combined = [...uploadedFiles, ...processed].map(f => f.content).join("\n\n---NEW FILE---\n\n");
      setRawText(combined);
      toast({ title: "Files loaded", description: `${processed.length} file(s) ready for analysis.` });
    }
  }, [uploadedFiles, processFile]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0) {
        setRawText(updated.map(f => f.content).join("\n\n---NEW FILE---\n\n"));
      } else {
        setRawText("");
      }
      return updated;
    });
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await addFiles(files);
    e.target.value = "";
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) await addFiles(files);
  }, [addFiles]);
  const analyze = useCallback(async () => {
    const hasTextContent = rawText.trim() && !rawText.trim().startsWith("[PDF file:");
    const hasPdfFiles = uploadedFiles.some(f => f.isPdf && f.pdfBase64);
    
    if (!hasTextContent && !hasPdfFiles) {
      toast({ title: "No data", description: "Please upload a file or paste transaction data.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setIsConfirmed(false);
    setSavedReportId(null);
    try {
      // Collect text content (non-PDF)
      const textParts = uploadedFiles
        .filter(f => !f.isPdf)
        .map(f => f.content);
      
      // If user typed in the textarea and no files uploaded, use that
      if (uploadedFiles.length === 0 && rawText.trim()) {
        textParts.push(rawText);
      }

      // Collect PDF base64 data
      const pdfFiles = uploadedFiles
        .filter(f => f.isPdf && f.pdfBase64)
        .map(f => ({ name: f.name, base64: f.pdfBase64! }));

      const { data, error } = await supabase.functions.invoke("schedule-c-analyze", {
        body: { 
          transactions_text: textParts.join("\n\n---NEW FILE---\n\n"), 
          client_name: clientName,
          pdf_files: pdfFiles,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as ScheduleCResult);
      toast({ title: "Analysis complete", description: "Schedule C categories have been assigned." });
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [rawText, clientName, uploadedFiles]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schedule C Preparation</h1>
            <p className="text-muted-foreground mt-1">
              Upload bank statements to auto-categorize transactions for IRS Schedule C
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => { setShowSavedReports(true); fetchSavedReports(); }}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Saved Reports
          </Button>
        </div>

        {/* Saved Reports Dialog */}
        <Dialog open={showSavedReports} onOpenChange={setShowSavedReports}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Saved Schedule C Reports
              </DialogTitle>
            </DialogHeader>
            {isLoadingReports ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No saved reports yet</p>
                <p className="text-sm mt-1">Analyze and save a report to see it here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{report.client_name}</span>
                        <Badge variant={report.is_confirmed ? "default" : "secondary"}>
                          {report.is_confirmed ? "Confirmed" : "Draft"}
                        </Badge>
                        <Badge variant="outline">{report.tax_year}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.updated_at).toLocaleDateString()}
                        </span>
                        {report.summary?.net_profit != null && (
                          <span>Net: {formatCurrency(report.summary.net_profit)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadReport(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Transactions
            </CardTitle>
            <CardDescription>
              Upload a CSV/text file or paste bank statement data below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 max-w-md">
                <label className="text-sm font-medium mb-1.5 block">Select Client</label>
                <Select
                  value={selectedClientId}
                  onValueChange={(val) => {
                    setSelectedClientId(val);
                    const client = clients.find(c => c.id === val);
                    if (client) setClientName(client.client_name);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an existing client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.client_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 max-w-md">
                <label className="text-sm font-medium mb-1.5 block">Or enter client name</label>
                <Input
                  placeholder="e.g. John Smith"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (selectedClientId) setSelectedClientId("");
                  }}
                  className="max-w-md"
                />
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.pdf,.xlsx,.xls"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports CSV, TXT, PDF, XLSX • Multiple files allowed • Max 20MB each
              </p>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</label>
                <div className="space-y-1.5">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">({formatFileSize(f.size)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFile(i)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Or paste transaction data directly
              </label>
              <Textarea
                rows={6}
                placeholder={"Date, Description, Amount\n01/15/2025, AMAZON PURCHASE, -49.99\n01/16/2025, CLIENT PAYMENT DEPOSIT, 2500.00\n..."}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (uploadedFiles.length > 0) setUploadedFiles([]);
                }}
              />
            </div>
            <Button onClick={analyze} disabled={isAnalyzing} className="w-full md:w-auto">
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Analyze & Categorize
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Tabs defaultValue="summary" className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="transactions">
                  Transactions ({result.transactions.length})
                </TabsTrigger>
                <TabsTrigger value="flagged">
                  Flagged ({result.flagged_items.length})
                </TabsTrigger>
                <TabsTrigger value="recurring">
                  Recurring ({result.recurring_subscriptions.length})
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                {!isConfirmed ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsConfirmed(true);
                      toast({ title: "Confirmed", description: "Summary has been confirmed by client." });
                    }}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm Summary
                  </Button>
                ) : (
                  <Badge variant="default" className="gap-1 py-1.5 px-3 text-sm bg-green-600 hover:bg-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Client Confirmed
                  </Badge>
                )}
                <Button variant="outline" onClick={handleSaveReport} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savedReportId ? "Update Report" : "Save Report"}
                </Button>
                <Button variant="outline" onClick={handlePrintSummary} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print Summary
                </Button>
                <Button onClick={handlePrintScheduleC} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Print Schedule C
                </Button>
              </div>
            </div>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gross Income</p>
                        <p className="text-2xl font-bold">{formatCurrency(result.summary.total_income)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-destructive/20">
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold">{formatCurrency(result.summary.total_expenses)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p className="text-2xl font-bold">{formatCurrency(result.summary.net_profit)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(result.summary.expense_totals)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cat, amt]) => (
                          <TableRow key={cat}>
                            <TableCell>{cat}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(amt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(result.summary.total_expenses)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.transactions.map((tx, i) => (
                          <TableRow key={i}>
                            <TableCell className="whitespace-nowrap">{tx.date}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{tx.description}</TableCell>
                            <TableCell className="text-right font-mono whitespace-nowrap">
                              {formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell>{tx.category}</TableCell>
                            <TableCell>
                              <Badge variant={typeBadgeVariant(tx.type)}>
                                {tx.type === "needs_review" ? "Needs Review" : tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate text-muted-foreground text-sm">
                              {tx.notes}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Flagged Tab */}
            <TabsContent value="flagged">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Items Requiring Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.flagged_items.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No flagged items.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.flagged_items.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(item.amount)}
                            </TableCell>
                            <TableCell className="text-chart-3">{item.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recurring Tab */}
            <TabsContent value="recurring">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Recurring Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.recurring_subscriptions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No recurring subscriptions detected.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.recurring_subscriptions.map((sub, i) => (
                          <TableRow key={i}>
                            <TableCell>{sub.description}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(sub.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{sub.frequency}</Badge>
                            </TableCell>
                            <TableCell>{sub.category}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
