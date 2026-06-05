import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, accountId } = await req.json();

    if (!fileUrl || !accountId) {
      return new Response(
        JSON.stringify({ error: "Missing fileUrl or accountId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing bank statement PDF for account:", accountId);

    // Fetch the PDF and convert to base64
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64Data = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:application/pdf;base64,${base64Data}`;

    console.log("File size:", arrayBuffer.byteLength, "bytes");

    // Call Lovable AI with vision capability to analyze the bank statement
    // PDFs must be sent as inline_data with proper mime_type, not as image_url
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert bank statement analyzer for a bookkeeping system. Analyze bank statement PDFs and extract ALL transactions accurately.

IMPORTANT: You MUST extract every single transaction visible in the bank statement. Do not skip any transactions.

For each transaction, extract:
1. Transaction date (in YYYY-MM-DD format) - REQUIRED
2. Description/Merchant name - REQUIRED
3. Amount (as a positive number) - REQUIRED
4. Transaction type: 'debit' for withdrawals/payments/expenses/negative amounts, 'credit' for deposits/income/positive amounts - REQUIRED
5. Reference number if available
6. Category: Office Supplies, Travel, Meals & Entertainment, Utilities, Marketing, Professional Services, Equipment, Subscriptions, Payroll, Transfer, Interest, Fee, or Other

Determination rules:
- Withdrawals, payments, purchases, fees, negative amounts = 'debit'
- Deposits, credits, refunds, income, positive amounts = 'credit'

If the document appears to be a bank statement, extract ALL transactions even if some fields are unclear. Make your best guess for unclear fields rather than skipping transactions.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this bank statement PDF and extract ALL transactions. This is a bank statement document - look for the transaction list/table and extract every transaction row. Use the extract_bank_transactions function to return the data."
              },
              {
                type: "file",
                file: {
                  filename: "bank_statement.pdf",
                  file_data: `data:application/pdf;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_bank_transactions",
              description: "Extract all transactions from a bank statement",
              parameters: {
                type: "object",
                properties: {
                  bank_name: {
                    type: "string",
                    description: "Name of the bank"
                  },
                  account_number_last4: {
                    type: "string",
                    description: "Last 4 digits of account number if visible"
                  },
                  statement_period: {
                    type: "object",
                    properties: {
                      start_date: { type: "string", description: "Period start date in YYYY-MM-DD" },
                      end_date: { type: "string", description: "Period end date in YYYY-MM-DD" }
                    }
                  },
                  transactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: {
                          type: "string",
                          description: "Transaction date in YYYY-MM-DD format"
                        },
                        description: {
                          type: "string",
                          description: "Transaction description or merchant name"
                        },
                        amount: {
                          type: "number",
                          description: "Transaction amount (positive value)"
                        },
                        transaction_type: {
                          type: "string",
                          enum: ["debit", "credit"],
                          description: "Type of transaction"
                        },
                        reference_number: {
                          type: "string",
                          description: "Reference or check number if available"
                        },
                        category: {
                          type: "string",
                          enum: ["Office Supplies", "Travel", "Meals & Entertainment", "Utilities", "Marketing", "Professional Services", "Equipment", "Subscriptions", "Payroll", "Transfer", "Interest", "Fee", "Other"],
                          description: "Expense/income category"
                        }
                      },
                      required: ["date", "description", "amount", "transaction_type"]
                    }
                  },
                  opening_balance: {
                    type: "number",
                    description: "Opening balance if visible"
                  },
                  closing_balance: {
                    type: "number",
                    description: "Closing balance if visible"
                  }
                },
                required: ["transactions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_bank_transactions" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response received");

    // Extract the tool call result
    let extractedData = null;
    const toolCalls = aiData.choices?.[0]?.message?.tool_calls;
    
    if (toolCalls && toolCalls.length > 0) {
      const functionCall = toolCalls[0].function;
      if (functionCall.name === "extract_bank_transactions") {
        extractedData = JSON.parse(functionCall.arguments);
      }
    }

    if (!extractedData || !extractedData.transactions || extractedData.transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No transactions found in the bank statement",
          rawResponse: aiData 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted ${extractedData.transactions.length} transactions`);

    // Prepare transactions for database insert
    const dbTransactions = extractedData.transactions.map((txn: any) => ({
      user_id: user.id,
      account_id: accountId,
      transaction_date: txn.date,
      description: txn.description,
      amount: Math.abs(txn.amount),
      transaction_type: txn.transaction_type,
      reference_number: txn.reference_number || null,
      category: txn.category || 'Other',
      is_reconciled: false,
    }));

    // Insert transactions into database
    const { data: insertedData, error: insertError } = await supabase
      .from("bank_transactions")
      .insert(dbTransactions)
      .select();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          bank_name: extractedData.bank_name,
          statement_period: extractedData.statement_period,
          opening_balance: extractedData.opening_balance,
          closing_balance: extractedData.closing_balance,
          transactions_count: insertedData?.length || 0,
          transactions: insertedData
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing bank statement:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
