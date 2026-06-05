import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import * as XLSX from "xlsx";

interface ClientRow {
  client_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  business_name?: string;
  address?: string;
  lead_accountant?: string;
  notes?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function BulkClientUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    created: number;
    updated: number;
    failed: number;
    errors: ValidationError[];
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const downloadTemplate = () => {
    const template = [
      {
        client_name: "Example Client Inc",
        contact_name: "John Doe",
        email: "john@example.com",
        phone: "(555) 123-4567",
        business_name: "Example Business LLC",
        address: "123 Main St, City, ST 12345",
        lead_accountant: "Jane Smith",
        notes: "Important client notes here"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Client Template");
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // client_name
      { wch: 20 }, // contact_name
      { wch: 25 }, // email
      { wch: 15 }, // phone
      { wch: 25 }, // business_name
      { wch: 30 }, // address
      { wch: 20 }, // lead_accountant
      { wch: 30 }  // notes
    ];

    XLSX.writeFile(wb, "client_import_template.xlsx");
    
    toast({
      title: "Template downloaded",
      description: "Fill in the template with your client data",
    });
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateRow = (row: any, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required field: client_name
    if (!row.client_name || typeof row.client_name !== 'string' || row.client_name.trim().length === 0) {
      errors.push({
        row: rowIndex,
        field: 'client_name',
        message: 'Client name is required'
      });
    } else if (row.client_name.length > 100) {
      errors.push({
        row: rowIndex,
        field: 'client_name',
        message: 'Client name must be less than 100 characters'
      });
    }

    // Validate email if provided
    if (row.email && !validateEmail(row.email)) {
      errors.push({
        row: rowIndex,
        field: 'email',
        message: 'Invalid email address'
      });
    }

    // Validate field lengths
    const fieldLengths: { [key: string]: number } = {
      contact_name: 100,
      email: 255,
      phone: 20,
      business_name: 100,
      address: 500,
      lead_accountant: 100,
      notes: 1000
    };

    Object.entries(fieldLengths).forEach(([field, maxLength]) => {
      if (row[field] && row[field].length > maxLength) {
        errors.push({
          row: rowIndex,
          field,
          message: `${field.replace('_', ' ')} must be less than ${maxLength} characters`
        });
      }
    });

    return errors;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadResults(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            toast({
              title: "Error",
              description: "The CSV file is empty",
              variant: "destructive",
            });
            setIsUploading(false);
            return;
          }

          // Validate all rows first
          const allErrors: ValidationError[] = [];
          jsonData.forEach((row, index) => {
            const errors = validateRow(row, index + 2); // +2 because Excel rows start at 1 and header is row 1
            allErrors.push(...errors);
          });

          if (allErrors.length > 0) {
            setUploadResults({
              created: 0,
              updated: 0,
              failed: jsonData.length,
              errors: allErrors
            });
            setIsUploading(false);
            return;
          }

          // Process valid rows
          const clientsToProcess: ClientRow[] = jsonData.map(row => ({
            client_name: row.client_name.trim(),
            contact_name: row.contact_name?.trim() || null,
            email: row.email?.trim() || null,
            phone: row.phone?.trim() || null,
            business_name: row.business_name?.trim() || null,
            address: row.address?.trim() || null,
            lead_accountant: row.lead_accountant?.trim() || null,
            notes: row.notes?.trim() || null,
          }));

          // Fetch existing clients to check for matches
          const { data: existingClients, error: fetchError } = await supabase
            .from("clients")
            .select("id, email, client_name")
            .eq("user_id", user.id);

          if (fetchError) throw fetchError;

          let createdCount = 0;
          let updatedCount = 0;

          // Process each client
          for (const client of clientsToProcess) {
            // Check if client exists by email or client_name
            const existingClient = existingClients?.find(
              ec => 
                (client.email && ec.email && ec.email.toLowerCase() === client.email.toLowerCase()) ||
                (ec.client_name.toLowerCase() === client.client_name.toLowerCase())
            );

            if (existingClient) {
              // Update existing client
              const { error: updateError } = await supabase
                .from("clients")
                .update({
                  ...client,
                  user_id: user.id,
                  status: 'active'
                })
                .eq("id", existingClient.id);

              if (updateError) throw updateError;
              updatedCount++;
            } else {
              // Insert new client
              const { error: insertError } = await supabase
                .from("clients")
                .insert({
                  ...client,
                  user_id: user.id,
                  status: 'active'
                });

              if (insertError) throw insertError;
              createdCount++;
            }
          }

          setUploadResults({
            created: createdCount,
            updated: updatedCount,
            failed: 0,
            errors: []
          });

          toast({
            title: "Success",
            description: `${createdCount} clients created, ${updatedCount} clients updated`,
          });

          // Reset file input
          event.target.value = '';

        } catch (error) {
          console.error("Error processing file:", error);
          toast({
            title: "Error",
            description: "Failed to process the file. Please check the format.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        title: "Error",
        description: "Failed to read the file",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-2">First things first</h1>
            <p className="text-muted-foreground mb-6">
              To ensure your data imports smoothly, please follow these four steps.{" "}
              <a href="#" className="text-primary hover:underline">
                Read the import guide ▶
              </a>
            </p>

            {/* Download Template */}
            <div className="mb-8">
              <Button
                variant="link"
                onClick={downloadTemplate}
                className="text-primary p-0 h-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Download client list
              </Button>
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upload your CSV file</h2>
              
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    disabled={isUploading}
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => document.getElementById('csv-upload')?.click()}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </label>
              </div>

              <p className="text-sm text-muted-foreground">
                Supported formats: CSV, XLSX, XLS (Max 20MB)
              </p>
            </div>

            {/* Results */}
            {uploadResults && (
              <div className="mt-8 space-y-4">
                {(uploadResults.created > 0 || uploadResults.updated > 0) && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                          Import Successful
                        </h3>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {uploadResults.created} client(s) created, {uploadResults.updated} client(s) updated
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {uploadResults.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                          Validation Errors
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {uploadResults.errors.map((error, index) => (
                            <p key={index} className="text-sm text-red-800 dark:text-red-200">
                              Row {error.row}: {error.field} - {error.message}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(uploadResults.created > 0 || uploadResults.updated > 0) && (
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Import Guidelines:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Client Name is required for all entries</li>
                <li>• Email addresses must be valid format</li>
                <li>• Existing clients will be updated by matching email or client name</li>
                <li>• All other fields are optional</li>
                <li>• Download the template for proper formatting</li>
                <li>• Maximum 1000 clients per import</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
