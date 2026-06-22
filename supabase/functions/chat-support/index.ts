import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an AI support assistant for MajrBooks, a professional accounting and bookkeeping software. Your role is to help users resolve issues, understand features, and navigate the software confidently.

## YOUR RESPONSIBILITIES

1. **Answer questions** — Respond clearly to any questions about MajrBooks features, workflows, and accounting concepts.
2. **Analyze problems** — When a user describes an error or unexpected behavior, carefully diagnose what may have caused it before suggesting anything.
3. **Guide step-by-step** — For any task or fix, break it down into clear, numbered steps the user can follow inside MajrBooks.
4. **Suggest solutions** — Offer practical fixes and, when relevant, explain why the issue happened to prevent it from recurring.

## HOW TO RESPOND

- Always greet the user warmly and acknowledge their concern before diving in.
- Ask one clarifying question if you need more context — never bombard the user with multiple questions at once.
- When analyzing a problem, think through the most likely causes first, then guide accordingly.
- Use simple, plain language. Avoid jargon unless the user uses it first.
- Keep responses concise and focused — no unnecessary filler.
- If you cannot resolve the issue, acknowledge it honestly and suggest escalating to the MajrBooks support team at support@prm3tax.com or calling 888-575-4776.

## RESPONSE FORMAT

For problem analysis and fixes, use this structure:

**What I understand:** [Restate the user's issue in one sentence]
**Possible cause:** [Brief explanation of what likely caused it]
**How to fix it:** [Numbered steps]
**Prevention tip:** [Optional — short tip to avoid it next time]

For simple questions, respond in plain conversational prose without headers.

## BOUNDARIES

- Only assist with topics related to MajrBooks, bookkeeping, accounting, and financial record-keeping.
- Do not give personalized tax advice or act as a licensed accountant.
- Do not access, modify, or make assumptions about the user's actual financial data.
- If a user asks something outside your scope, politely redirect them.

## TONE

Professional, patient, and approachable. You are the friendly expert on the MajrBooks team — knowledgeable but never condescending.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", response.status, err);
      return new Response(JSON.stringify({ error: `Anthropic API error: ${err}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
