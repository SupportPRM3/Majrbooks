import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Building, Download, Edit, Plus, FileText, Check, AlertCircle, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface PaymentMethod {
  id: string;
  type: "card" | "bank";
  last4: string;
  brand?: string;
  bankName?: string;
  accountType?: string;
  accountHolderName?: string;
  routingNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
}

const mockPaymentMethods: PaymentMethod[] = [];

const mockBillingAddress: BillingAddress = {
  line1: "123 Business Ave",
  line2: "Suite 100",
  city: "San Francisco",
  state: "CA",
  postalCode: "94102",
  country: "United States",
};

const mockInvoices: Invoice[] = [
  { id: "inv1", number: "INV-2024-001", date: "2024-01-01", dueDate: "2024-01-15", amount: 249, status: "paid" },
  { id: "inv2", number: "INV-2023-012", date: "2023-12-01", dueDate: "2023-12-15", amount: 249, status: "paid" },
  { id: "inv3", number: "INV-2023-011", date: "2023-11-01", dueDate: "2023-11-15", amount: 249, status: "paid" },
  { id: "inv4", number: "INV-2024-002", date: "2024-01-15", dueDate: "2024-01-30", amount: 79, status: "pending" },
];

const BillingDetails = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    routingNumber: "",
    accountType: "checking" as "checking" | "savings",
  });
  const [addressForm, setAddressForm] = useState<BillingAddress>(mockBillingAddress);
  const [editInvoiceDialogOpen, setEditInvoiceDialogOpen] = useState(false);
  const [deleteInvoiceDialogOpen, setDeleteInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({ number: "", date: "", dueDate: "", amount: "", status: "pending" as "paid" | "pending" | "overdue" });

  useEffect(() => {
    setTimeout(() => {
      setPaymentMethods(mockPaymentMethods);
      setBillingAddress(mockBillingAddress);
      setInvoices(mockInvoices);
      setLoading(false);
    }, 500);
  }, []);

  const handleAddCard = () => {
    if (!cardForm.number || !cardForm.expiry || !cardForm.cvc) {
      toast.error("Please fill in all card details");
      return;
    }
    const newCard: PaymentMethod = {
      id: `pm${Date.now()}`,
      type: "card",
      last4: cardForm.number.slice(-4),
      brand: "Visa",
      expiryMonth: parseInt(cardForm.expiry.split("/")[0]),
      expiryYear: parseInt("20" + cardForm.expiry.split("/")[1]),
      isDefault: paymentMethods.length === 0,
    };
    setPaymentMethods(prev => [...prev, newCard]);
    toast.success("Card added successfully");
    setCardDialogOpen(false);
    setCardForm({ number: "", expiry: "", cvc: "", name: "" });
  };

  const handleAddBank = () => {
    if (!bankForm.accountHolderName.trim()) {
      toast.error("Please enter account holder name");
      return;
    }
    if (!bankForm.bankName.trim()) {
      toast.error("Please enter bank name");
      return;
    }
    if (!bankForm.accountNumber || bankForm.accountNumber.length < 4) {
      toast.error("Please enter a valid account number");
      return;
    }
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      toast.error("Account numbers do not match");
      return;
    }
    if (!bankForm.routingNumber || bankForm.routingNumber.length !== 9) {
      toast.error("Please enter a valid 9-digit routing number");
      return;
    }

    const newBank: PaymentMethod = {
      id: `pm${Date.now()}`,
      type: "bank",
      last4: bankForm.accountNumber.slice(-4),
      bankName: bankForm.bankName,
      accountType: bankForm.accountType,
      accountHolderName: bankForm.accountHolderName,
      routingNumber: bankForm.routingNumber.slice(-4),
      isDefault: paymentMethods.length === 0,
    };
    setPaymentMethods(prev => [...prev, newBank]);
    toast.success("Bank account added successfully");
    setBankDialogOpen(false);
    setBankForm({
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      confirmAccountNumber: "",
      routingNumber: "",
      accountType: "checking",
    });
  };

  const handleUpdateAddress = () => {
    setBillingAddress(addressForm);
    toast.success("Billing address updated");
    setAddressDialogOpen(false);
  };

  const setDefaultPayment = (id: string) => {
    setPaymentMethods(prev => prev.map(pm => ({ ...pm, isDefault: pm.id === id })));
    toast.success("Default payment method updated");
  };

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    toast.success("Payment method removed");
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceForm({
      number: invoice.number,
      date: invoice.date,
      dueDate: invoice.dueDate,
      amount: invoice.amount.toString(),
      status: invoice.status,
    });
    setEditInvoiceDialogOpen(true);
  };

  const handleSaveInvoice = () => {
    if (!selectedInvoice) return;
    if (!invoiceForm.number || !invoiceForm.date || !invoiceForm.dueDate || !invoiceForm.amount) {
      toast.error("Please fill in all fields");
      return;
    }
    setInvoices(prev => prev.map(inv => 
      inv.id === selectedInvoice.id 
        ? { ...inv, number: invoiceForm.number, date: invoiceForm.date, dueDate: invoiceForm.dueDate, amount: parseFloat(invoiceForm.amount), status: invoiceForm.status }
        : inv
    ));
    toast.success("Invoice updated successfully");
    setEditInvoiceDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteInvoiceDialogOpen(true);
  };

  const confirmDeleteInvoice = () => {
    if (!selectedInvoice) return;
    setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
    toast.success("Invoice deleted successfully");
    setDeleteInvoiceDialogOpen(false);
    setSelectedInvoice(null);
  };

  const downloadInvoice = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185);
    doc.text("INVOICE", 20, 30);
    
    // Company info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("MAJR Books", 20, 45);
    doc.text("123 Business Avenue", 20, 50);
    doc.text("San Francisco, CA 94102", 20, 55);
    doc.text("support@majrbooks.com", 20, 60);
    
    // Invoice details box
    doc.setFillColor(245, 245, 245);
    doc.rect(130, 40, 60, 30, "F");
    doc.setTextColor(60);
    doc.setFontSize(10);
    doc.text("Invoice Number:", 135, 50);
    doc.setTextColor(0);
    doc.text(invoice.number, 135, 56);
    doc.setTextColor(60);
    doc.text("Date:", 135, 64);
    doc.setTextColor(0);
    doc.text(invoice.date, 155, 64);
    
    // Bill To
    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text("Bill To:", 20, 80);
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(billingAddress?.line1 || "Customer Address", 20, 88);
    doc.text(`${billingAddress?.city || "City"}, ${billingAddress?.state || "State"} ${billingAddress?.postalCode || "00000"}`, 20, 94);
    
    // Table header
    doc.setFillColor(41, 128, 185);
    doc.rect(20, 110, 170, 10, "F");
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text("Description", 25, 117);
    doc.text("Amount", 160, 117);
    
    // Table content
    doc.setTextColor(0);
    doc.text("Monthly Subscription", 25, 130);
    doc.text(`$${invoice.amount.toFixed(2)}`, 160, 130);
    
    // Line
    doc.setDrawColor(200);
    doc.line(20, 140, 190, 140);
    
    // Total
    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text("Total:", 140, 155);
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text(`$${invoice.amount.toFixed(2)}`, 160, 155);
    
    // Status badge
    const statusColor = invoice.status === "paid" ? [39, 174, 96] : invoice.status === "pending" ? [241, 196, 15] : [231, 76, 60];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(20, 150, 30, 8, 2, 2, "F");
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.text(invoice.status.toUpperCase(), 25, 155);
    
    // Due date
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Due Date: ${invoice.dueDate}`, 20, 175);
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Thank you for your business!", 20, 260);
    doc.text("Questions? Contact support@majrbooks.com", 20, 266);
    
    // Save the PDF
    doc.save(`${invoice.number}.pdf`);
    toast.success(`Downloaded ${invoice.number}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-8 text-muted-foreground">Loading billing details...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              Billing Details
            </h1>
            <p className="text-muted-foreground mt-1">Manage your payment methods and billing information</p>
          </div>
        </div>

        {/* Payment Methods */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payment Methods</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setBankDialogOpen(true)} size="sm" variant="outline" className="gap-2">
                <Building className="h-4 w-4" /> Add Bank Account
              </Button>
              <Button onClick={() => setCardDialogOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Card
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payment methods added</div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {pm.type === "card" ? (
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <Building className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">
                          {pm.type === "card" ? `${pm.brand} •••• ${pm.last4}` : `${pm.bankName} •••• ${pm.last4}`}
                        </p>
                        {pm.type === "card" ? (
                          <p className="text-sm text-muted-foreground">Expires {pm.expiryMonth}/{pm.expiryYear}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {pm.accountType?.charAt(0).toUpperCase()}{pm.accountType?.slice(1)} Account • {pm.accountHolderName}
                          </p>
                        )}
                      </div>
                      {pm.isDefault && <Badge className="bg-green-100 text-green-800">Default</Badge>}
                    </div>
                    <div className="flex gap-2">
                      {!pm.isDefault && (
                        <Button variant="outline" size="sm" onClick={() => setDefaultPayment(pm.id)}>
                          Set Default
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => deletePaymentMethod(pm.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Billing Address</CardTitle>
            <Button variant="outline" size="sm" onClick={() => { setAddressForm(billingAddress!); setAddressDialogOpen(true); }} className="gap-2">
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </CardHeader>
          <CardContent>
            {billingAddress && (
              <div className="space-y-1">
                <p>{billingAddress.line1}</p>
                {billingAddress.line2 && <p>{billingAddress.line2}</p>}
                <p>{billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}</p>
                <p>{billingAddress.country}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => downloadInvoice(invoice)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Card Dialog */}
        <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Card Number</Label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry</Label>
                  <Input
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CVC</Label>
                  <Input
                    placeholder="123"
                    value={cardForm.cvc}
                    onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cardholder Name</Label>
                <Input
                  placeholder="John Doe"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCardDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddCard}>Add Card</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Bank Account Dialog */}
        <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Add Bank Account
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input
                  placeholder="John Doe"
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  placeholder="Chase Bank"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select 
                  value={bankForm.accountType} 
                  onValueChange={(value: "checking" | "savings") => setBankForm({ ...bankForm, accountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Routing Number (9 digits)</Label>
                <Input
                  placeholder="123456789"
                  value={bankForm.routingNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setBankForm({ ...bankForm, routingNumber: value });
                  }}
                  maxLength={9}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  placeholder="Enter account number"
                  value={bankForm.accountNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setBankForm({ ...bankForm, accountNumber: value });
                  }}
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Account Number</Label>
                <Input
                  placeholder="Re-enter account number"
                  value={bankForm.confirmAccountNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setBankForm({ ...bankForm, confirmAccountNumber: value });
                  }}
                  type="password"
                />
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Your bank details are securely encrypted.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBankDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddBank}>Add Bank Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Address Dialog */}
        <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Billing Address</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address Line 2 (Optional)</Label>
                <Input
                  value={addressForm.line2 || ""}
                  onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateAddress}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Invoice Dialog */}
        <Dialog open={editInvoiceDialogOpen} onOpenChange={setEditInvoiceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={invoiceForm.number}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={invoiceForm.date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={invoiceForm.status} 
                  onValueChange={(value: "paid" | "pending" | "overdue") => setInvoiceForm({ ...invoiceForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditInvoiceDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveInvoice}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Invoice Confirmation */}
        <AlertDialog open={deleteInvoiceDialogOpen} onOpenChange={setDeleteInvoiceDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete invoice {selectedInvoice?.number}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteInvoice} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default BillingDetails;
