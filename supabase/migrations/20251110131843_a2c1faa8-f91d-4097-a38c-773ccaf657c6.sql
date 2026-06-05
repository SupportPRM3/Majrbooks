-- Update invoice status constraint to allow all necessary statuses
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled'));