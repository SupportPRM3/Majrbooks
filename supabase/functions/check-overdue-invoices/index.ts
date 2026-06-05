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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking for overdue invoices...");

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Find overdue invoices (due_date < today and status is pending or draft)
    const { data: overdueInvoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("*")
      .lt("due_date", today)
      .in("status", ["pending", "draft"])
      .order("due_date", { ascending: true });

    if (invoicesError) {
      console.error("Error fetching overdue invoices:", invoicesError);
      throw invoicesError;
    }

    console.log(`Found ${overdueInvoices?.length || 0} overdue invoices`);

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No overdue invoices found", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all active workflows with invoice_overdue trigger
    const { data: workflows, error: workflowsError } = await supabase
      .from("workflows")
      .select("*")
      .eq("trigger_type", "invoice_overdue")
      .eq("status", "active");

    if (workflowsError) {
      console.error("Error fetching workflows:", workflowsError);
      throw workflowsError;
    }

    console.log(`Found ${workflows?.length || 0} active invoice_overdue workflows`);

    if (!workflows || workflows.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No active invoice_overdue workflows configured", 
          overdueCount: overdueInvoices.length,
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    const results: any[] = [];

    // Process each overdue invoice
    for (const invoice of overdueInvoices) {
      // Calculate days overdue
      const dueDate = new Date(invoice.due_date);
      const todayDate = new Date(today);
      const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Find workflows for this user
      const userWorkflows = workflows.filter(w => w.user_id === invoice.user_id);

      for (const workflow of userWorkflows) {
        // Prepare trigger data with invoice details
        const triggerData = {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          client_name: invoice.client_name,
          client_email: invoice.client_email || "",
          amount: invoice.amount,
          amount_due: invoice.amount - (invoice.amount_paid || 0),
          due_date: invoice.due_date,
          days_overdue: daysOverdue,
          issue_date: invoice.issue_date,
        };

        console.log(`Triggering workflow "${workflow.name}" for invoice ${invoice.invoice_number}`);

        try {
          // Execute the workflow
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
            console.error(`Error executing workflow for invoice ${invoice.invoice_number}:`, execError);
            results.push({
              invoice_number: invoice.invoice_number,
              workflow: workflow.name,
              success: false,
              error: execError.message,
            });
          } else {
            console.log(`Workflow executed successfully for invoice ${invoice.invoice_number}`);
            results.push({
              invoice_number: invoice.invoice_number,
              workflow: workflow.name,
              success: true,
            });
            processedCount++;
          }
        } catch (execException) {
          console.error(`Exception executing workflow:`, execException);
          results.push({
            invoice_number: invoice.invoice_number,
            workflow: workflow.name,
            success: false,
            error: execException instanceof Error ? execException.message : String(execException),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} workflow executions for ${overdueInvoices.length} overdue invoices`,
        overdueCount: overdueInvoices.length,
        processed: processedCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-overdue-invoices:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
