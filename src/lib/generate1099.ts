import jsPDF from "jspdf";

interface ContractorInfo {
  first_name: string;
  last_name: string;
  business_name: string | null;
  tax_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

interface Payment {
  amount: number;
  description: string | null;
  payment_date: string;
}

export function generate1099PDF(
  contractor: ContractorInfo,
  payments: Payment[],
  taxYear: number,
  payerInfo: {
    name: string;
    tin: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  },
  taxWithholding?: {
    federalTaxWithheld: number;
    stateTaxWithheld: number;
    statePayerNumber: string;
    stateIncome: number;
  }
) {
  const doc = new jsPDF();
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  // Set up page margins
  const leftMargin = 15;
  const rightMargin = 195;
  const formWidth = 180;

  // Form header
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("9595", leftMargin, 10);
  
  // VOID and CORRECTED checkboxes
  doc.rect(leftMargin, 12, 3, 3);
  doc.text("VOID", leftMargin + 5, 14.5);
  doc.rect(leftMargin + 20, 12, 3, 3);
  doc.text("CORRECTED", leftMargin + 25, 14.5);

  // Main title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Form 1099-NEC", 105, 20, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nonemployee Compensation`, 105, 26, { align: "center" });
  
  doc.setFontSize(7);
  doc.text(`Copy B`, rightMargin - 10, 20, { align: "right" });
  doc.text(`For Recipient`, rightMargin - 10, 24, { align: "right" });
  doc.text(`${taxYear}`, rightMargin - 10, 32, { align: "right" });

  // Form boxes structure
  doc.setLineWidth(0.5);
  
  // Payer's information section (Top Left)
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("PAYER'S name, street address, city or town, state or province, country, ZIP", leftMargin, 40);
  doc.text("or foreign postal code, and telephone no.", leftMargin, 43);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(payerInfo.name, leftMargin, 48);
  doc.setFont("helvetica", "normal");
  doc.text(payerInfo.address, leftMargin, 53);
  doc.text(`${payerInfo.city}, ${payerInfo.state} ${payerInfo.zip}`, leftMargin, 58);

  // Payer's TIN box
  doc.rect(leftMargin, 62, 85, 12);
  doc.setFontSize(6);
  doc.text("PAYER'S TIN", leftMargin + 1, 66);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(payerInfo.tin, leftMargin + 2, 71);

  // Recipient's TIN box
  doc.rect(leftMargin, 74, 85, 12);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("RECIPIENT'S TIN", leftMargin + 1, 78);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(contractor.tax_id || "XXX-XX-XXXX", leftMargin + 2, 83);

  // Recipient's name box
  doc.rect(leftMargin, 86, 85, 12);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("RECIPIENT'S name", leftMargin + 1, 90);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const recipientName = contractor.business_name || 
    `${contractor.first_name} ${contractor.last_name}`;
  doc.text(recipientName, leftMargin + 2, 95);

  // Recipient's address
  doc.rect(leftMargin, 98, 85, 20);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Street address (including apt. no.)", leftMargin + 1, 102);
  doc.setFontSize(8);
  if (contractor.address) {
    doc.text(contractor.address, leftMargin + 2, 108);
  }

  doc.rect(leftMargin, 118, 85, 12);
  doc.setFontSize(6);
  doc.text("City or town, state or province, country, and ZIP or foreign postal code", leftMargin + 1, 122);
  doc.setFontSize(8);
  if (contractor.city) {
    doc.text(`${contractor.city}, ${contractor.state || ""} ${contractor.zip_code || ""}`, leftMargin + 2, 127);
  }

  // Account number (optional)
  doc.rect(leftMargin, 130, 85, 8);
  doc.setFontSize(6);
  doc.text("Account number (see instructions)", leftMargin + 1, 134);

  // Box 1 - Nonemployee compensation (Right side - most important box)
  doc.rect(105, 62, 90, 25);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("1  Nonemployee compensation", 107, 66);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`$ ${totalAmount.toFixed(2)}`, rightMargin - 5, 80, { align: "right" });

  // Box 2 - Payer made direct sales
  doc.rect(105, 87, 45, 15);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("2  Payer made direct sales totaling", 107, 90);
  doc.text("    $5,000 or more of consumer", 107, 93);
  doc.text("    products to recipient for resale ▶", 107, 96);
  doc.rect(145, 98, 4, 4);

