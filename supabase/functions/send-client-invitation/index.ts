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
    // NOTE: `req.url` is the backend function URL, which does NOT host web assets.
    const appBaseUrl = "https://pocket-fin-auto.lovable.app";

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

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>You're Invited to MAJR Books</title>
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: #ffffff; padding: 40px 30px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <!-- Logo Header -->
            <div style="margin-bottom: 30px;">
              <img src="${logoSrc}" alt="MAJR Books Logo" style="display:block; border:0; outline:none; text-decoration:none; width: 200px; height: auto; margin: 0 auto 10px auto;" />
              <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">Accounting & Financial Management</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 30px 0;">
            
            <!-- Main Content -->
            <div style="text-align: left;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Hello ${clientName},</h2>
              
              <p style="color: #475569; margin-bottom: 20px;">You're invited to create your secure client account on <strong style="color: #00c978;">MAJR Books</strong>, our accounting and financial management platform designed to streamline collaboration and keep your information organized in one place.</p>
              
              <p style="color: #475569; margin-bottom: 10px;">By signing up, you'll be able to:</p>
              
              <ul style="color: #64748b; padding-left: 20px; margin-bottom: 25px;">
                <li style="margin-bottom: 8px;">Securely upload and manage financial documents</li>
                <li style="margin-bottom: 8px;">Complete onboarding and profile information</li>
                <li style="margin-bottom: 8px;">Communicate and collaborate with our team more efficiently</li>
                <li style="margin-bottom: 8px;">Stay informed with real-time updates related to your account</li>
              </ul>
              
              ${message ? `<div style="background: rgba(0, 201, 120, 0.1); padding: 18px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #00c978;"><p style="margin: 0; font-style: italic; color: #475569;">"${message}"</p></div>` : ''}
              
              <p style="color: #475569; margin-bottom: 10px;">To get started, please click the button below to create your account:</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" bgcolor="#00c978" style="background-color: #00c978; border-radius: 8px; padding: 0;">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 16px 35px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #00c978;">Create Your Account</a>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: left;">
              <p style="color: #64748b; font-size: 15px; margin-top: 25px;">The sign-up process is quick and secure. Once completed, you'll have immediate access to your client portal.</p>
              
              <p style="color: #64748b; font-size: 15px;">If you have any questions or need assistance during signup, feel free to reply to this email and our team will be happy to help.</p>
              
              <p style="color: #475569; margin-top: 25px;">We look forward to supporting you and working with you through MAJR Books.</p>
              
              <p style="color: #475569; margin-top: 30px; margin-bottom: 5px;">Best regards,</p>
              <p style="color: #1e293b; font-weight: 600; margin-top: 0;">MAJR Books</p>
              <p style="color: #64748b; font-size: 14px; margin-top: 5px;">support@majrtaxsoftware.com</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 35px 0 25px 0;">
            
            <div style="text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                This invitation was sent from MAJR Books<br>
                © ${new Date().getFullYear()} MAJR Books. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Majr Books <support@majrtaxsoftware.com>',
      to: [clientEmail],
      subject: `${senderName} has invited you to connect on Majr Books`,
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
