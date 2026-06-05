-- Create recurring invoices table
CREATE TABLE IF NOT EXISTS public.recurring_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  invoice_number_prefix TEXT NOT NULL DEFAULT 'INV',
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_run_date DATE NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  notes TEXT,
  terms TEXT,
  template_id UUID,
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  amount NUMERIC NOT NULL,
  auto_send BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (template_id) REFERENCES invoice_templates(id) ON DELETE SET NULL
);

-- Create recurring invoice line items table
CREATE TABLE IF NOT EXISTS public.recurring_invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_invoice_id UUID NOT NULL,
  description TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  FOREIGN KEY (recurring_invoice_id) REFERENCES recurring_invoices(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_invoices
CREATE POLICY "Users can view own recurring invoices"
  ON public.recurring_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring invoices"
  ON public.recurring_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring invoices"
  ON public.recurring_invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring invoices"
  ON public.recurring_invoices FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for recurring_invoice_line_items
CREATE POLICY "Users can view own recurring invoice line items"
  ON public.recurring_invoice_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recurring_invoices
    WHERE recurring_invoices.id = recurring_invoice_line_items.recurring_invoice_id
    AND recurring_invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own recurring invoice line items"
  ON public.recurring_invoice_line_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM recurring_invoices
    WHERE recurring_invoices.id = recurring_invoice_line_items.recurring_invoice_id
    AND recurring_invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own recurring invoice line items"
  ON public.recurring_invoice_line_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM recurring_invoices
    WHERE recurring_invoices.id = recurring_invoice_line_items.recurring_invoice_id
    AND recurring_invoices.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own recurring invoice line items"
  ON public.recurring_invoice_line_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM recurring_invoices
    WHERE recurring_invoices.id = recurring_invoice_line_items.recurring_invoice_id
    AND recurring_invoices.user_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_recurring_invoices_updated_at
  BEFORE UPDATE ON public.recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();