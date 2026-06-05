import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyzedDocument {
  name: string;
  analysis: string;
}

const TaxDocumentAnalysis = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedDocs, setAnalyzedDocs] = useState<AnalyzedDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const analyzeDocuments = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one document to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    const results: AnalyzedDocument[] = [];

    try {
      for (const file of files) {
        let content = "";
        
        // Handle text-based files
        if (file.type === "text/plain" || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
          content = await readFileContent(file);
        } else {
          // For PDFs and other files, we'll send the file name and type for now
          // In production, you'd want to use a PDF parser or OCR service
          content = `[File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024).toFixed(2)} KB]\n\nNote: This is a ${file.type} file. Please provide the text content for full analysis.`;
        }

        const { data, error } = await supabase.functions.invoke('analyze-tax-document', {
          body: { 
            documentContent: content,
            documentName: file.name,
            analysisType: 'full'
          }
        });

        if (error) throw error;

        results.push({
          name: file.name,
          analysis: data.analysis
        });
      }

      setAnalyzedDocs(results);
      setFiles([]);
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${results.length} document(s).`,
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Tax Document Analysis
          </CardTitle>
          <CardDescription>
            Upload tax documents (W-2, 1099, 1040, etc.) for AI-powered analysis and data extraction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, TXT, CSV files supported
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Files:</p>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={isAnalyzing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={analyzeDocuments}
            disabled={files.length === 0 || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Documents...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Analyze {files.length > 0 ? `${files.length} Document(s)` : 'Documents'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analyzedDocs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Analysis Results
          </h3>
          {analyzedDocs.map((doc, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {doc.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                    {doc.analysis}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaxDocumentAnalysis;
