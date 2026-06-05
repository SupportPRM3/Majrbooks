import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  teamMemberId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  inviterName: string;
  businessName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing team invite request...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { teamMemberId, email, firstName, lastName, role, inviterName, businessName }: InviteRequest = await req.json();

    console.log(`Sending invite to ${email} for role: ${role}`);

    // Generate invite token
    const inviteToken = crypto.randomUUID();
    // Always use the published URL for email assets to ensure they load correctly
    const baseUrl = "https://pocket-fin-auto.lovable.app";
    const inviteUrl = `${baseUrl}/accept-invite?token=${inviteToken}`;
    const logoUrl = `${baseUrl}/majr-books-logo-email.png`;

    // Update team member with invite token
    const { error: updateError } = await supabase
      .from('team_members')
      .update({
        invite_token: inviteToken,
        invite_sent_at: new Date().toISOString()
      })
      .eq('id', teamMemberId);

    if (updateError) {
      console.error("Error updating team member:", updateError);
      throw new Error(`Failed to update team member: ${updateError.message}`);
    }

    // Send invite email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your MAJRBooks Access Has Been Activated</title>
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a;">
          <div style="background: linear-gradient(135deg, #152238 0%, #1a2d47 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; border: 1px solid #2a3f5f; border-bottom: none;">
            <h1 style="color: #00c978; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">MAJRBooks</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">System Notification</p>
          </div>
          
          <div style="background: linear-gradient(180deg, #1a2d47 0%, #1e3a5f 100%); padding: 35px; border: 1px solid #2a3f5f; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Hello ${firstName} ${lastName},</h2>
            
            <p style="color: #e2e8f0; margin-bottom: 20px;">Great news! You have been granted access to <strong style="color: #00c978;">MAJRBooks</strong> by <strong style="color: #ffffff;">${businessName}</strong>.</p>
            
            <div style="background: rgba(0, 201, 120, 0.1); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #00c978;">
              <p style="margin: 0; color: #e2e8f0; font-size: 15px;">
                <strong style="color: #00c978;">✓ Your access is now active</strong><br>
                <span style="color: #cbd5e1;">No payment, subscription setup, or trial activation is required from you. Your access is fully managed by ${businessName}.</span>
              </p>
            </div>
            
            <p style="color: #e2e8f0; margin-bottom: 10px;">Your account details:</p>
            
            <div style="background: rgba(255, 255, 255, 0.05); padding: 18px; border-radius: 8px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #94a3b8; padding: 5px 0; font-size: 14px;">Employee Name:</td>
                  <td style="color: #ffffff; padding: 5px 0; font-size: 14px; text-align: right; font-weight: 600;">${firstName} ${lastName}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 5px 0; font-size: 14px;">Company:</td>
                  <td style="color: #ffffff; padding: 5px 0; font-size: 14px; text-align: right; font-weight: 600;">${businessName}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 5px 0; font-size: 14px;">Role:</td>
                  <td style="color: #00c978; padding: 5px 0; font-size: 14px; text-align: right; font-weight: 600;">${role}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 5px 0; font-size: 14px;">Status:</td>
                  <td style="color: #00c978; padding: 5px 0; font-size: 14px; text-align: right; font-weight: 600;">Active</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #e2e8f0; margin-bottom: 10px;">To complete your account setup and begin using MAJRBooks, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="background: linear-gradient(135deg, #00c978 0%, #00a866 100%); color: #ffffff; padding: 16px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 201, 120, 0.3);">Set Up Your Account</a>
            </div>
            
            <p style="color: #cbd5e1; font-size: 15px; margin-top: 25px;">Once you complete the setup, you'll have immediate access to all the features and tools available under your assigned role.</p>
            
            <p style="color: #94a3b8; font-size: 14px; margin-top: 20px;">This invitation link will expire in 7 days. If you have any questions, please contact your account administrator at ${businessName}.</p>
            
            <hr style="border: none; border-top: 1px solid #2a3f5f; margin: 35px 0 25px 0;">
            
            <div style="text-align: center;">
              <img src="${logoUrl}" alt="MAJRBooks Logo" style="width: 140px; height: auto; margin-bottom: 15px; opacity: 0.9;" />
              <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">
                MAJRBooks System Notification
              </p>
              <p style="color: #64748b; font-size: 11px; margin: 0;">
                This is an automated message. If you did not expect this email, you can safely ignore it.<br>
                © ${new Date().getFullYear()} MAJRBooks. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'MAJRBooks <support@majrtaxsoftware.com>',
      to: [email],
      subject: `Your MAJRBooks Access Has Been Activated - ${businessName}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    // Log the invite for audit purposes
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase.from('audit_logs').insert({
          owner_id: user.id,
          user_id: user.id,
          team_member_id: teamMemberId,
          action: 'invite_sent',
          entity_type: 'team_member',
          entity_id: teamMemberId,
          details: { email, role, firstName, lastName }
        });
      }
    }

    console.log("Invite sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        emailId: emailData?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-team-invite:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
