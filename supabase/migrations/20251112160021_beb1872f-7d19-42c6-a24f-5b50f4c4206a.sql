-- Create payroll table
CREATE TABLE public.payroll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  gross_pay NUMERIC NOT NULL DEFAULT 0,
  federal_tax NUMERIC NOT NULL DEFAULT 0,
  state_tax NUMERIC NOT NULL DEFAULT 0,
  social_security NUMERIC NOT NULL DEFAULT 0,
  medicare NUMERIC NOT NULL DEFAULT 0,
  other_deductions NUMERIC NOT NULL DEFAULT 0,
  net_pay NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT payroll_status_check CHECK (status IN ('draft', 'processed', 'paid'))
);

-- Enable Row Level Security
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own payroll records" 
ON public.payroll 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payroll records" 
ON public.payroll 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payroll records" 
ON public.payroll 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payroll records" 
ON public.payroll 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payroll_updated_at
BEFORE UPDATE ON public.payroll
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();