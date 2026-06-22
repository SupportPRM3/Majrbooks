import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  clientName: string;
  clientEmail: string;
  firmId: string;
  inviteToken?: string;
  message?: string;
  senderName: string;
  senderEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing client invitation request...");

    const resendApiKey = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Quick sanity check to catch copy/paste issues (whitespace, wrong key type, etc.)
    if (!resendApiKey.startsWith("re_")) {
      console.error("RESEND_API_KEY appears to be invalid format", {
        length: resendApiKey.length,
        prefix: resendApiKey.slice(0, 3),
      });
      throw new Error(
        "RESEND_API_KEY appears invalid. Please update it in backend secrets (it should start with 're_').",
      );
    }

    const resend = new Resend(resendApiKey);

    const { clientName, clientEmail, firmId, inviteToken, message, senderName, senderEmail }: InvitationRequest = await req.json();

    console.log(`Sending invitation to ${clientEmail} from ${senderName}`);

    // Always use the published app URL for email links & assets.
    const appBaseUrl = "https://majrbooks.com";

    // Use token-based URL if token provided, otherwise fall back to firm-based
    const inviteUrl = inviteToken
      ? `${appBaseUrl}/accept-client-invite?token=${inviteToken}`
      : `${appBaseUrl}/accept-client-invite?firm=${firmId}`;

    // Prefer embedding the logo in the email itself (CID) for maximum compatibility.
    // Some email clients block or fail to load remote images, which can appear as a broken logo.
    const toBase64 = (bytes: Uint8Array) => {
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      return btoa(binary);
    };

    let attachments:
      | {
          filename: string;
          content: string; // base64
          contentType?: string;
          content_id?: string;
        }[]
      | undefined;

    let logoSrc = `${appBaseUrl}/majr-books-logo-email.png?v=3`; // fallback (remote)
    try {
      const logoResponse = await fetch(`${appBaseUrl}/majr-books-logo-email.png`, {
        cache: "no-store",
      });

      if (logoResponse.ok) {
        const bytes = new Uint8Array(await logoResponse.arrayBuffer());
        const base64 = toBase64(bytes);

        attachments = [
          {
            filename: "majr-books-logo-email.png",
            content: base64,
            contentType: "image/png",
            content_id: "majr-logo",
          },
        ];

        logoSrc = "cid:majr-logo";
      } else {
        console.warn("Logo fetch failed, falling back to remote URL", {
          status: logoResponse.status,
        });
      }
    } catch (e) {
      console.warn("Logo fetch error, falling back to remote URL", {
        error: String(e),
      });
    }

    const currentYear = new Date().getFullYear();
    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Invited to MAJR Books</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header with logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,#4f46e5 100%);padding:36px 40px;text-align:center;">
              <img src="${logoSrc}" alt="MAJR Books" width="180" style="display:block;margin:0 auto 12px;height:auto;border:0;" />
              <p style="margin:0;color:#c7d2fe;font-size:13px;letter-spacing:0.5px;">Smart Bookkeeping Made Simple</p>
            </td>
          </tr>

          <!-- Greeting banner -->
          <tr>
            <td style="background:#4f46e5;padding:18px 40px;text-align:center;">
              <p style="margin:0;color:#e0e7ff;font-size:15px;font-weight:600;">🎉 &nbsp;You've been invited to join MAJR Books</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 20px;color:#1e1b4b;font-size:22px;font-weight:700;">Hello ${clientName},</h2>

              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">
                <strong>${senderName}</strong> has invited you to access your secure client portal on
                <strong style="color:#4f46e5;">MAJR Books</strong> — a professional bookkeeping and financial management platform built for you.
              </p>

              ${message ? `
              <div style="background:#f0f0ff;border-left:4px solid #4f46e5;border-radius:6px;padding:16px 20px;margin:24px 0;">
                <p style="margin:0;color:#3730a3;font-size:14px;font-style:italic;">"${message}"</p>
                <p style="margin:8px 0 0;color:#6366f1;font-size:13px;font-weight:600;">— ${senderName}</p>
              </div>` : ''}

              <p style="margin:0 0 12px;color:#334155;font-size:15px;font-weight:600;">With your client portal you can:</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                <tr><td style="padding:6px 0;color:#475569;font-size:14px;">✅ &nbsp;View and download your invoices</td></tr>
                <tr><td style="padding:6px 0;color:#475569;font-size:14px;">✅ &nbsp;Upload and manage financial documents securely</td></tr>
                <tr><td style="padding:6px 0;color:#475569;font-size:14px;">✅ &nbsp;Complete your onboarding profile</td></tr>
                <tr><td style="padding:6px 0;color:#475569;font-size:14px;">✅ &nbsp;Communicate directly with your bookkeeping team</td></tr>
                <tr><td style="padding:6px 0;color:#475569;font-size:14px;">✅ &nbsp;Access AI-powered bookkeeping assistance</td></tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank"
                       style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:10px;letter-spacing:0.3px;">
                      Accept Invitation &amp; Create Account
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-align:center;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 28px;color:#6366f1;font-size:12px;text-align:center;word-break:break-all;">
                ${inviteUrl}
              </p>

              <p style="margin:0 0 6px;color:#64748b;font-size:14px;line-height:1.6;">
                This invitation was sent by your bookkeeping team at PRM3 Tax. If you have any questions, contact us at
                <a href="mailto:support@prm3tax.com" style="color:#4f46e5;text-decoration:none;">support@prm3tax.com</a> or call <strong>888-575-4776</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">
                © ${currentYear} MAJR Books by PRM3 Tax &nbsp;|&nbsp;
                <a href="https://majrbooks.com" style="color:#6366f1;text-decoration:none;">majrbooks.com</a>
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">
                You received this because ${senderName} invited you. If this was unexpected, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;


    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'MAJR Books <support@majrtaxsoftware.com>',
      to: [clientEmail],
      subject: `${senderName} invited you to your MAJR Books client portal`,
      html: emailHtml,
      attachments,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log("Invitation email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        emailId: emailData?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-client-invitation:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
