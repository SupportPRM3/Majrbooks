import { useState, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { format, parse, isValid } from "date-fns";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  X,
  ArrowLeft,
  File,
} from "lucide-react";

// ─── PDF.js worker ─────────────────────────────────────────────────────────────
// Use the bundled worker via CDN to avoid Vite complexity
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  raw?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
  onSuccess?: (count: number) => void;
}

type Step = "upload" | "preview" | "done";

// ─── Date parsers ─────────────────────────────────────────────────────────────

function parseDate(raw: string): string | null {
  const formats = [
    "MM/dd/yyyy", "M/d/yyyy", "MM/dd/yy", "M/d/yy",
    "yyyy-MM-dd", "dd-MM-yyyy", "MM-dd-yyyy",
    "MMM dd, yyyy", "MMM d, yyyy", "MMMM dd, yyyy",
    "dd MMM yyyy", "d MMM yyyy",
  ];
  const cleaned = raw.trim().replace(/\./g, "/");
  for (const fmt of formats) {
    try {
      const d = parse(cleaned, fmt, new Date());
      if (isValid(d) && d.getFullYear() >= 2000 && d.getFullYear() <= 2030) {
        return format(d, "yyyy-MM-dd");
      }
    } catch {}
  }
  const fallback = new Date(raw);
  if (isValid(fallback) && fallback.getFullYear() >= 2000) {
    return format(fallback, "yyyy-MM-dd");
  }
  return null;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  return Math.abs(parseFloat(raw.replace(/[$,\s]/g, "")) || 0);
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): ParsedTransaction[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  // Split respecting quoted commas
  const splitLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
      else current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const col = (keys: string[]) => {
    for (const k of keys) {
      const i = headers.findIndex(h => h.includes(k));
      if (i !== -1) return i;
    }
    return -1;
  };

  const dateIdx = col(["date", "transactiondate", "postdate"]);
  const descIdx = col(["description", "memo", "detail", "narration", "payee", "merchant", "name", "transaction"]);
  const amtIdx = col(["amount", "transactionamount"]);
  const debitIdx = col(["debit", "withdrawal", "spent", "charge"]);
  const creditIdx = col(["credit", "deposit", "received", "payment"]);
  const typeIdx = col(["type", "transactiontype", "creditdebit"]);

  if (dateIdx === -1 || descIdx === -1) return [];

  const results: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (values.length < 2) continue;

    const dateStr = values[dateIdx] || "";
    const desc = values[descIdx] || "";
    const date = parseDate(dateStr);
    if (!date || !desc) continue;

    let amount = 0;
    let type: "debit" | "credit" = "debit";

    if (amtIdx !== -1 && values[amtIdx]) {
      const raw = values[amtIdx].replace(/[$,\s]/g, "");
      const num = parseFloat(raw);
      if (!isNaN(num) && num !== 0) {
        amount = Math.abs(num);
        // Negative = debit (money out), positive = credit (money in)
        type = num < 0 ? "debit" : "credit";
      }
    } else if (debitIdx !== -1 || creditIdx !== -1) {
      const debit = debitIdx !== -1 ? parseAmount(values[debitIdx] || "") : 0;
      const credit = creditIdx !== -1 ? parseAmount(values[creditIdx] || "") : 0;
      if (debit > 0) { amount = debit; type = "debit"; }
      else if (credit > 0) { amount = credit; type = "credit"; }
    }

    // Fallback: check type column
    if (typeIdx !== -1 && amount > 0) {
      const t = (values[typeIdx] || "").toLowerCase();
      if (t.includes("credit") || t.includes("deposit") || t.includes("in")) type = "credit";
      else if (t.includes("debit") || t.includes("withdrawal") || t.includes("out")) type = "debit";
    }

    if (amount > 0) {
      results.push({ date, description: desc, amount, type });
    }
  }

  return results;
}

// ─── PDF Parser ───────────────────────────────────────────────────────────────

// Regex to detect a date at the start of a line
const DATE_RE = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w{3,9}\s+\d{1,2},?\s+\d{2,4}|\d{4}-\d{2}-\d{2})/;
// Regex to detect a dollar amount (possibly with debit/credit suffix)
const AMT_RE = /\$?([\d,]+\.\d{2})\s*(-)?/g;

