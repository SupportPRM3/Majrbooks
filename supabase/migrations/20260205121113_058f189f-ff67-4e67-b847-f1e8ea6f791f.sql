-- Add AI extraction fields to receipts table
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS merchant_name text,
ADD COLUMN IF NOT EXISTS tax_amount numeric,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS ai_confidence numeric,
ADD COLUMN IF NOT EXISTS ai_processed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS raw_ai_response jsonb;