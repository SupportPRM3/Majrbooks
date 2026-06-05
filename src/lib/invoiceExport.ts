import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
  client_name: string;
  client_email?: string | null;
  subtotal?: number;
  tax?: number;
  amount_paid?: number;
  reference?: string | null;
  terms?: string | null;
}

interface LineItem {
  description: string;
  rate: number;
  quantity: number;
}

interface Client {
  client_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  address: string | null;
}

export const exportInvoiceToPDF = (
  invoice: Invoice, 
  client?: Client, 
  businessInfo?: { name: string; email: string },
  lineItems: LineItem[] = []
) => {
  const doc = new jsPDF();
  
  // Header with branding
  doc.setFillColor(0, 200, 150);
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('INVOICE', 15, 20);
  
  // Business Info (right side in header)
  if (businessInfo) {
    doc.setFontSize(9);
    doc.text(businessInfo.name, 195, 12, { align: 'right' });
    doc.text(businessInfo.email, 195, 17, { align: 'right' });
  }
  
  // Invoice Details - Right Side below header
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 40);
  doc.text(`Issue Date: ${format(new Date(invoice.issue_date), "MMM dd, yyyy")}`, 140, 45);
  doc.text(`Due Date: ${format(new Date(invoice.due_date), "MMM dd, yyyy")}`, 140, 50);
  
  if (invoice.reference) {
    doc.text(`Reference: ${invoice.reference}`, 140, 55);
  }
  
  // Client Information
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text("Bill To:", 20, 40);
  
  doc.setFontSize(10);
  let clientY = 47;
  doc.text(client?.client_name || invoice.client_name, 20, clientY);
  
  if (client?.contact_name) {
    clientY += 5;
    doc.text(`Contact: ${client.contact_name}`, 20, clientY);
  }
  
  if (client?.email || invoice.client_email) {
    clientY += 5;
    doc.text(`${client?.email || invoice.client_email}`, 20, clientY);
  }
  
  if (client?.phone) {
    clientY += 5;
    doc.text(`${client.phone}`, 20, clientY);
  }
  
  if (client?.address) {
    clientY += 5;
    const addressLines = doc.splitTextToSize(client.address, 80);
    doc.text(addressLines, 20, clientY);
  }
  
  // Line Items Table
  const tableStartY = Math.max(clientY + 15, 75);
  
  if (lineItems && lineItems.length > 0) {
    const tableData = lineItems.map(item => [
      item.description,
      item.quantity.toString(),
      `$${item.rate.toFixed(2)}`,
      `$${(item.rate * item.quantity).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [0, 200, 150], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Subtotal
    const subtotal = invoice.subtotal || lineItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text('Subtotal:', 150, finalY);
    doc.text(`$${subtotal.toFixed(2)}`, 190, finalY, { align: 'right' });
    
    let summaryY = finalY + 6;
    
    // Tax
    if (invoice.tax && invoice.tax > 0) {
      doc.text('Tax:', 150, summaryY);
      doc.text(`$${invoice.tax.toFixed(2)}`, 190, summaryY, { align: 'right' });
      summaryY += 6;
    }
    
    // Amount Paid
    if (invoice.amount_paid && invoice.amount_paid > 0) {
      doc.text('Amount Paid:', 150, summaryY);
      doc.text(`-$${invoice.amount_paid.toFixed(2)}`, 190, summaryY, { align: 'right' });
      summaryY += 6;
    }
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Amount Due:', 150, summaryY + 3);
    doc.text(`$${invoice.amount.toFixed(2)}`, 190, summaryY + 3, { align: 'right' });
    
    let notesY = summaryY + 15;
    
    // Notes
    if (invoice.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Notes:', 20, notesY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const splitNotes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(splitNotes, 20, notesY + 5);
      notesY += splitNotes.length * 5 + 10;
    }
    
    // Terms
    if (invoice.terms) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text('Terms:', 20, notesY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const splitTerms = doc.splitTextToSize(invoice.terms, 170);
      doc.text(splitTerms, 20, notesY + 5);
    }
  } else {
    // Simple invoice without line items (original behavior)
    autoTable(doc, {
      startY: tableStartY,
      head: [["Description", "Amount"]],
      body: [
        ["Services Rendered", `$${invoice.amount.toFixed(2)}`],
      ],
      foot: [
        ["Total Amount", `$${invoice.amount.toFixed(2)}`],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [0, 200, 150],
        textColor: 255,
        fontSize: 11,
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: 40,
        fontSize: 12,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 50, halign: "right" },
      },
    });
    
    // Notes
    if (invoice.notes) {
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text("Notes:", 20, finalY + 15);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const splitNotes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(splitNotes, 20, finalY + 22);
    }
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for your business!", 105, 280, { align: "center" });
  
  // Save the PDF
  doc.save(`Invoice_${invoice.invoice_number}.pdf`);
};

export const exportInvoicesToExcel = (invoices: Invoice[], clientName?: string) => {
  // Prepare data for Excel
  const data = invoices.map((invoice) => ({
    "Invoice Number": invoice.invoice_number,
    "Client Name": invoice.client_name,
    "Amount": invoice.amount,
    "Status": invoice.status,
    "Issue Date": format(new Date(invoice.issue_date), "yyyy-MM-dd"),
    "Due Date": format(new Date(invoice.due_date), "yyyy-MM-dd"),
    "Notes": invoice.notes || "",
  }));
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  worksheet["!cols"] = [
    { wch: 20 }, // Invoice Number
    { wch: 25 }, // Client Name
    { wch: 12 }, // Amount
    { wch: 12 }, // Status
    { wch: 12 }, // Issue Date
    { wch: 12 }, // Due Date
    { wch: 40 }, // Notes
  ];
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
  
  // Generate filename
  const filename = clientName 
    ? `Invoices_${clientName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`
    : `Invoices_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  
  // Save the file
  XLSX.writeFile(workbook, filename);
};

export const exportSingleInvoiceToExcel = (invoice: Invoice) => {
  exportInvoicesToExcel([invoice], invoice.client_name);
};
