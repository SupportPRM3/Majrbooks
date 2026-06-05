-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  detail_type TEXT NOT NULL,
  quickbooks_balance NUMERIC NOT NULL DEFAULT 0,
  bank_balance NUMERIC,
  action_type TEXT NOT NULL DEFAULT 'report' CHECK (action_type IN ('register', 'report')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own accounts"
  ON public.chart_of_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own accounts"
  ON public.chart_of_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON public.chart_of_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON public.chart_of_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add account_id to transactions table to link transactions to accounts
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.chart_of_accounts(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);