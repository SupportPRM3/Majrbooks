import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskTemplate {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  recurrence_type: string | null;
  recurrence_day: number | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentDayOfWeek = now.getDay();

    console.log(`Running task generation at ${now.toISOString()}`);

    // Fetch active task templates
    const { data: templates, error: templatesError } = await supabase
      .from('task_templates')
      .select('*')
      .eq('is_active', true);

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      throw templatesError;
    }

    console.log(`Found ${templates?.length || 0} active templates`);

    const tasksToCreate: any[] = [];

    for (const template of (templates || []) as TaskTemplate[]) {
      let shouldCreate = false;
      let dueDate = new Date();

      switch (template.recurrence_type) {
        case 'daily':
          shouldCreate = true;
          dueDate.setDate(dueDate.getDate() + 1);
          break;

        case 'weekly':
          // Create on Sunday (0) or specified day
          if (currentDayOfWeek === (template.recurrence_day || 0)) {
            shouldCreate = true;
            dueDate.setDate(dueDate.getDate() + 7);
          }
          break;

        case 'monthly':
          // Create on specified day of month or 1st
          if (currentDay === (template.recurrence_day || 1)) {
            shouldCreate = true;
            dueDate.setMonth(dueDate.getMonth() + 1);
          }
          break;

        case 'quarterly':
          // Create on first day of quarter months (Jan, Apr, Jul, Oct)
          if ([0, 3, 6, 9].includes(currentMonth) && currentDay === 1) {
            shouldCreate = true;
            dueDate.setMonth(dueDate.getMonth() + 3);
          }
          break;

        case 'annually':
          // Create on January 1st or specified day
          if (currentMonth === 0 && currentDay === (template.recurrence_day || 1)) {
            shouldCreate = true;
            dueDate.setFullYear(dueDate.getFullYear() + 1);
          }
          break;
      }

      if (shouldCreate) {
        // Check if task already exists for this template and due date
        const dueDateStr = dueDate.toISOString().split('T')[0];
        const { data: existingTask } = await supabase
          .from('tasks')
          .select('id')
          .eq('template_id', template.id)
          .eq('due_date', dueDateStr)
          .maybeSingle();

        if (!existingTask) {
          tasksToCreate.push({
            user_id: template.user_id,
            title: template.title,
            description: template.description,
            category: template.category,
            priority: template.priority,
            due_date: dueDateStr,
            status: 'pending',
            template_id: template.id,
            recurrence_type: template.recurrence_type,
          });
        }
      }
    }

    // Create bookkeeping tasks for month-end
    if (currentDay === 1) {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (!usersError && users) {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthName = lastMonth.toLocaleString('default', { month: 'long' });

        for (const user of users) {
          const bookkeepingTasks = [
            {
              user_id: user.id,
              title: `Close ${monthName} Books`,
              description: 'Review and close the monthly books',
              category: 'bookkeeping',
              priority: 'high',
              due_date: new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0],
              status: 'pending',
            },
            {
              user_id: user.id,
              title: `Reconcile Bank Accounts - ${monthName}`,
              description: 'Reconcile all bank accounts for the previous month',
              category: 'bookkeeping',
              priority: 'high',
              due_date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString().split('T')[0],
              status: 'pending',
            },
          ];
          tasksToCreate.push(...bookkeepingTasks);
        }
      }
    }

    // Create quarterly tax tasks
    if ([0, 3, 6, 9].includes(currentMonth) && currentDay === 1) {
      const { data: users } = await supabase.from('profiles').select('id');

      if (users) {
        const quarterEndDate = new Date(now.getFullYear(), currentMonth + 1, 15);

        for (const user of users) {
          tasksToCreate.push({
            user_id: user.id,
            title: `Q${Math.floor(currentMonth / 3) + 1} Estimated Tax Prep`,
            description: 'Prepare quarterly estimated tax payments',
            category: 'tax',
            priority: 'high',
            due_date: quarterEndDate.toISOString().split('T')[0],
            status: 'pending',
          });
        }
      }
    }

    // Insert all tasks
    if (tasksToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToCreate);

      if (insertError) {
        console.error('Error creating tasks:', insertError);
        throw insertError;
      }

      console.log(`Created ${tasksToCreate.length} tasks`);
    }

    // Update overdue document reminders
    const { error: updateError } = await supabase
      .from('document_reminders')
      .update({ status: 'overdue' })
      .lt('due_date', now.toISOString().split('T')[0])
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error updating overdue reminders:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tasksCreated: tasksToCreate.length,
        timestamp: now.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-recurring-tasks:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
