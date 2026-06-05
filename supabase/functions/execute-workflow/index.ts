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
    const { workflowId, triggerData } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Authenticated user:", user.id);

    // Fetch workflow with ownership verification
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("user_id", user.id)
      .single();

    if (workflowError || !workflow) {
      throw new Error("Workflow not found");
    }

    if (workflow.status !== "active") {
      return new Response(
        JSON.stringify({ success: false, message: "Workflow is not active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Executing workflow:", workflow.name);
    console.log("Action type:", workflow.action_type);
    console.log("Trigger data:", triggerData);

    let success = false;
    let errorMessage = "";

    try {
      // Execute action based on action_type
      if (workflow.action_type === "send_email") {
        const actionConfig = workflow.action_config as any;
        let emailTo = actionConfig.email_to;
        let emailSubject = actionConfig.email_subject;
        let emailBody = actionConfig.email_body;

        // Sanitization functions to prevent injection attacks
        const sanitizeForEmail = (value: string): string => {
          // Remove newlines, carriage returns, and control characters that could inject headers
          return String(value || "").replace(/[\r\n\t\x00-\x1f]/g, "").trim();
        };

        const sanitizeForSubject = (value: string): string => {
          // Remove newlines and control characters, replace with spaces
          return String(value || "").replace(/[\r\n\t\x00-\x1f]/g, " ").trim();
        };

        const sanitizeForHtmlBody = (value: string): string => {
          // HTML escape to prevent XSS in email clients
          return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };

        // Email validation regex
        const isValidEmail = (email: string): boolean => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        };

        // Replace variables in email fields with proper sanitization
        if (triggerData) {
          const replaceVars = (text: string, sanitizer: (v: string) => string) => {
            let result = text;
            Object.keys(triggerData).forEach((key) => {
              const sanitizedValue = sanitizer(triggerData[key] || "");
              result = result.replace(
                new RegExp(`\\{${key}\\}`, "g"),
                sanitizedValue
              );
            });
            return result;
          };

          emailTo = replaceVars(emailTo, sanitizeForEmail);
          emailSubject = replaceVars(emailSubject, sanitizeForSubject);
          emailBody = replaceVars(emailBody, sanitizeForHtmlBody);
        }

        // Validate email address after variable substitution
        if (!isValidEmail(emailTo)) {
          throw new Error("Invalid email address after variable substitution");
        }

        // Apply length limits to prevent abuse
        if (emailSubject.length > 500) {
          throw new Error("Email subject too long");
        }
        if (emailBody.length > 50000) {
          throw new Error("Email body too long");
        }

        console.log("Sending email to:", emailTo);

        // Call send-invoice edge function or similar email service
        const { error: emailError } = await supabase.functions.invoke(
          "send-invoice",
          {
            body: {
              to: emailTo,
              subject: emailSubject,
              html: emailBody.replace(/\n/g, "<br>"),
            },
          }
        );

        if (emailError) {
          throw emailError;
        }

        success = true;
      } else if (workflow.action_type === "send_notification") {
        // Implement notification logic here
        console.log("Sending notification");
        success = true;
      } else if (workflow.action_type === "update_status") {
        // Implement status update logic here
        console.log("Updating status");
        success = true;
      }
    } catch (actionError) {
      console.error("Action execution error:", actionError);
      errorMessage = actionError instanceof Error ? actionError.message : String(actionError);
      success = false;
    }

    const now = new Date().toISOString();

    // Record workflow execution history
    try {
      const { error: historyError } = await supabase
        .from("workflow_execution_history")
        .insert({
          workflow_id: workflowId,
          user_id: workflow.user_id,
          executed_at: now,
          trigger_data: triggerData || {},
          action_result: { action_type: workflow.action_type },
          status: success ? "success" : "failure",
          error_message: success ? null : errorMessage,
        });

      if (historyError) {
        console.error("Error recording workflow history:", historyError);
      }
    } catch (historyException) {
      console.error("Unexpected error recording workflow history:", historyException);
    }

    // Update workflow statistics
    const today = new Date().toISOString().split("T")[0];
    const lastRunDate = workflow.last_run_at
      ? new Date(workflow.last_run_at).toISOString().split("T")[0]
      : null;

    const runsToday = today === lastRunDate ? workflow.runs_today + 1 : 1;

    await supabase
      .from("workflows")
      .update({
        last_run_at: now,
        total_runs: workflow.total_runs + 1,
        success_count: success ? workflow.success_count + 1 : workflow.success_count,
        failure_count: success ? workflow.failure_count : workflow.failure_count + 1,
        runs_today: runsToday,
      })
      .eq("id", workflowId);

    return new Response(
      JSON.stringify({
        success,
        message: success ? "Workflow executed successfully" : `Workflow failed: ${errorMessage}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error executing workflow:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