  // Box 4 - Federal income tax withheld
  doc.rect(150, 87, 45, 15);
  doc.setFontSize(6);
  doc.text("4  Federal income tax withheld", 152, 91);
  if (taxWithholding?.federalTaxWithheld) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`$ ${taxWithholding.federalTaxWithheld.toFixed(2)}`, rightMargin - 5, 98, { align: "right" });
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("$", 152, 98);
  }

  // Box 5 - State tax withheld
  doc.rect(105, 102, 30, 15);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("5  State tax withheld", 107, 106);
  if (taxWithholding?.stateTaxWithheld) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`$ ${taxWithholding.stateTaxWithheld.toFixed(2)}`, 132, 113, { align: "right" });
  } else {
    doc.setFontSize(8);
    doc.text("$", 107, 113);
  }

  // Box 6 - State/Payer's state no.
  doc.rect(135, 102, 30, 15);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("6  State/Payer's state no.", 137, 106);
  if (taxWithholding?.statePayerNumber) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(taxWithholding.statePayerNumber.substring(0, 15), 137, 113);
  }

  // Box 7 - State income
  doc.rect(165, 102, 30, 15);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("7  State income", 167, 106);
  if (taxWithholding?.stateIncome) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`$ ${taxWithholding.stateIncome.toFixed(2)}`, 192, 113, { align: "right" });
  } else {
    doc.setFontSize(8);
    doc.text("$", 167, 113);
  }

  // Form instructions and information
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Form 1099-NEC", leftMargin, 145);
  doc.text(`(Rev. January ${taxYear})`, leftMargin, 148);
  doc.text("Department of the Treasury - Internal Revenue Service", leftMargin, 152);

  // Instructions for recipient
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Instructions for Recipient", leftMargin, 165);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  
  const instructions = [
    "Report this income on your tax return. If you are self-employed, report this income on Schedule C",
    "(Form 1040), Profit or Loss From Business, or Schedule C-EZ (Form 1040). If you are not self-employed,",
    "report this income on line 8 of Form 1040 or Form 1040-SR.",
    "",
    "Box 1. Shows nonemployee compensation. If you are not self-employed and box 1 is $600 or more,",
    "you probably have to report this amount on your income tax return. You may not owe tax on this income,",
    "depending on your filing status and total income.",
    "",
    "Payments shown on this form may be subject to self-employment tax. If your net earnings from",
    "self-employment are $400 or more, you must file a return and compute your self-employment tax",
    "on Schedule SE (Form 1040)."
  ];

  let yPos = 170;
  instructions.forEach((line) => {
    doc.text(line, leftMargin, yPos);
    yPos += 3.5;
  });

  // Payment breakdown section (second page)
  if (payments.length > 0) {
    doc.addPage();
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details Breakdown", leftMargin, 20);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Tax Year: ${taxYear}`, leftMargin, 28);
    doc.text(`Recipient: ${recipientName}`, leftMargin, 34);
    doc.text(`Total Compensation: $${totalAmount.toFixed(2)}`, leftMargin, 40);

    // Payment table
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    yPos = 50;
    doc.text("Date", leftMargin, yPos);
    doc.text("Description", leftMargin + 30, yPos);
    doc.text("Amount", rightMargin - 20, yPos);
    
    doc.setLineWidth(0.3);
    doc.line(leftMargin, yPos + 2, rightMargin, yPos + 2);
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    
    payments.forEach((payment) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const date = new Date(payment.payment_date).toLocaleDateString();
      const desc = payment.description || "Nonemployee compensation";
      
      doc.text(date, leftMargin, yPos);
      doc.text(desc.substring(0, 40), leftMargin + 30, yPos);
      doc.text(`$${payment.amount.toFixed(2)}`, rightMargin - 5, yPos, { align: "right" });
      yPos += 6;
    });

    // Total line
    doc.setFont("helvetica", "bold");
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 6;
    doc.text("Total:", rightMargin - 35, yPos);
    doc.text(`$${totalAmount.toFixed(2)}`, rightMargin - 5, yPos, { align: "right" });
  }

  return doc;
}