async function parsePDF(file: File, onProgress: (p: number) => void): Promise<ParsedTransaction[]> {
  const buffer = await file.arrayBuffer();
  onProgress(20);

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  onProgress(40);

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    // Reconstruct lines: group items by Y position
    const items: { x: number; y: number; str: string }[] = content.items
      .filter((item: any) => item.str?.trim())
      .map((item: any) => ({
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        str: item.str,
      }));

    // Sort by Y descending (top of page first), then X
    items.sort((a, b) => b.y - a.y || a.x - b.x);

    // Group by Y row
    const rows: Map<number, string[]> = new Map();
    for (const item of items) {
      // Bucket Y into rows ±3px
      const bucket = Math.round(item.y / 4) * 4;
      if (!rows.has(bucket)) rows.set(bucket, []);
      rows.get(bucket)!.push(item.str);
    }

    const sortedBuckets = Array.from(rows.keys()).sort((a, b) => b - a);
    for (const bucket of sortedBuckets) {
      fullText += rows.get(bucket)!.join(" ") + "\n";
    }

    onProgress(40 + Math.round((pageNum / pdf.numPages) * 40));
  }

  onProgress(80);

  // Now parse the full text line by line
  const lines = fullText.split("\n").map(l => l.trim()).filter(Boolean);
  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try to find a date at the beginning
    const dateMatch = line.match(DATE_RE);
    if (!dateMatch) continue;

    const dateStr = dateMatch[0];
    const date = parseDate(dateStr);
    if (!date) continue;

    // Rest of line after date
    const rest = line.slice(dateStr.length).trim();

    // Find amounts in this line (and maybe next line if split)
    const amounts: { value: number; negative: boolean }[] = [];
    let m: RegExpExecArray | null;
    AMT_RE.lastIndex = 0;
    const searchIn = rest + (lines[i + 1] ? " " + lines[i + 1] : "");
    while ((m = AMT_RE.exec(searchIn)) !== null) {
      const val = parseFloat(m[1].replace(/,/g, ""));
      if (val > 0) amounts.push({ value: val, negative: !!m[2] });
    }

    if (amounts.length === 0) continue;

    // Description: everything between date and first amount
    const firstAmtPos = searchIn.search(AMT_RE);
    const desc = (firstAmtPos > 0 ? searchIn.slice(0, firstAmtPos) : rest)
      .replace(/\s+/g, " ")
      .trim();
    if (!desc || desc.length < 2) continue;

    // Use last amount on line (usually the transaction amount, not running balance)
    // Unless there are exactly 2 (debit + credit columns), pick the non-zero one
    let amount = amounts[amounts.length - 1].value;
    let type: "debit" | "credit" = amounts[amounts.length - 1].negative ? "debit" : "credit";

    // Common bank pattern: two amounts = debit column and credit column
    if (amounts.length === 2) {
      const [a, b] = amounts;
      if (a.value > 0 && b.value === 0) { amount = a.value; type = a.negative ? "debit" : "credit"; }
      else if (b.value > 0 && a.value === 0) { amount = b.value; type = b.negative ? "debit" : "credit"; }
      else { amount = a.value; type = "debit"; } // Assume first is debit
    }

    // Heuristic: keywords in description suggest type
    const lDesc = desc.toLowerCase();
    if (/deposit|payroll|direct dep|refund|credit|payment received|zelle in/i.test(lDesc)) {
      type = "credit";
    } else if (/purchase|pos |withdrawal|payment|fee|charge|debit|atm|amazon|walmart/i.test(lDesc)) {
      type = "debit";
    }

    if (amount > 0 && amount < 10_000_000) {
      transactions.push({ date, description: desc, amount, type, raw: line });
    }
  }

  onProgress(100);
  return transactions;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ImportTransactionsDialog = ({ open, onOpenChange, accountId, onSuccess }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [typeOverride, setTypeOverride] = useState<Record<number, "debit" | "credit">>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setParsing(false);
    setParseProgress(0);
    setParsed([]);
    setParseError(null);
    setImporting(false);
    setImportedCount(0);
    setTypeOverride({});
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const processFile = async (f: File) => {
    setFile(f);
    setParsing(true);
    setParseError(null);
    setParseProgress(5);

    try {
      let results: ParsedTransaction[] = [];

      if (f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf") {
        results = await parsePDF(f, setParseProgress);
      } else {
        const text = await f.text();
        setParseProgress(50);
        results = parseCSV(text);
        setParseProgress(100);
      }

      if (results.length === 0) {
        setParseError(
          "No transactions could be extracted from this file. Make sure it's a standard bank statement or CSV export."
        );
      } else {
        setParsed(results);
        setStep("preview");
      }
    } catch (err: any) {
      setParseError(err?.message || "Failed to parse file. Please try a CSV export instead.");
    } finally {
      setParsing(false);
    }
  };

  const handleFileSelect = (f: File) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".pdf") && !name.endsWith(".xls") && !name.endsWith(".xlsx")) {
      toast.error("Please upload a CSV or PDF file");
      return;
    }
    processFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, []);

  const handleImport = async () => {
    if (!user || parsed.length === 0) return;
    setImporting(true);

    try {
      const records = parsed.map((t, i) => ({
        user_id: user.id,
        type: typeOverride[i] ?? t.type === "credit" ? "income" : "expense",
        amount: t.amount,
        description: t.description,
        date: t.date,
        ...(accountId ? { account_id: accountId } : {}),
      }));

      // Batch insert 100 at a time
      const batchSize = 100;
      let totalImported = 0;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from("transactions").insert(batch);
        if (error) throw error;
        totalImported += batch.length;
      }

      setImportedCount(totalImported);
      setStep("done");
      onSuccess?.(totalImported);
      toast.success(`Imported ${totalImported} transactions successfully`);
    } catch (err: any) {
      toast.error("Import failed: " + (err?.message || "Unknown error"));
    } finally {
      setImporting(false);
    }
  };

  const STEPS = ["upload", "preview", "done"] as Step[];
  const stepIdx = STEPS.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm mb-2">
          {[
            { label: "Upload", idx: 0 },
            { label: "Preview", idx: 1 },
            { label: "Done", idx: 2 },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                stepIdx >= s.idx
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {stepIdx > s.idx ? <CheckCircle2 className="h-4 w-4" /> : s.idx + 1}
              </div>
              <span className={cn(stepIdx >= s.idx ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s.label}
              </span>
              {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="flex-1 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !parsing && fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30",
                parsing && "pointer-events-none opacity-70"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.pdf,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                  e.target.value = "";
                }}
              />

              {parsing ? (
                <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="font-medium">Parsing {file?.name?.endsWith(".pdf") ? "PDF" : "file"}…</p>
                  <Progress value={parseProgress} className="h-2 w-full" />
                  <p className="text-xs text-muted-foreground">{parseProgress}% complete</p>
                </div>
              ) : (
                <>
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">Drag & drop a CSV or PDF file</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Supported: Chase, Bank of America, Wells Fargo, or standard CSV format
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">File size limit: 10MB</p>
                  </div>
                  <Button variant="outline">Browse files</Button>
                </>
              )}
            </div>

            {parseError && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Could not parse file</p>
                  <p>{parseError}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg p-3 bg-muted/30">
              <File className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>PDF tip:</strong> For best results, download your official bank statement PDF directly from
                your bank's website. Scanned or image-based PDFs may not extract correctly.
              </span>
            </div>

            <div className="text-center">
              <button
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                onClick={() => toast.info("Manual entry: Use 'Add Transaction' button on the main page")}
              >
                Prefer to type each transaction yourself? Enter transactions manually
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === "preview" && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{file?.name}</span>
                <Badge variant="secondary">{parsed.length} transactions found</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setParsed([]); setStep("upload"); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Change file
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-lg" style={{ maxHeight: "380px" }}>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 sticky top-0">
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-28 text-right">Amount</TableHead>
                    <TableHead className="w-28">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((t, i) => {
                    const effectiveType = typeOverride[i] ?? t.type;
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{t.date}</TableCell>
                        <TableCell className="text-xs max-w-[260px] truncate" title={t.description}>
                          {t.description}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right text-xs font-medium",
                          effectiveType === "credit" ? "text-green-600" : "text-red-600"
                        )}>
                          ${t.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={effectiveType}
                            onValueChange={(v) => setTypeOverride(prev => ({ ...prev, [i]: v as "debit" | "credit" }))}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border z-50">
                              <SelectItem value="credit">Credit (Income)</SelectItem>
                              <SelectItem value="debit">Debit (Expense)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex items-center justify-between flex-shrink-0 pt-2">
              <p className="text-xs text-muted-foreground">
                Review and adjust transaction types if needed, then click Import.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || parsed.length === 0}
                  className="min-w-[120px]"
                >
                  {importing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing…</>
                  ) : (
                    <>Import {parsed.length} Transactions</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
            <div className="bg-green-100 rounded-full p-5">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Import Complete!</h3>
              <p className="text-muted-foreground mt-1">
                Successfully imported <strong>{importedCount}</strong> transactions from{" "}
                <strong>{file?.name}</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { reset(); }}>
                Import Another File
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportTransactionsDialog;
