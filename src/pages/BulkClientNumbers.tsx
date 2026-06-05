import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Upload, AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import Layout from "@/components/Layout";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClientWithNumber {
  id: string;
  client_name: string;
  client_number: string | null;
  email: string | null;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function BulkClientNumbers() {
  const [clients, setClients] = useState<ClientWithNumber[]>([]);
  const [editedNumbers, setEditedNumbers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    updated: number;
    failed: number;
    errors: ValidationError[];
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, client_name, client_number, email")
        .eq("user_id", user.id)
        .order("client_name", { ascending: true });

      if (error) throw error;
      setClients(data || []);
      
      // Initialize edited numbers with current values
      const numbers: Record<string, string> = {};
      data?.forEach(client => {
        numbers[client.id] = client.client_number || "";
      });
      setEditedNumbers(numbers);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberChange = (clientId: string, value: string) => {
    setEditedNumbers(prev => ({
      ...prev,
      [clientId]: value
    }));
  };

  const saveAllChanges = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      let updatedCount = 0;
      
      for (const client of clients) {
        const newNumber = editedNumbers[client.id]?.trim() || null;
        const currentNumber = client.client_number || null;
        
        if (newNumber !== currentNumber) {
          const { error } = await supabase
            .from("clients")
            .update({ client_number: newNumber })
            .eq("id", client.id);
          
          if (error) throw error;
          updatedCount++;
        }
      }
      
      toast({
        title: "Success",
        description: `${updatedCount} client number(s) updated`,
      });
      
      await loadClients();
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadTemplate = () => {
    const template = clients.map(client => ({
      client_name: client.client_name,
      email: client.email || "",
      client_number: client.client_number || ""
    }));

    if (template.length === 0) {
      template.push({
        client_name: "Example Client Inc",
        email: "john@example.com",
        client_number: "CLT-001"
      });
    }

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Client Numbers");
    
    ws['!cols'] = [
      { wch: 30 }, // client_name
      { wch: 30 }, // email
      { wch: 20 }, // client_number
    ];

    XLSX.writeFile(wb, "client_numbers_template.xlsx");
    
    toast({
      title: "Template downloaded",
      description: "Update the client_number column and re-upload",
    });
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
              description: "The file is empty",
              variant: "destructive",
            });
            setIsUploading(false);
            return;
          }

          const errors: ValidationError[] = [];
          let updatedCount = 0;

          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowIndex = i + 2; // +2 for header and 0-index

            if (!row.client_name && !row.email) {
              errors.push({
                row: rowIndex,
                field: 'client_name/email',
                message: 'Either client_name or email is required to identify the client'
              });
              continue;
            }

            // Find matching client
            const matchingClient = clients.find(client => 
              (row.email && client.email && client.email.toLowerCase() === row.email.toLowerCase()) ||
              (row.client_name && client.client_name.toLowerCase() === row.client_name.toLowerCase())
            );

            if (!matchingClient) {
              errors.push({
                row: rowIndex,
                field: 'client_name/email',
                message: `No matching client found for "${row.client_name || row.email}"`
              });
              continue;
            }

            // Validate client_number length
            const clientNumber = row.client_number?.toString().trim() || null;
            if (clientNumber && clientNumber.length > 50) {
              errors.push({
                row: rowIndex,
                field: 'client_number',
                message: 'Client number must be less than 50 characters'
              });
              continue;
            }

            // Update the client
            const { error } = await supabase
              .from("clients")
              .update({ client_number: clientNumber })
              .eq("id", matchingClient.id);

            if (error) {
              errors.push({
                row: rowIndex,
                field: 'database',
                message: `Failed to update: ${error.message}`
              });
            } else {
              updatedCount++;
            }
          }

          setUploadResults({
            updated: updatedCount,
            failed: errors.length,
            errors
          });

          if (updatedCount > 0) {
            toast({
              title: "Success",
              description: `${updatedCount} client number(s) updated`,
            });
            await loadClients();
          }

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

  const hasChanges = clients.some(client => {
    const newNumber = editedNumbers[client.id]?.trim() || "";
    const currentNumber = client.client_number || "";
    return newNumber !== currentNumber;
  });

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

        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-2">Bulk Update Client Numbers</h1>
            <p className="text-muted-foreground mb-6">
              Add or update client numbers individually below, or use the bulk upload option.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  id="bulk-upload"
                />
                <Button
                  variant="outline"
                  disabled={isUploading}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>

              <Button
                onClick={saveAllChanges}
                disabled={isSaving || !hasChanges}
                className="ml-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>

            {/* Upload Results */}
            {uploadResults && (
              <div className="mb-6 space-y-4">
                {uploadResults.updated > 0 && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                          Upload Successful
                        </h3>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {uploadResults.updated} client number(s) updated
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
                          Some Errors Occurred
                        </h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {uploadResults.errors.map((error, index) => (
                            <p key={index} className="text-sm text-red-800 dark:text-red-200">
                              Row {error.row}: {error.message}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Client List Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No clients found. Add clients first from the dashboard.
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Client Name</TableHead>
                      <TableHead className="w-[250px]">Email</TableHead>
                      <TableHead>Client Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.client_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.email || "-"}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editedNumbers[client.id] || ""}
                            onChange={(e) => handleNumberChange(client.id, e.target.value)}
                            placeholder="Enter client number..."
                            className="max-w-[200px]"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Edit client numbers directly in the table above</li>
                <li>• Click "Save All Changes" to save your edits</li>
                <li>• Or download the template, update client numbers, and re-upload</li>
                <li>• Clients are matched by email or client name</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
