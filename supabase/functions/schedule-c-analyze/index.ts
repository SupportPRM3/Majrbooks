import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are a U.S. tax preparation assistant specializing in Schedule C (Form 1040).

You will receive bank statement transaction data (text, CSV, or images of PDF bank statements). Your job is to:

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
      "type": "income" | "expense" | "personal" | "needs_review",
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
      "frequency": "monthly" | "annual",
      "category": "..."
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { transactions_text, client_name, pdf_files } = await req.json();
    
    const hasPdfs = Array.isArray(pdf_files) && pdf_files.length > 0;
    const hasText = transactions_text && transactions_text.trim();
    
    if (!hasText && !hasPdfs) throw new Error("No transaction data provided");

    // Build user message content - multimodal if PDFs present
    const userContent: any[] = [];

    // Add text instructions
    let textPart = client_name ? `Client: ${client_name}\n\n` : "";
    
    if (hasText) {
      textPart += `Bank Statement Transactions:\n\n${transactions_text}`;
    }
    
    if (hasPdfs) {
      textPart += `\n\nI am also providing ${pdf_files.length} PDF bank statement(s) as images. Please extract ALL transactions from these documents and categorize them.`;
    }

    userContent.push({ type: "text", text: textPart });

    // Add PDF files as base64 images for vision processing
    if (hasPdfs) {
      for (const pdf of pdf_files) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:application/pdf;base64,${pdf.base64}`,
          },
        });
      }
    }

    // Use vision-capable model for PDFs
    const model = hasPdfs ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash";

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // If multimodal content, use content array format; otherwise plain string
    if (hasPdfs) {
      messages.push({ role: "user", content: userContent });
    } else {
      messages.push({ role: "user", content: textPart });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No response from AI");

    // Parse JSON from the response, stripping markdown fences if present
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
