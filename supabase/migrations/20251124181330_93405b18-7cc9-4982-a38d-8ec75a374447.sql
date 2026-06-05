-- Create payroll_runs table
CREATE TABLE public.payroll_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_name text NOT NULL,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  pay_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  total_gross_pay numeric NOT NULL DEFAULT 0,
  total_net_pay numeric NOT NULL DEFAULT 0,
  total_taxes numeric NOT NULL DEFAULT 0,
  total_deductions numeric NOT NULL DEFAULT 0,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  processed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create payroll_run_items table
CREATE TABLE public.payroll_run_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  hours_worked numeric NOT NULL DEFAULT 0,
  regular_hours numeric NOT NULL DEFAULT 0,
  overtime_hours numeric NOT NULL DEFAULT 0,
  gross_pay numeric NOT NULL DEFAULT 0,
  federal_tax numeric NOT NULL DEFAULT 0,
  state_tax numeric NOT NULL DEFAULT 0,
  social_security numeric NOT NULL DEFAULT 0,
  medicare numeric NOT NULL DEFAULT 0,
  benefit_deductions numeric NOT NULL DEFAULT 0,
  other_deductions numeric NOT NULL DEFAULT 0,
  total_deductions numeric NOT NULL DEFAULT 0,
  net_pay numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_run_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_runs
CREATE POLICY "Users can view own payroll runs"
  ON public.payroll_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payroll runs"
  ON public.payroll_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payroll runs"
  ON public.payroll_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payroll runs"
  ON public.payroll_runs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for payroll_run_items
CREATE POLICY "Users can view own payroll run items"
  ON public.payroll_run_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.payroll_runs
    WHERE payroll_runs.id = payroll_run_items.payroll_run_id
    AND payroll_runs.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own payroll run items"
  ON public.payroll_run_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.payroll_runs
    WHERE payroll_runs.id = payroll_run_items.payroll_run_id
    AND payroll_runs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own payroll run items"
  ON public.payroll_run_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.payroll_runs
    WHERE payroll_runs.id = payroll_run_items.payroll_run_id
    AND payroll_runs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own payroll run items"
  ON public.payroll_run_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.payroll_runs
    WHERE payroll_runs.id = payroll_run_items.payroll_run_id
    AND payroll_runs.user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_payroll_runs_updated_at
  BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payroll_run_items_updated_at
  BEFORE UPDATE ON public.payroll_run_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();