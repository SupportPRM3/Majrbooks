import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  invoiceId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    const { invoiceId }: InvoiceRequest = await req.json();

    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, invoice_line_items(*)")
      .eq("id", invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    if (!invoice.client_email) {
      throw new Error("Client email not found");
    }

    // Get line items
    const { data: lineItems } = await supabase
      .from("invoice_line_items")
      .select("*")
      .eq("invoice_id", invoiceId);

    // Create email content
    const lineItemsHtml = lineItems
      ?.map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.rate).toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(Number(item.rate) * Number(item.quantity)).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #00C896; margin: 0;">Invoice ${invoice.invoice_number}</h1>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p><strong>Billed To:</strong> ${invoice.client_name}</p>
            <p><strong>Date of Issue:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Rate</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; margin-bottom: 20px;">
            <p><strong>Subtotal:</strong> $${Number(invoice.subtotal || invoice.amount).toFixed(2)}</p>
            <p><strong>Tax:</strong> $${Number(invoice.tax || 0).toFixed(2)}</p>
            <p style="font-size: 1.2em; color: #00C896;"><strong>Amount Due:</strong> $${Number(invoice.amount).toFixed(2)}</p>
          </div>

          ${invoice.notes ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0;"><strong>Notes:</strong></p>
              <p style="margin: 10px 0 0 0;">${invoice.notes}</p>
            </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 0.9em;">
            <p>Thank you for your business!</p>
            <p>Please remit payment by ${new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;

    // Send invoice email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'MajrBooks <support@majrtaxsoftware.com>',
      to: [invoice.client_email],
      subject: `Invoice ${invoice.invoice_number} from MajrBooks`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending invoice email:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log(`Invoice ${invoice.invoice_number} sent to ${invoice.client_email}`, emailData);

    // Update invoice status to pending if it was draft
    if (invoice.status === "draft") {
      await supabase
        .from("invoices")
        .update({ status: "pending" })
        .eq("id", invoiceId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invoice sent to ${invoice.client_email}`,
        emailId: emailData?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invoice function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
