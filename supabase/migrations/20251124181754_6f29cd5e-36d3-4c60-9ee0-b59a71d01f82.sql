-- Create timesheets table
CREATE TABLE public.timesheets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_hours numeric NOT NULL DEFAULT 0,
  regular_hours numeric NOT NULL DEFAULT 0,
  overtime_hours numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create time_entries table
CREATE TABLE public.time_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timesheet_id uuid NOT NULL REFERENCES public.timesheets(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  clock_in timestamp with time zone NOT NULL,
  clock_out timestamp with time zone,
  break_minutes integer NOT NULL DEFAULT 0,
  total_hours numeric NOT NULL DEFAULT 0,
  notes text,
  is_overtime boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timesheets
CREATE POLICY "Users can view own timesheets"
  ON public.timesheets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own timesheets"
  ON public.timesheets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timesheets"
  ON public.timesheets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own timesheets"
  ON public.timesheets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for time_entries
CREATE POLICY "Users can view own time entries"
  ON public.time_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.timesheets
    WHERE timesheets.id = time_entries.timesheet_id
    AND timesheets.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.timesheets
    WHERE timesheets.id = time_entries.timesheet_id
    AND timesheets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own time entries"
  ON public.time_entries FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.timesheets
    WHERE timesheets.id = time_entries.timesheet_id
    AND timesheets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own time entries"
  ON public.time_entries FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.timesheets
    WHERE timesheets.id = time_entries.timesheet_id
    AND timesheets.user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_timesheets_updated_at
  BEFORE UPDATE ON public.timesheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to calculate timesheet totals
CREATE OR REPLACE FUNCTION calculate_timesheet_totals()
RETURNS TRIGGER AS $$
DECLARE
  total_reg_hours numeric := 0;
  total_ot_hours numeric := 0;
  total_hrs numeric := 0;
BEGIN
  -- Calculate totals from time entries
  SELECT 
    COALESCE(SUM(CASE WHEN is_overtime = false THEN total_hours ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN is_overtime = true THEN total_hours ELSE 0 END), 0),
    COALESCE(SUM(total_hours), 0)
  INTO total_reg_hours, total_ot_hours, total_hrs
  FROM time_entries
  WHERE timesheet_id = COALESCE(NEW.timesheet_id, OLD.timesheet_id);

  -- Update timesheet
  UPDATE timesheets
  SET 
    regular_hours = total_reg_hours,
    overtime_hours = total_ot_hours,
    total_hours = total_hrs,
    updated_at = now()
  WHERE id = COALESCE(NEW.timesheet_id, OLD.timesheet_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to recalculate timesheet totals when time entries change
CREATE TRIGGER recalculate_timesheet_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_timesheet_totals();