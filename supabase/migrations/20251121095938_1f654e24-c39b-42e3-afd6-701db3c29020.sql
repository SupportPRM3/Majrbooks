-- Create tax_rates table to manage different sales tax rates
CREATE TABLE IF NOT EXISTS public.tax_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tax_rates
CREATE POLICY "Users can view own tax rates"
  ON public.tax_rates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tax rates"
  ON public.tax_rates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax rates"
  ON public.tax_rates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax rates"
  ON public.tax_rates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_tax_rates_updated_at
  BEFORE UPDATE ON public.tax_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add tax_rate_id to invoices table to link invoices to tax rates
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_rate_id UUID REFERENCES public.tax_rates(id);

-- Add tax_name to invoices for historical tracking (in case tax rate is deleted)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_name TEXT;

-- Add tax_rate percentage to invoices for historical tracking
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0;