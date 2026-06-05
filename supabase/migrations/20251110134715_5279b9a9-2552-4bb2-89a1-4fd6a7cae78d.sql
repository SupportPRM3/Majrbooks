-- Create invoice_templates table
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  business_name TEXT,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  primary_color TEXT DEFAULT '#00C896',
  secondary_color TEXT DEFAULT '#1A365D',
  font_family TEXT DEFAULT 'Inter',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create invoice_line_items table
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_templates
CREATE POLICY "Users can view own templates"
  ON public.invoice_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON public.invoice_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON public.invoice_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON public.invoice_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for invoice_line_items
CREATE POLICY "Users can view own invoice line items"
  ON public.invoice_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_line_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own invoice line items"
  ON public.invoice_line_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_line_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own invoice line items"
  ON public.invoice_line_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_line_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own invoice line items"
  ON public.invoice_line_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_line_items.invoice_id 
    AND invoices.user_id = auth.uid()
  ));

-- Add template_id to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.invoice_templates(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS terms TEXT;