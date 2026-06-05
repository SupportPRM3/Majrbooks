-- Create transaction_rules table
CREATE TABLE public.transaction_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  applied_to TEXT, -- Which transactions this applies to
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb, -- Conditions for rule matching
  settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- Actions to take when matched
  auto_add BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own transaction rules"
ON public.transaction_rules
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transaction rules"
ON public.transaction_rules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction rules"
ON public.transaction_rules
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction rules"
ON public.transaction_rules
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_transaction_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transaction_rules_updated_at
BEFORE UPDATE ON public.transaction_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_transaction_rules_updated_at();