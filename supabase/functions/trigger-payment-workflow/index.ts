import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, invoiceId, userId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Triggering payment workflow for payment:", paymentId);

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("invoice_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      console.error("Error fetching payment:", paymentError);
      throw new Error("Payment not found");
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      throw new Error("Invoice not found");
    }

    // Get active payment_received workflows for this user
    const { data: workflows, error: workflowsError } = await supabase
      .from("workflows")
      .select("*")
      .eq("user_id", userId)
      .eq("trigger_type", "payment_received")
      .eq("status", "active");

    if (workflowsError) {
      console.error("Error fetching workflows:", workflowsError);
      throw workflowsError;
    }

    if (!workflows || workflows.length === 0) {
      console.log("No active payment_received workflows found");
      return new Response(
        JSON.stringify({ success: true, message: "No workflows to trigger", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${workflows.length} active payment_received workflows`);

    const results: any[] = [];
    let processedCount = 0;

    for (const workflow of workflows) {
      // Prepare trigger data with payment and invoice details
      const triggerData = {
        payment_id: payment.id,
        payment_amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        client_email: invoice.client_email || "",
        invoice_amount: invoice.amount,
        total_paid: (invoice.amount_paid || 0) + payment.amount,
        remaining_balance: Math.max(0, invoice.amount - ((invoice.amount_paid || 0) + payment.amount)),
      };

      console.log(`Executing workflow "${workflow.name}" for payment ${payment.id}`);

      try {
        const { data: execResult, error: execError } = await supabase.functions.invoke(
          "execute-workflow",
          {
            body: {
              workflowId: workflow.id,
              triggerData,
            },
          }
        );

        if (execError) {
          console.error(`Error executing workflow:`, execError);
          results.push({
            workflow: workflow.name,
            success: false,
            error: execError.message,
          });
        } else {
          console.log(`Workflow executed successfully`);
          results.push({
            workflow: workflow.name,
            success: true,
          });
          processedCount++;
        }
      } catch (execException) {
        console.error(`Exception executing workflow:`, execException);
        results.push({
          workflow: workflow.name,
          success: false,
          error: execException instanceof Error ? execException.message : String(execException),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} workflows`,
        processed: processedCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in trigger-payment-workflow:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
