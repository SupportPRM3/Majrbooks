-- Create client_bank_accounts table for banking connections
CREATE TABLE public.client_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  institution_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number_last4 TEXT,
  account_type TEXT DEFAULT 'checking',
  balance NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'connected',
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own client bank accounts" ON public.client_bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own client bank accounts" ON public.client_bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client bank accounts" ON public.client_bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own client bank accounts" ON public.client_bank_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Add tax_prep_status to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tax_prep_status TEXT DEFAULT 'not_started';

-- Create index for faster lookups
CREATE INDEX idx_client_bank_accounts_client_id ON public.client_bank_accounts(client_id);
CREATE INDEX idx_client_bank_accounts_user_id ON public.client_bank_accounts(user_id);