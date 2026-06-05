-- Create contractors table
CREATE TABLE public.contractors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  business_name text,
  tax_id text,
  address text,
  city text,
  state text,
  zip_code text,
  email text,
  phone text,
  rate numeric NOT NULL DEFAULT 0,
  payment_terms text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create contractor_payments table
CREATE TABLE public.contractor_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  payment_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  tax_year integer NOT NULL,
  is_1099_generated boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create benefits table
CREATE TABLE public.benefits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  benefit_name text NOT NULL,
  benefit_type text NOT NULL,
  provider text,
  cost_employee numeric NOT NULL DEFAULT 0,
  cost_employer numeric NOT NULL DEFAULT 0,
  deduction_frequency text NOT NULL DEFAULT 'monthly',
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create employee_benefits junction table
CREATE TABLE public.employee_benefits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  benefit_id uuid NOT NULL REFERENCES public.benefits(id) ON DELETE CASCADE,
  enrollment_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(employee_id, benefit_id)
);

-- Enable RLS
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_benefits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractors
CREATE POLICY "Users can view own contractors"
  ON public.contractors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own contractors"
  ON public.contractors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contractors"
  ON public.contractors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contractors"
  ON public.contractors FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for contractor_payments
CREATE POLICY "Users can view own contractor payments"
  ON public.contractor_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own contractor payments"
  ON public.contractor_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contractor payments"
  ON public.contractor_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contractor payments"
  ON public.contractor_payments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for benefits
CREATE POLICY "Users can view own benefits"
  ON public.benefits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own benefits"
  ON public.benefits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own benefits"
  ON public.benefits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own benefits"
  ON public.benefits FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for employee_benefits
CREATE POLICY "Users can view own employee benefits"
  ON public.employee_benefits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = employee_benefits.employee_id
    AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own employee benefits"
  ON public.employee_benefits FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = employee_benefits.employee_id
    AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own employee benefits"
  ON public.employee_benefits FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = employee_benefits.employee_id
    AND employees.user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_contractor_payments_updated_at
  BEFORE UPDATE ON public.contractor_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_benefits_updated_at
  BEFORE UPDATE ON public.benefits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_employee_benefits_updated_at
  BEFORE UPDATE ON public.employee_benefits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();