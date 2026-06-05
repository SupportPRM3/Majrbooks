import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export interface ExcelRow {
  [key: string]: string | number | boolean | null;
}

interface ExcelImportDialogProps {
  /** Label shown on the trigger button */
  triggerLabel?: string;
  /** Title shown inside the dialog */
  title?: string;
  /** Short description under the title */
  description?: string;
  /** Called when the user confirms the import. Receives the parsed rows. */
  onImport: (rows: ExcelRow[], sheetName: string) => Promise<void> | void;
  /** Optional children to use as a custom trigger */
  children?: React.ReactNode;
}

export function ExcelImportDialog({
  triggerLabel = "Import from Excel",
  title = "Import Excel File",
  description = "Upload an .xlsx or .xls file to import data into the app.",
  onImport,
  children,
}: ExcelImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<ExcelRow[]>([]);
  const [allRows, setAllRows] = useState<ExcelRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workbookRef = useRef<XLSX.WorkBook | null>(null);

  const reset = () => {
    setFileName(null);
    setSheetNames([]);
    setSelectedSheet("");
    setPreviewRows([]);
    setAllRows([]);
    setColumns([]);
    setStep("upload");
    workbookRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseSheet = useCallback((wb: XLSX.WorkBook, sheet: string) => {
    const ws = wb.Sheets[sheet];
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(ws, { defval: null });
    if (rows.length === 0) {
      toast.error("This sheet has no data.");
      return;
    }
    const cols = Object.keys(rows[0]);
    setColumns(cols);
    setAllRows(rows);
    setPreviewRows(rows.slice(0, 10));
    setStep("preview");
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        toast.error("Please upload an .xlsx, .xls, or .csv file.");
        return;
      }
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const wb = XLSX.read(data, { type: "binary", cellDates: true });
          workbookRef.current = wb;
          setSheetNames(wb.SheetNames);
          const firstSheet = wb.SheetNames[0];
          setSelectedSheet(firstSheet);
          parseSheet(wb, firstSheet);
        } catch {
          toast.error("Failed to read the file. Please check it is a valid Excel file.");
          reset();
        }
      };
      reader.readAsBinaryString(file);
    },
    [parseSheet]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (workbookRef.current) parseSheet(workbookRef.current, sheet);
  };

  const handleConfirm = async () => {
    setIsImporting(true);
    try {
      await onImport(allRows, selectedSheet);
      toast.success(`Imported ${allRows.length} row(s) successfully.`);
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={step === "upload" ? "text-primary font-medium" : ""}>
            1. Upload file
          </span>
          <ChevronRight className="h-3 w-3" />
          <span className={step === "preview" ? "text-primary font-medium" : ""}>
            2. Preview & confirm
          </span>
        </div>

        {/* ── STEP 1: Upload ── */}
        {step === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4
              cursor-pointer transition-colors select-none
              ${isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/40"}
            `}
          >
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">Drag & drop your file here</p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse — supports .xlsx, .xls, .csv
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        )}

        {/* ── STEP 2: Preview ── */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* File info bar */}
            <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="font-medium">{fileName}</span>
                <Badge variant="secondary">{allRows.length} rows</Badge>
                <Badge variant="secondary">{columns.length} columns</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Change file
              </Button>
            </div>

            {/* Sheet selector (only if multiple sheets) */}
            {sheetNames.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Sheet:</span>
                <Select value={selectedSheet} onValueChange={handleSheetChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetNames.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Columns detected */}
            <div className="flex flex-wrap gap-1.5">
              {columns.map((col) => (
                <Badge key={col} variant="outline" className="text-xs">
                  {col}
                </Badge>
              ))}
            </div>

            {/* Preview table */}
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted px-4 py-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Showing first {Math.min(previewRows.length, 10)} of {allRows.length} rows
              </div>
              <ScrollArea className="h-64">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr>
                        {columns.map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                          {columns.map((col) => (
                            <td
                              key={col}
                              className="px-3 py-2 whitespace-nowrap text-xs max-w-[200px] truncate"
                            >
                              {row[col] == null ? (
                                <span className="text-muted-foreground italic">—</span>
                              ) : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Import {allRows.length} rows
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
