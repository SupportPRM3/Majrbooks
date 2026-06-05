import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Plus, 
  Trash2, 
  ChevronRight,
  Building2,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
}

const InvoiceTemplate = () => {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("Your Business Name");
  const [businessAddress, setBusinessAddress] = useState("123 Business St, City, State 12345");
  const [businessEmail, setBusinessEmail] = useState("contact@yourbusiness.com");
  const [businessPhone, setBusinessPhone] = useState("(555) 123-4567");
  const [clientName, setClientName] = useState("Client Name");
  const [clientAddress, setClientAddress] = useState("456 Client Ave, City, State 67890");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("Thank you for your business!");
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 1, description: "Service/Product Description", quantity: 1, rate: 0 }
  ]);

  const addLineItem = () => {
    setLineItems([...lineItems, { 
      id: Date.now(), 
      description: "", 
      quantity: 1, 
      rate: 0 
    }]);
  };

  const removeLineItem = (id: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: number, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxRate = 0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleDownload = () => {
    toast.success("Invoice template downloaded successfully!");
    setShowSubscribeDialog(true);
  };

  const subscriptionFeatures = [
    "Unlimited invoice creation & tracking",
    "Automatic payment reminders",
    "Multi-client management",
    "Financial reporting & analytics",
    "Tax preparation tools",
    "Payroll management",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/resources" className="hover:text-foreground transition-colors">
            Resources
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/resources" className="hover:text-foreground transition-colors">
            Templates
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Invoice Template</span>
        </nav>

        {/* Back Button */}
        <Link to="/resources">
          <Button variant="ghost" className="mb-6 -ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Invoice Template</h1>
            <p className="text-muted-foreground">
              Create professional invoices with customizable fields
            </p>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Invoice Preview/Editor */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {/* Invoice Header */}
            <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <Input 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="text-xl font-bold border-dashed"
                    placeholder="Your Business Name"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      className="border-dashed text-sm"
                      placeholder="Business Address"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      className="border-dashed text-sm"
                      placeholder="Email"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      className="border-dashed text-sm"
                      placeholder="Phone"
                    />
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <Badge className="text-2xl px-4 py-2 mb-4">INVOICE</Badge>
                <div className="space-y-2">
                  <div className="flex items-center justify-end gap-2">
                    <Label className="text-muted-foreground">Invoice #:</Label>
                    <Input 
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-32 border-dashed text-right"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Label className="text-muted-foreground">Date:</Label>
                    <Input 
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-40 border-dashed"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Label className="text-muted-foreground">Due Date:</Label>
                    <Input 
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-40 border-dashed"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Bill To */}
            <div className="mb-8">
              <Label className="text-muted-foreground text-sm mb-2 block">BILL TO</Label>
              <Input 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="font-semibold border-dashed mb-2"
                placeholder="Client Name"
              />
              <Textarea 
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="border-dashed resize-none"
                placeholder="Client Address"
                rows={2}
              />
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <div className="grid grid-cols-12 gap-4 mb-2 text-sm font-semibold text-muted-foreground">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              <Separator className="mb-4" />
              
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 mb-3 items-center">
                  <div className="col-span-6">
                    <Input 
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="border-dashed"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="text-center border-dashed"
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="text-right border-dashed"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-1 text-right font-medium">
                    ${(item.quantity * item.rate).toFixed(2)}
                  </div>
                  <div className="col-span-1 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" onClick={addLineItem} className="mt-2 gap-2">
                <Plus className="h-4 w-4" />
                Add Line Item
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (0%):</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-8">
              <Label className="text-muted-foreground text-sm mb-2 block">NOTES</Label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-dashed resize-none"
                placeholder="Add any notes or payment instructions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Prompt Dialog */}
        <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">Unlock the Full Power of MAJR Books</DialogTitle>
              <DialogDescription className="text-center">
                You've just scratched the surface! Subscribe to access all features and take your business finances to the next level.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 my-4">
              {subscriptionFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button 
                onClick={() => {
                  setShowSubscribeDialog(false);
                  navigate("/auth");
                }}
                className="w-full gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Subscribe Now
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowSubscribeDialog(false)}
                className="w-full text-muted-foreground"
              >
                Maybe Later
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
