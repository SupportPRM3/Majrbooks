import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timeEntryId, action, notes } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get time entry details with employee information
    const { data: timeEntry, error: entryError } = await supabase
      .from('time_entries')
      .select(`
        *,
        employees:employee_id (
          first_name,
          last_name,
          email,
          user_id
        ),
        projects:project_id (
          name
        )
      `)
      .eq('id', timeEntryId)
      .single();

    if (entryError) {
      console.error('Error fetching time entry:', entryError);
      throw entryError;
    }

    // Get the manager who performed the action
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: manager } } = await supabase.auth.getUser(token);

    const { data: managerProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', manager?.id)
      .single();

    // Log the notification (in production, you would send an actual email here)
    console.log('Time Entry Notification:', {
      action,
      employeeEmail: timeEntry.employees.email,
      employeeName: `${timeEntry.employees.first_name} ${timeEntry.employees.last_name}`,
      managerName: managerProfile?.full_name || 'Manager',
      timeEntryDate: timeEntry.entry_date,
      hours: timeEntry.total_hours,
      project: timeEntry.projects?.name || 'No project',
      notes: notes || 'None',
    });

    // In a production environment, you would integrate with an email service here
    // For example, using Resend, SendGrid, AWS SES, etc.
    
    // Example email content:
    const emailSubject = action === 'approved' 
      ? `Time Entry Approved - ${timeEntry.entry_date}`
      : `Time Entry Rejected - ${timeEntry.entry_date}`;

    const emailBody = `
      Hello ${timeEntry.employees.first_name},

      Your time entry for ${new Date(timeEntry.entry_date).toLocaleDateString()} has been ${action}.

      Details:
      - Hours: ${timeEntry.total_hours}
      - Project: ${timeEntry.projects?.name || 'No project'}
      - Reviewed by: ${managerProfile?.full_name || 'Manager'}
      ${notes ? `- Notes: ${notes}` : ''}

      ${action === 'rejected' ? 'Please review and resubmit your time entry with the necessary corrections.' : 'No further action is required.'}

      Best regards,
      Payroll Team
    `;

    console.log('Email to send:', {
      to: timeEntry.employees.email,
      subject: emailSubject,
      body: emailBody
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification logged successfully',
        notification: {
          to: timeEntry.employees.email,
          subject: emailSubject,
          action: action
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-time-entry-notification:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});