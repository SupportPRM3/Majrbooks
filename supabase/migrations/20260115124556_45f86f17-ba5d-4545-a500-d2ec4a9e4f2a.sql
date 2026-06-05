-- Add client_number column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_client_number ON public.clients(client_number);