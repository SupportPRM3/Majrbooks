-- Add source tracking to journal_entries
ALTER TABLE journal_entries 
ADD COLUMN source_type text,
ADD COLUMN source_id uuid;

-- Create payments table to track invoice payments
CREATE TABLE invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on invoice_payments
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_payments
CREATE POLICY "Users can view own payments"
ON invoice_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments"
ON invoice_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
ON invoice_payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments"
ON invoice_payments FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for invoice_payments updated_at
CREATE TRIGGER update_invoice_payments_updated_at
BEFORE UPDATE ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Function to auto-generate journal entry for invoice
CREATE OR REPLACE FUNCTION generate_invoice_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
  accounts_receivable_id uuid;
  revenue_id uuid;
  je_id uuid;
BEGIN
  -- Only generate for new invoices that aren't drafts
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status = 'draft')) AND NEW.status != 'draft' THEN
    
    -- Find or create Accounts Receivable account
    SELECT id INTO accounts_receivable_id
    FROM chart_of_accounts
    WHERE user_id = NEW.user_id 
      AND name = 'Accounts Receivable'
      AND account_type = 'Asset'
    LIMIT 1;
    
    IF accounts_receivable_id IS NULL THEN
      INSERT INTO chart_of_accounts (user_id, name, account_type, detail_type, is_active)
      VALUES (NEW.user_id, 'Accounts Receivable', 'Asset', 'AccountsReceivable', true)
      RETURNING id INTO accounts_receivable_id;
    END IF;
    
    -- Find or create Revenue account
    SELECT id INTO revenue_id
    FROM chart_of_accounts
    WHERE user_id = NEW.user_id 
      AND name = 'Revenue'
      AND account_type = 'Income'
    LIMIT 1;
    
    IF revenue_id IS NULL THEN
      INSERT INTO chart_of_accounts (user_id, name, account_type, detail_type, is_active)
      VALUES (NEW.user_id, 'Revenue', 'Income', 'SalesRevenue', true)
      RETURNING id INTO revenue_id;
    END IF;
    
    -- Check if journal entry already exists for this invoice
    SELECT id INTO je_id
    FROM journal_entries
    WHERE source_type = 'invoice' AND source_id = NEW.id;
    
    IF je_id IS NULL THEN
      -- Create journal entry
      INSERT INTO journal_entries (
        user_id, 
        entry_number, 
        entry_date, 
        description, 
        reference, 
        status,
        source_type,
        source_id
      )
      VALUES (
        NEW.user_id,
        'JE-INV-' || NEW.invoice_number,
        NEW.issue_date,
        'Invoice ' || NEW.invoice_number || ' - ' || NEW.client_name,
        NEW.invoice_number,
        'posted',
        'invoice',
        NEW.id
      )
      RETURNING id INTO je_id;
      
      -- Create debit line (Accounts Receivable)
      INSERT INTO journal_entry_lines (
        journal_entry_id,
        account_id,
        debit,
        credit,
        description
      )
      VALUES (
        je_id,
        accounts_receivable_id,
        NEW.amount,
        0,
        'Invoice to ' || NEW.client_name
      );
      
      -- Create credit line (Revenue)
      INSERT INTO journal_entry_lines (
        journal_entry_id,
        account_id,
        debit,
        credit,
        description
      )
      VALUES (
        je_id,
        revenue_id,
        0,
        NEW.amount,
        'Sales revenue'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for invoice journal entries
CREATE TRIGGER invoice_journal_entry_trigger
AFTER INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_journal_entry();

-- Function to auto-generate journal entry for payment
CREATE OR REPLACE FUNCTION generate_payment_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
  cash_account_id uuid;
  accounts_receivable_id uuid;
  je_id uuid;
  invoice_number text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get invoice number
    SELECT invoices.invoice_number INTO invoice_number
    FROM invoices
    WHERE invoices.id = NEW.invoice_id;
    
    -- Find or create Cash/Bank account
    SELECT id INTO cash_account_id
    FROM chart_of_accounts
    WHERE user_id = NEW.user_id 
      AND name = 'Cash'
      AND account_type = 'Asset'
    LIMIT 1;
    
    IF cash_account_id IS NULL THEN
      INSERT INTO chart_of_accounts (user_id, name, account_type, detail_type, is_active)
      VALUES (NEW.user_id, 'Cash', 'Asset', 'Cash', true)
      RETURNING id INTO cash_account_id;
    END IF;
    
    -- Find or create Accounts Receivable account
    SELECT id INTO accounts_receivable_id
    FROM chart_of_accounts
    WHERE user_id = NEW.user_id 
      AND name = 'Accounts Receivable'
      AND account_type = 'Asset'
    LIMIT 1;
    
    IF accounts_receivable_id IS NULL THEN
      INSERT INTO chart_of_accounts (user_id, name, account_type, detail_type, is_active)
      VALUES (NEW.user_id, 'Accounts Receivable', 'Asset', 'AccountsReceivable', true)
      RETURNING id INTO accounts_receivable_id;
    END IF;
    
    -- Create journal entry
    INSERT INTO journal_entries (
      user_id, 
      entry_number, 
      entry_date, 
      description, 
      reference, 
      status,
      source_type,
      source_id
    )
    VALUES (
      NEW.user_id,
      'JE-PAY-' || NEW.id::text,
      NEW.payment_date,
      'Payment received for Invoice ' || invoice_number,
      invoice_number,
      'posted',
      'payment',
      NEW.id
    )
    RETURNING id INTO je_id;
    
    -- Create debit line (Cash)
    INSERT INTO journal_entry_lines (
      journal_entry_id,
      account_id,
      debit,
      credit,
      description
    )
    VALUES (
      je_id,
      cash_account_id,
      NEW.amount,
      0,
      'Payment via ' || NEW.payment_method
    );
    
    -- Create credit line (Accounts Receivable)
    INSERT INTO journal_entry_lines (
      journal_entry_id,
      account_id,
      debit,
      credit,
      description
    )
    VALUES (
      je_id,
      accounts_receivable_id,
      0,
      NEW.amount,
      'Payment applied'
    );
    
    -- Update invoice amount_paid
    UPDATE invoices
    SET amount_paid = COALESCE(amount_paid, 0) + NEW.amount,
        status = CASE 
          WHEN (COALESCE(amount_paid, 0) + NEW.amount) >= amount THEN 'paid'
          ELSE 'pending'
        END
    WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for payment journal entries
CREATE TRIGGER payment_journal_entry_trigger
AFTER INSERT ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION generate_payment_journal_entry();