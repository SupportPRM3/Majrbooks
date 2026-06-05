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

// Detect MIME type from file extension or content
function getMimeType(url: string, contentType?: string): string {
  if (contentType && contentType !== 'application/octet-stream') {
    return contentType;
  }
  
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { receiptId, imageUrl } = await req.json();

    if (!receiptId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing receiptId or imageUrl" }),
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

    console.log("Analyzing receipt:", receiptId);
    console.log("Image URL:", imageUrl);

    // Fetch the file and convert to base64 for proper handling
    // This is required for PDFs and ensures consistent handling for all file types
    const fileResponse = await fetch(imageUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }

    const contentType = fileResponse.headers.get('content-type') || '';
    const mimeType = getMimeType(imageUrl, contentType);
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64Data = arrayBufferToBase64(arrayBuffer);
    
    console.log("File MIME type:", mimeType);
    console.log("File size:", arrayBuffer.byteLength, "bytes");

    // Build the image content based on file type
    // For PDFs and all files, use data URL format for reliable processing
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Call Lovable AI with vision capability to analyze the receipt
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
            content: `You are an expert receipt and financial document analyzer for a bookkeeping system. Analyze receipt images, invoices, and financial documents to extract structured data accurately.
            
Your task is to identify and extract:
1. Merchant/Store/Company name
2. Transaction date (in YYYY-MM-DD format)
3. Total amount (numeric value only, no currency symbols)
4. Tax amount if visible (numeric value only)
5. Payment method (cash, credit card, debit card, etc.)
6. Expense category (one of: Office Supplies, Travel, Meals & Entertainment, Utilities, Marketing, Professional Services, Equipment, Subscriptions, Other)

For balance sheets or financial statements, extract:
- The company name as merchant_name
- The document date or period end date as transaction_date
- The total assets or significant total as total_amount
- Category should be "Financial Statement"

Be precise with numbers. If you can't identify a field, use null.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this receipt or financial document and extract the key details. Return your analysis as a JSON object with these fields: merchant_name, transaction_date, total_amount, tax_amount, payment_method, category, confidence (0-1 score of how confident you are in the extraction)."
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt_data",
              description: "Extract structured data from a receipt image or financial document",
              parameters: {
                type: "object",
                properties: {
                  merchant_name: {
                    type: "string",
                    description: "Name of the merchant, store, or company"
                  },
                  transaction_date: {
                    type: "string",
                    description: "Date of the transaction or document in YYYY-MM-DD format"
                  },
                  total_amount: {
                    type: "number",
                    description: "Total amount of the receipt or significant total from the document"
                  },
                  tax_amount: {
                    type: "number",
                    description: "Tax amount if visible on the receipt"
                  },
                  payment_method: {
                    type: "string",
                    enum: ["cash", "credit_card", "debit_card", "check", "digital_wallet", "bank_transfer", "unknown"],
                    description: "Method of payment used"
                  },
                  category: {
                    type: "string",
                    enum: ["Office Supplies", "Travel", "Meals & Entertainment", "Utilities", "Marketing", "Professional Services", "Equipment", "Subscriptions", "Financial Statement", "Other"],
                    description: "Expense category based on the items purchased or document type"
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score between 0 and 1"
                  }
                },
                required: ["merchant_name", "total_amount", "category", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      // Update receipt status to failed
      await supabase
        .from("receipts")
        .update({
          status: "failed",
          ai_processed_at: new Date().toISOString(),
          raw_ai_response: { error: errorText, status: aiResponse.status }
        })
        .eq("id", receiptId);
      
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
    console.log("AI Response:", JSON.stringify(aiData));

    // Extract the tool call result
    let extractedData = null;
    const toolCalls = aiData.choices?.[0]?.message?.tool_calls;
    
    if (toolCalls && toolCalls.length > 0) {
      const functionCall = toolCalls[0].function;
      if (functionCall.name === "extract_receipt_data") {
        extractedData = JSON.parse(functionCall.arguments);
      }
    }

    if (!extractedData) {
      // Fallback: try to parse from content if tool call didn't work
      const content = aiData.choices?.[0]?.message?.content;
      if (content) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error("Failed to parse AI response:", e);
        }
      }
    }

    if (!extractedData) {
      // Update receipt status to failed
      await supabase
        .from("receipts")
        .update({
          status: "failed",
          ai_processed_at: new Date().toISOString(),
          raw_ai_response: aiData
        })
        .eq("id", receiptId);

      return new Response(
        JSON.stringify({ error: "Failed to extract receipt data", rawResponse: aiData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracted data:", extractedData);

    // Update the receipt record with extracted data
    const { error: updateError } = await supabase
      .from("receipts")
      .update({
        merchant_name: extractedData.merchant_name,
        amount: extractedData.total_amount,
        tax_amount: extractedData.tax_amount,
        receipt_date: extractedData.transaction_date,
        payment_method: extractedData.payment_method,
        category: extractedData.category,
        ai_confidence: extractedData.confidence,
        ai_processed_at: new Date().toISOString(),
        raw_ai_response: aiData,
        status: "processed",
        description: `${extractedData.merchant_name || "Unknown"} - ${extractedData.category || "Expense"}`
      })
      .eq("id", receiptId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing receipt:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
