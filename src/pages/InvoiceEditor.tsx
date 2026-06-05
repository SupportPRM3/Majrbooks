import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Send, Download } from "lucide-react";
import { format } from "date-fns";
import { exportInvoiceToPDF } from "@/lib/invoiceExport";

interface LineItem {
  id: string;
  description: string;
  rate: number;
  quantity: number;
}

const InvoiceEditor = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("clientId");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now()}`,
    issue_date: format(new Date(), "yyyy-MM-dd"),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    status: "draft",
    notes: "",
    terms: "",
  });
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", rate: 0, quantity: 1 }
  ]);

  useEffect(() => {
    if (!user) {
      navigate("/dashboard");
      return;
    }
    
    if (id) {
      loadInvoice();
    } else if (clientId) {
      loadClient();
    }
  }, [user, id, clientId]);

  const loadClient = async () => {
    if (!user || !clientId) return;
    
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("client_name, email")
        .eq("id", clientId)
        .eq("user_id", user.id)
        .single();
        
      if (error) throw error;
      if (data) {
        setClientName(data.client_name);
        setClientEmail(data.email || "");
        
        // Look up client_user_id from accepted invitations
        if (data.email) {
          const { data: invitation } = await supabase
            .from("client_invitations")
            .select("client_user_id")
            .eq("user_id", user.id)
            .eq("client_email", data.email)
            .eq("status", "accepted")
            .not("client_user_id", "is", null)
            .maybeSingle();
          
          if (invitation?.client_user_id) {
            setClientUserId(invitation.client_user_id);
          }
        }
      }
    } catch (error) {
      console.error("Error loading client:", error);
    }
  };

  const loadInvoice = async () => {
    if (!user || !id) return;
    
    setLoading(true);
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      if (invoice) {
        setClientName(invoice.client_name);
        setClientEmail(invoice.client_email || "");
        setClientUserId(invoice.client_user_id || null);
        setFormData({
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          status: invoice.status,
          notes: invoice.notes || "",
          terms: invoice.terms || "",
        });
        
        // Load line items
        const { data: items, error: itemsError } = await supabase
          .from("invoice_line_items")
          .select("*")
          .eq("invoice_id", id);
          
        if (itemsError) throw itemsError;
        
        if (items && items.length > 0) {
          setLineItems(items.map(item => ({
            id: item.id,
            description: item.description,
            rate: Number(item.rate),
            quantity: Number(item.quantity),
          })));
        }
      }
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: crypto.randomUUID(), description: "", rate: 0, quantity: 1 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!clientName) {
      toast({
        title: "Missing Information",
        description: "Client name is required",
        variant: "destructive",
      });
      return;
    }
    
    const total = calculateTotal();
    if (total <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Invoice total must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const invoiceData = {
        user_id: user.id,
        client_name: clientName,
        client_email: clientEmail || null,
        client_user_id: clientUserId, // Secure link to client's auth account
        invoice_number: formData.invoice_number,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        status: formData.status,
        notes: formData.notes || null,
        terms: formData.terms || null,
        amount: total,
        subtotal: calculateSubtotal(),
      };
      
      let invoiceId = id;
      
      if (id) {
        // Update existing invoice
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", id);
          
        if (error) throw error;
        
        // Delete old line items
        await supabase
          .from("invoice_line_items")
          .delete()
          .eq("invoice_id", id);
      } else {
        // Create new invoice
        const { data, error } = await supabase
          .from("invoices")
          .insert(invoiceData)
          .select()
          .single();
          
        if (error) throw error;
        invoiceId = data.id;
      }
      
      // Insert line items
      const lineItemsData = lineItems.map(item => ({
        invoice_id: invoiceId,
        description: item.description,
        rate: item.rate,
        quantity: item.quantity,
      }));
      
      const { error: itemsError } = await supabase
        .from("invoice_line_items")
        .insert(lineItemsData);
        
      if (itemsError) throw itemsError;
      
      toast({
        title: "Success",
        description: id ? "Invoice updated successfully" : "Invoice created successfully",
      });
      
      navigate(`/client/${clientId || "-1"}`);
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToClient = async () => {
    if (!id) {
      toast({
        title: "Save First",
        description: "Please save the invoice before sending",
        variant: "destructive",
      });
      return;
    }
    
    if (!clientEmail) {
      toast({
        title: "No Email",
        description: "Client email is required to send invoice",
        variant: "destructive",
      });
      return;
    }
    
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-invoice", {
        body: { invoiceId: id },
      });
      
      if (error) throw error;
      
      toast({
        title: "Invoice Sent",
        description: `Invoice has been sent to ${clientEmail}`,
      });
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleExportPDF = async () => {
    if (!id) {
      toast({
        title: "Save First",
        description: "Please save the invoice before exporting",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch full invoice data with client details
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (invoiceError) throw invoiceError;

      // Fetch client details
      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user?.id)
        .eq("client_name", clientName)
        .maybeSingle();

      // Get business info from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name, email")
        .eq("id", user?.id)
        .single();

      const businessInfo = profile
        ? { name: profile.business_name || "Your Business", email: profile.email || "" }
        : undefined;

      exportInvoiceToPDF(invoice, clientData || undefined, businessInfo, lineItems);

      toast({
        title: "Success",
        description: "Invoice exported as PDF",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/client/${clientId || "-1"}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">
              {id ? "Edit Invoice" : "New Invoice"}
            </h1>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              Save
            </Button>
            {id && (
              <>
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={handleSendToClient} disabled={sending || !clientEmail}>
                  <Send className="h-4 w-4 mr-2" />
                  Send To Client
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Header Section */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Billed To</h3>
                    <p className="text-lg font-medium">{clientName || "Select Client"}</p>
                    {clientEmail && <p className="text-sm text-muted-foreground">{clientEmail}</p>}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Date of Issue</Label>
                      <Input
                        type="date"
                        value={formData.issue_date}
                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Invoice Number</Label>
                      <Input
                        value={formData.invoice_number}
                        onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div></div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                {/* Line Items */}
                <div>
                  <div className="grid grid-cols-12 gap-4 mb-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2">Rate</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2 text-right">Line Total</div>
                  </div>
                  
                  {lineItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 mb-3 items-start">
                      <div className="col-span-6">
                        <Input
                          placeholder="Description of service or product"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.rate || ""}
                          onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity || ""}
                          onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-1 text-right pt-2">
                        ${(item.rate * item.quantity).toFixed(2)}
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" size="sm" onClick={addLineItem} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>$0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Amount Paid</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Amount Due (USD)</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes or payment instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">For This Invoice</p>
                
                <div className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-2 hover:bg-accent rounded px-2 cursor-pointer">
                      <span>Accept Online Payments</span>
                      <span className="text-muted-foreground">NO</span>
                    </div>
                    <div className="flex items-center justify-between py-2 hover:bg-accent rounded px-2 cursor-pointer">
                      <span>Customize Invoice Style</span>
                      <span className="text-muted-foreground">→</span>
                    </div>
                    <div className="flex items-center justify-between py-2 hover:bg-accent rounded px-2 cursor-pointer">
                      <span>Make Recurring</span>
                      <span className="text-muted-foreground">→</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <p className="text-sm font-medium">For {clientName || "Client"}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-2 hover:bg-accent rounded px-2 cursor-pointer">
                      <span>Send Reminders</span>
                      <span className="text-muted-foreground">NO</span>
                    </div>
                    <div className="flex items-center justify-between py-2 hover:bg-accent rounded px-2 cursor-pointer">
                      <span>Charge Late Fees</span>
                      <span className="text-muted-foreground">NO</span>
                    </div>
                    <div className="flex items-center justify-between py-2 hover:bg-accent rounded px-2 cursor-pointer">
                      <span>Currency & Language</span>
                      <span className="text-muted-foreground">USD</span>
                    </div>
                    <div className="flex items-center justify-between py-2 hover:bg-accent rounded px-2 cursor-pointer">
                      <span>Invoice Attachments</span>
                      <span className="text-muted-foreground">NO</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InvoiceEditor;
