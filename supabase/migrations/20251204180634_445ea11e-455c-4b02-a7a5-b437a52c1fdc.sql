-- Pay schedules table
CREATE TABLE public.pay_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  frequency text NOT NULL DEFAULT 'biweekly', -- weekly, biweekly, semi-monthly, monthly
  pay_day integer, -- day of week (1-7) or day of month (1-31)
  second_pay_day integer, -- for semi-monthly
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Employee pay configuration table
CREATE TABLE public.employee_pay_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pay_schedule_id uuid REFERENCES public.pay_schedules(id),
  overtime_rate numeric DEFAULT 1.5,
  allowances numeric DEFAULT 0,
  bonuses numeric DEFAULT 0,
  reimbursements numeric DEFAULT 0,
  federal_filing_status text DEFAULT 'single',
  state_filing_status text DEFAULT 'single',
  additional_federal_withholding numeric DEFAULT 0,
  additional_state_withholding numeric DEFAULT 0,
  pre_tax_deductions numeric DEFAULT 0,
  post_tax_deductions numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id)
);

-- Contractor rates table (for different rate types)
CREATE TABLE public.contractor_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rate_type text NOT NULL DEFAULT 'hourly', -- hourly, flat, project
  rate numeric NOT NULL DEFAULT 0,
  description text,
  is_default boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contractor invoices table
CREATE TABLE public.contractor_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  hours_worked numeric DEFAULT 0,
  hourly_rate numeric DEFAULT 0,
  flat_amount numeric DEFAULT 0,
  description text,
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- draft, sent, approved, paid, rejected
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Generated 1099 forms storage
CREATE TABLE public.generated_1099s (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tax_year integer NOT NULL,
  total_compensation numeric NOT NULL DEFAULT 0,
  federal_tax_withheld numeric DEFAULT 0,
  state_tax_withheld numeric DEFAULT 0,
  state_payer_number text,
  state_income numeric DEFAULT 0,
  payer_name text,
  payer_tin text,
  payer_address text,
  payer_city text,
  payer_state text,
  payer_zip text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text,
  status text DEFAULT 'generated', -- generated, sent, filed
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contractor_id, tax_year)
);

-- Enable RLS
ALTER TABLE public.pay_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_pay_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_1099s ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pay_schedules
CREATE POLICY "Users can view own pay schedules" ON public.pay_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pay schedules" ON public.pay_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pay schedules" ON public.pay_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pay schedules" ON public.pay_schedules FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for employee_pay_config
CREATE POLICY "Users can view own employee pay config" ON public.employee_pay_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own employee pay config" ON public.employee_pay_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employee pay config" ON public.employee_pay_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employee pay config" ON public.employee_pay_config FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contractor_rates
CREATE POLICY "Users can view own contractor rates" ON public.contractor_rates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own contractor rates" ON public.contractor_rates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contractor rates" ON public.contractor_rates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contractor rates" ON public.contractor_rates FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for contractor_invoices
CREATE POLICY "Users can view own contractor invoices" ON public.contractor_invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own contractor invoices" ON public.contractor_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contractor invoices" ON public.contractor_invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contractor invoices" ON public.contractor_invoices FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for generated_1099s
CREATE POLICY "Users can view own generated 1099s" ON public.generated_1099s FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own generated 1099s" ON public.generated_1099s FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generated 1099s" ON public.generated_1099s FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own generated 1099s" ON public.generated_1099s FOR DELETE USING (auth.uid() = user_id);