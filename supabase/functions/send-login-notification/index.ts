import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-LOGIN-NOTIFICATION] ${step}${detailsStr}`);
};

interface LoginNotificationRequest {
  email: string;
  fullName?: string;
  eventType: 'login' | 'signup';
  userAgent?: string;
  timestamp?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, fullName, eventType, userAgent, timestamp }: LoginNotificationRequest = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }

    logStep("Processing notification", { email, eventType });

    const eventTime = timestamp || new Date().toISOString();
    const displayName = fullName || email;
    const subject = eventType === 'signup' 
      ? `New User Signup - ${displayName}` 
      : `Login Activity - ${displayName}`;

    // Send notification to company email
    const companyEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MajrBooks <support@majrtaxsoftware.com>",
        to: ["support@majrtaxsoftware.com"],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">${eventType === 'signup' ? 'New User Registration' : 'Login Activity'}</h2>
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>User:</strong> ${displayName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Event:</strong> ${eventType === 'signup' ? 'New Account Created' : 'User Logged In'}</p>
              <p><strong>Time:</strong> ${new Date(eventTime).toLocaleString()}</p>
              ${userAgent ? `<p><strong>Device:</strong> ${userAgent}</p>` : ''}
            </div>
            <p style="color: #718096; font-size: 12px;">
              This is an automated notification from MajrBooks.
            </p>
          </div>
        `,
      }),
    });

    if (!companyEmailResponse.ok) {
      const errorText = await companyEmailResponse.text();
      logStep("Failed to send company notification", { error: errorText });
    } else {
      logStep("Company notification sent successfully");
    }

    // Send welcome email to user on signup
    if (eventType === 'signup') {
      const welcomeEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "MajrBooks <support@majrtaxsoftware.com>",
          to: [email],
          subject: "Welcome to MajrBooks - Your 14-Day Free Trial Has Started!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #00C896;">Welcome to MajrBooks!</h1>
              <p>Hi ${displayName},</p>
              <p>Thank you for signing up! Your <strong>14-day free trial</strong> has started.</p>
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00C896;">
                <h3 style="margin-top: 0;">During your trial, you get full access to:</h3>
                <ul>
                  <li>Complete bookkeeping and invoicing</li>
                  <li>Payroll management</li>
                  <li>Tax preparation tools</li>
                  <li>AI-powered tax assistance</li>
                  <li>And much more!</li>
                </ul>
              </div>
              <p>After your trial ends, you can choose a plan that fits your needs.</p>
              <p>If you have any questions, feel free to reach out to us at support@majrtaxsoftware.com</p>
              <p>Best regards,<br>The MajrBooks Team</p>
            </div>
          `,
        }),
      });

      if (!welcomeEmailResponse.ok) {
        const errorText = await welcomeEmailResponse.text();
        logStep("Failed to send welcome email", { error: errorText });
      } else {
        logStep("Welcome email sent to user");
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
