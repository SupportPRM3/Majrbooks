import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LineItem {
  id: string;
  description: string;
  rate: number;
  quantity: number;
}

interface InvoiceTemplateBuilderProps {
  onSave?: () => void;
  templateId?: string;
}

export const InvoiceTemplateBuilder = ({ onSave, templateId }: InvoiceTemplateBuilderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const [templateData, setTemplateData] = useState({
    name: "New Recurring Template",
    business_name: "",
    business_address: "",
    business_phone: "",
    business_email: "",
    logo_url: "",
    primary_color: "#00C896",
    secondary_color: "#1A365D",
  });

  const [invoiceData, setInvoiceData] = useState({
    client_id: "",
    invoice_number: `000001`,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reference: "",
    notes: "",
    terms: "",
    tax: 0,
    amount_paid: 0,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', rate: 0, quantity: 1 }
  ]);

  const [settings, setSettings] = useState({
    acceptOnlinePayments: false,
    recurringSchedule: false,
  });

  useEffect(() => {
    fetchClients();
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user?.id);
    if (data) setClients(data);
  };

  const loadTemplate = async () => {
    if (!templateId) return;
    const { data } = await supabase
      .from("invoice_templates")
      .select("*")
      .eq("id", templateId)
      .single();
    if (data) {
      setTemplateData(data);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, upload to storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setTemplateData({ ...templateData, logo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { 
      id: Date.now().toString(), 
      description: '', 
      rate: 0, 
      quantity: 1 
    }]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + invoiceData.tax - invoiceData.amount_paid;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: template, error } = await supabase
        .from("invoice_templates")
        .upsert({
          id: templateId,
          user_id: user?.id,
          ...templateData,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Template saved!",
        description: "Your invoice template has been saved successfully.",
      });

      onSave?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === invoiceData.client_id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form Area */}
      <div className="lg:col-span-2">
        <Card className="p-6 space-y-6">
          {/* Header with Title and Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">{templateData.name}</h2>
            <div className="flex gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {/* Logo Upload Area */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            {templateData.logo_url ? (
              <img src={templateData.logo_url} alt="Logo" className="max-h-24 mx-auto" />
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag your logo here,</p>
                <p className="text-sm text-muted-foreground">or select a file</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <Label htmlFor="logo-upload" className="cursor-pointer text-primary hover:underline">
              {templateData.logo_url ? "Change logo" : "Upload logo"}
            </Label>
          </div>

          {/* Business Information */}
          <div className="text-right space-y-1">
            <Input
              placeholder="Business Name"
              value={templateData.business_name}
              onChange={(e) => setTemplateData({ ...templateData, business_name: e.target.value })}
              className="text-right"
            />
            <Input
              placeholder="Address"
              value={templateData.business_address}
              onChange={(e) => setTemplateData({ ...templateData, business_address: e.target.value })}
              className="text-right text-sm"
            />
            <Input
              placeholder="Phone"
              value={templateData.business_phone}
              onChange={(e) => setTemplateData({ ...templateData, business_phone: e.target.value })}
              className="text-right text-sm"
            />
            <Input
              placeholder="Email"
              value={templateData.business_email}
              onChange={(e) => setTemplateData({ ...templateData, business_email: e.target.value })}
              className="text-right text-sm"
            />
          </div>

          <Separator />

          {/* Client Selection and Invoice Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Billed To</Label>
                <Select value={invoiceData.client_id} onValueChange={(value) => setInvoiceData({ ...invoiceData, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClient && (
                  <div className="text-sm text-muted-foreground">
                    <p>{selectedClient.email}</p>
                    <p>{selectedClient.address}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Issue</Label>
                  <Input
                    type="date"
                    value={invoiceData.issue_date}
                    onChange={(e) => setInvoiceData({ ...invoiceData, issue_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={invoiceData.due_date}
                    onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input
                    value={invoiceData.invoice_number}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input
                    placeholder="Enter value (e.g. PO #)"
                    value={invoiceData.reference}
                    onChange={(e) => setInvoiceData({ ...invoiceData, reference: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount Due (USD)</Label>
                <div className="text-3xl font-bold text-foreground">
                  ${calculateTotal().toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items Table */}
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 font-semibold text-sm">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Rate</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Line Total</div>
              <div className="col-span-1"></div>
            </div>

            {lineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                <Input
                  className="col-span-5"
                  placeholder="Description of service or product..."
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                />
                <div className="col-span-2 font-semibold">
                  ${(item.rate * item.quantity).toFixed(2)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="col-span-1"
                  onClick={() => removeLineItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" onClick={addLineItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add a Line
            </Button>
          </div>

          <Separator />

          {/* Totals Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Tax</span>
              <Input
                type="number"
                step="0.01"
                className="w-32 text-right"
                value={invoiceData.tax}
                onChange={(e) => setInvoiceData({ ...invoiceData, tax: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-bold">${(calculateSubtotal() + invoiceData.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Amount Paid</span>
              <Input
                type="number"
                step="0.01"
                className="w-32 text-right"
                value={invoiceData.amount_paid}
                onChange={(e) => setInvoiceData({ ...invoiceData, amount_paid: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Amount Due (USD)</span>
              <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Notes and Terms */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Enter notes (optional)"
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Terms</Label>
              <Textarea
                placeholder="Enter terms or conditions (optional)"
                value={invoiceData.terms}
                onChange={(e) => setInvoiceData({ ...invoiceData, terms: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Panel */}
      <div className="space-y-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Settings</h3>
          <p className="text-sm text-muted-foreground mb-6">For this template</p>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Accept Online Payments</p>
                <p className="text-xs text-muted-foreground">Let clients pay you online</p>
              </div>
              <Switch
                checked={settings.acceptOnlinePayments}
                onCheckedChange={(checked) => setSettings({ ...settings, acceptOnlinePayments: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">Customize Invoice Style</p>
              </div>
              <p className="text-xs text-muted-foreground">Change template, color, and Font</p>
              
              <div className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Input
                    type="color"
                    value={templateData.primary_color}
                    onChange={(e) => setTemplateData({ ...templateData, primary_color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <Input
                    type="color"
                    value={templateData.secondary_color}
                    onChange={(e) => setTemplateData({ ...templateData, secondary_color: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recurring Schedule</p>
                <p className="text-xs text-muted-foreground">Sends an invoice every month</p>
              </div>
              <Switch
                checked={settings.recurringSchedule}
                onCheckedChange={(checked) => setSettings({ ...settings, recurringSchedule: checked })}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
