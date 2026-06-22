import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a U.S. tax preparation assistant specializing in Schedule C (Form 1040).

You will receive bank statement transaction data (text, CSV, or a PDF bank statement). Your job is to:

1. Extract every transaction you can find.
2. Separate BUSINESS INCOME from EXPENSES.
3. Categorize each expense using these IRS Schedule C categories:
   - Advertising & Marketing
   - Car and Truck Expenses
   - Contract Labor
   - Commissions and Fees
   - Insurance (not health)
   - Legal and Professional Services
   - Office Expenses
   - Rent or Lease
   - Repairs and Maintenance
   - Supplies
   - Taxes and Licenses
   - Travel
   - Meals (50% deductible)
   - Utilities
   - Wages
   - Software / Subscriptions
   - Bank Fees
   - Other Expenses
4. Mark unclear items as "Needs Review".
5. Flag Amazon, Walmart, or large retail purchases for review.
6. Treat deposits as potential income unless clearly transfers.
7. Identify recurring subscriptions separately.

You MUST respond with valid JSON using this exact structure (no markdown, no code fences):
{
  "summary": {
    "total_income": 0,
    "expense_totals": { "category_name": 0 },
    "total_expenses": 0,
    "net_profit": 0
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "...",
      "amount": 0,
      "category": "...",
      "type": "income",
      "notes": "..."
    }
  ],
  "flagged_items": [
    {
      "date": "YYYY-MM-DD",
      "description": "...",
      "amount": 0,
      "reason": "..."
    }
  ],
  "recurring_subscriptions": [
    {
      "description": "...",
      "amount": 0,
      "frequency": "monthly",
      "category": "..."
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const { transactions_text, client_name, pdf_files } = await req.json();

    const hasPdfs = Array.isArray(pdf_files) && pdf_files.length > 0;
    const hasText = transactions_text && transactions_text.trim();

    if (!hasText && !hasPdfs) throw new Error("No transaction data provided");

    // Build message content for the Lovable/Gemini gateway
    const userContent: any[] = [];

    let textPart = client_name ? `Client: ${client_name}\n\n` : "";
    if (hasText) {
      textPart += `Bank Statement Transactions:\n\n${transactions_text}`;
    }
    if (hasPdfs) {
      textPart += hasPdfs
        ? `\n\nPlease extract ALL transactions from the attached PDF bank statement(s) and categorize them into Schedule C categories.`
        : "";
    }

    userContent.push({ type: "text", text: textPart });

    // Add PDFs as inline file data (Gemini via Lovable gateway format)
    if (hasPdfs) {
      for (const pdf of pdf_files) {
        userContent.push({
          type: "file",
          file: {
            filename: "bank_statement.pdf",
            file_data: `data:application/pdf;base64,${pdf.base64}`,
          },
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 8192,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("Lovable AI gateway error:", status, text);
      if (status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
      if (status === 402) throw new Error("AI credits depleted. Please add credits to your Lovable account.");
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    // Strip markdown fences if present
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("schedule-c-analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
