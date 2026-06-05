-- Create task templates for recurring tasks
CREATE TABLE public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('bookkeeping', 'tax', 'payroll', 'document')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  recurrence_day INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task assignees table
CREATE TABLE public.task_assignees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  role TEXT DEFAULT 'assignee' CHECK (role IN ('assignee', 'reviewer', 'approver'))
);

-- Create task status history for audit trail
CREATE TABLE public.task_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document reminders table
CREATE TABLE public.document_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('financial_statement', 'receipt', '1099', 'w2', 'vendor_form', 'compliance', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'requested', 'received', 'overdue')),
  file_url TEXT,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category column to tasks if not exists, and new columns
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS recurrence_type TEXT,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_by UUID;

-- Update category constraint
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_category_check 
  CHECK (category IN ('general', 'bookkeeping', 'tax', 'payroll', 'document'));

-- Enable RLS on new tables
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_templates
CREATE POLICY "Users can view own task templates" ON public.task_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own task templates" ON public.task_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own task templates" ON public.task_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own task templates" ON public.task_templates FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for task_assignees (via task ownership)
CREATE POLICY "Users can view task assignees" ON public.task_assignees FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_assignees.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can create task assignees" ON public.task_assignees FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_assignees.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete task assignees" ON public.task_assignees FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_assignees.task_id AND tasks.user_id = auth.uid()));

-- RLS policies for task_status_history
CREATE POLICY "Users can view own task history" ON public.task_status_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own task history" ON public.task_status_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for document_reminders
CREATE POLICY "Users can view own document reminders" ON public.document_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own document reminders" ON public.document_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own document reminders" ON public.document_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own document reminders" ON public.document_reminders FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_task_templates_user_category ON public.task_templates(user_id, category);
CREATE INDEX idx_task_assignees_task ON public.task_assignees(task_id);
CREATE INDEX idx_task_assignees_employee ON public.task_assignees(employee_id);
CREATE INDEX idx_task_status_history_task ON public.task_status_history(task_id);
CREATE INDEX idx_document_reminders_user_status ON public.document_reminders(user_id, status);
CREATE INDEX idx_document_reminders_due_date ON public.document_reminders(due_date);
CREATE INDEX idx_tasks_category ON public.tasks(category);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);