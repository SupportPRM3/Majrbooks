import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringInvoice {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string | null;
  invoice_number_prefix: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_run_date: string;
  start_date: string;
  end_date: string | null;
  status: string;
  notes: string | null;
  terms: string | null;
  template_id: string | null;
  subtotal: number;
  tax: number;
  amount: number;
  auto_send: boolean;
}

interface RecurringLineItem {
  description: string;
  rate: number;
  quantity: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting recurring invoice generation...');

    // Get all active recurring invoices that are due
    const today = new Date().toISOString().split('T')[0];
    const { data: recurringInvoices, error: fetchError } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('status', 'active')
      .lte('next_run_date', today);

    if (fetchError) {
      console.error('Error fetching recurring invoices:', fetchError);
      throw fetchError;
    }

    if (!recurringInvoices || recurringInvoices.length === 0) {
      console.log('No recurring invoices due today');
      return new Response(
        JSON.stringify({ message: 'No recurring invoices due', generated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${recurringInvoices.length} recurring invoices to process`);

    let generatedCount = 0;
    const results = [];

    for (const recurring of recurringInvoices as RecurringInvoice[]) {
      try {
        // Check if end date has passed
        if (recurring.end_date && recurring.end_date < today) {
          await supabase
            .from('recurring_invoices')
            .update({ status: 'completed' })
            .eq('id', recurring.id);
          console.log(`Recurring invoice ${recurring.id} marked as completed`);
          continue;
        }

        // Get line items
        const { data: lineItems } = await supabase
          .from('recurring_invoice_line_items')
          .select('*')
          .eq('recurring_invoice_id', recurring.id);

        // Look up client_user_id from accepted invitations for secure access
        let clientUserId = null;
        if (recurring.client_email) {
          const { data: invitation } = await supabase
            .from('client_invitations')
            .select('client_user_id')
            .eq('user_id', recurring.user_id)
            .eq('client_email', recurring.client_email)
            .eq('status', 'accepted')
            .not('client_user_id', 'is', null)
            .maybeSingle();
          
          if (invitation?.client_user_id) {
            clientUserId = invitation.client_user_id;
          }
        }

        // Generate invoice number
        const invoiceNumber = `${recurring.invoice_number_prefix}-${Date.now()}`;

        // Calculate dates
        const issueDate = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateStr = dueDate.toISOString().split('T')[0];

        // Create invoice with secure client_user_id link
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            user_id: recurring.user_id,
            client_name: recurring.client_name,
            client_email: recurring.client_email,
            client_user_id: clientUserId, // Secure link to client's auth account
            invoice_number: invoiceNumber,
            issue_date: issueDate,
            due_date: dueDateStr,
            status: 'draft',
            notes: recurring.notes,
            terms: recurring.terms,
            template_id: recurring.template_id,
            amount: recurring.amount,
            subtotal: recurring.subtotal,
            tax: recurring.tax,
          })
          .select()
          .single();

        if (invoiceError) {
          console.error(`Error creating invoice for ${recurring.id}:`, invoiceError);
          results.push({ recurring_id: recurring.id, success: false, error: invoiceError.message });
          continue;
        }

        console.log(`Created invoice ${newInvoice.id} for recurring ${recurring.id}`);

        // Create line items
        if (lineItems && lineItems.length > 0) {
          const invoiceLineItems = lineItems.map((item: RecurringLineItem) => ({
            invoice_id: newInvoice.id,
            description: item.description,
            rate: item.rate,
            quantity: item.quantity,
          }));

          const { error: lineItemsError } = await supabase
            .from('invoice_line_items')
            .insert(invoiceLineItems);

          if (lineItemsError) {
            console.error(`Error creating line items:`, lineItemsError);
          }
        }

        // Send invoice if auto_send is enabled
        if (recurring.auto_send && recurring.client_email) {
          try {
            await supabase.functions.invoke('send-invoice', {
              body: { invoiceId: newInvoice.id },
            });
            console.log(`Sent invoice ${newInvoice.id} to ${recurring.client_email}`);
          } catch (sendError) {
            console.error(`Error sending invoice:`, sendError);
          }
        }

        // Calculate next run date
        const nextRunDate = new Date(recurring.next_run_date);
        switch (recurring.frequency) {
          case 'weekly':
            nextRunDate.setDate(nextRunDate.getDate() + 7);
            break;
          case 'monthly':
            nextRunDate.setMonth(nextRunDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextRunDate.setMonth(nextRunDate.getMonth() + 3);
            break;
          case 'yearly':
            nextRunDate.setFullYear(nextRunDate.getFullYear() + 1);
            break;
        }

        // Update recurring invoice with next run date
        await supabase
          .from('recurring_invoices')
          .update({ next_run_date: nextRunDate.toISOString().split('T')[0] })
          .eq('id', recurring.id);

        generatedCount++;
        results.push({ recurring_id: recurring.id, invoice_id: newInvoice.id, success: true });
      } catch (error) {
        console.error(`Error processing recurring invoice ${recurring.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ recurring_id: recurring.id, success: false, error: errorMessage });
      }
    }

    console.log(`Successfully generated ${generatedCount} invoices`);

    return new Response(
      JSON.stringify({
        message: `Generated ${generatedCount} recurring invoices`,
        generated: generatedCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-recurring-invoices function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
