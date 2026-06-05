-- Enable realtime for timesheets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.timesheets;

-- Create PTO balances table
CREATE TABLE public.pto_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pto_type TEXT NOT NULL, -- 'vacation', 'sick', 'personal'
  balance_hours NUMERIC NOT NULL DEFAULT 0,
  accrued_hours NUMERIC NOT NULL DEFAULT 0,
  used_hours NUMERIC NOT NULL DEFAULT 0,
  accrual_rate NUMERIC NOT NULL DEFAULT 0, -- hours accrued per pay period
  max_balance NUMERIC, -- cap on accrual
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PTO requests table
CREATE TABLE public.pto_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pto_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours_requested NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  reason TEXT,
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.pto_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pto_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for pto_balances
CREATE POLICY "Users can view own employee pto balances"
  ON public.pto_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = pto_balances.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own employee pto balances"
  ON public.pto_balances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = pto_balances.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own employee pto balances"
  ON public.pto_balances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = pto_balances.employee_id
      AND employees.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own employee pto balances"
  ON public.pto_balances FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = pto_balances.employee_id
      AND employees.user_id = auth.uid()
    )
  );

-- RLS policies for pto_requests
CREATE POLICY "Users can view own pto requests"
  ON public.pto_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pto requests"
  ON public.pto_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pto requests"
  ON public.pto_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pto requests"
  ON public.pto_requests FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_pto_balances_updated_at
  BEFORE UPDATE ON public.pto_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_pto_requests_updated_at
  BEFORE UPDATE ON public.pto_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to accrue PTO
CREATE OR REPLACE FUNCTION public.accrue_pto_for_payroll(
  p_employee_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update balances by adding accrual_rate to balance_hours and accrued_hours
  UPDATE pto_balances
  SET 
    balance_hours = LEAST(
      balance_hours + accrual_rate,
      COALESCE(max_balance, balance_hours + accrual_rate)
    ),
    accrued_hours = accrued_hours + accrual_rate,
    updated_at = now()
  WHERE employee_id = p_employee_id
  AND EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = p_employee_id
    AND employees.user_id = p_user_id
  );
END;
$$;