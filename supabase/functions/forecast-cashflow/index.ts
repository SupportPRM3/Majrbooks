import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HistoricalData {
  month: string;
  inflow: number;
  outflow: number;
  netChange: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { historicalData, monthsToForecast } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare context for AI
    const historicalSummary = historicalData.map((d: HistoricalData) => 
      `${d.month}: Inflow $${d.inflow.toFixed(2)}, Outflow $${d.outflow.toFixed(2)}, Net $${d.netChange.toFixed(2)}`
    ).join("\n");

    const prompt = `Based on the following historical cash flow data, forecast the next ${monthsToForecast} months of cash flow.

Historical Data:
${historicalSummary}

Analyze trends, seasonality, and patterns to provide realistic forecasts. Return your forecast as a JSON array with this structure:
[
  {
    "month": "2025-12",
    "inflow": 50000,
    "outflow": 35000,
    "netChange": 15000,
    "confidence": "high"
  }
]

Consider:
- Growth trends in inflows/outflows
- Seasonal patterns
- Average growth rates
- Consistency of cash flows

Return ONLY the JSON array, no other text.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a financial forecasting expert. Analyze historical cash flow data and provide accurate forecasts."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const forecastText = aiData.choices[0].message.content;

    // Extract JSON from response
    let forecast;
    try {
      const jsonMatch = forecastText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        forecast = JSON.parse(jsonMatch[0]);
      } else {
        forecast = JSON.parse(forecastText);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", forecastText);
      throw new Error("Failed to parse forecast data");
    }

    return new Response(JSON.stringify({ forecast }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Forecast error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
