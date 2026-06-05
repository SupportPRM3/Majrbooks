-- Create bank_transactions table for imported bank statements
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
  reference_number TEXT,
  is_reconciled BOOLEAN NOT NULL DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bank_transactions
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_transactions
CREATE POLICY "Users can view own bank transactions"
  ON public.bank_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bank transactions"
  ON public.bank_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank transactions"
  ON public.bank_transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank transactions"
  ON public.bank_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create reconciliation_matches table to link bank transactions with ledger transactions
CREATE TABLE IF NOT EXISTS public.reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bank_transaction_id UUID REFERENCES public.bank_transactions(id) ON DELETE CASCADE,
  ledger_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bank_transaction_id, ledger_transaction_id)
);

-- Enable RLS on reconciliation_matches
ALTER TABLE public.reconciliation_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for reconciliation_matches
CREATE POLICY "Users can view own reconciliation matches"
  ON public.reconciliation_matches
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reconciliation matches"
  ON public.reconciliation_matches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reconciliation matches"
  ON public.reconciliation_matches
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add reconciliation fields to transactions table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'is_reconciled') THEN
    ALTER TABLE public.transactions ADD COLUMN is_reconciled BOOLEAN NOT NULL DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'reconciled_at') THEN
    ALTER TABLE public.transactions ADD COLUMN reconciled_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bank_transactions_user_id ON public.bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON public.bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_reconciled ON public.bank_transactions(is_reconciled);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_user_id ON public.reconciliation_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reconciled ON public.transactions(is_reconciled);

-- Create trigger to update updated_at on bank_transactions
CREATE OR REPLACE FUNCTION public.update_bank_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_transactions_updated_at
  BEFORE UPDATE ON public.bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_transactions_updated_at();