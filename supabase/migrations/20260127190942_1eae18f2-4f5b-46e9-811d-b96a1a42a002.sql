-- Drop the existing check constraint and recreate with 'sent' status included
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text]));