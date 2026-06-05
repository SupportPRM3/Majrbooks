-- Add client_user_id column to link invoices directly to client accounts
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_client_user_id ON public.invoices(client_user_id);

-- Drop the vulnerable email-based policy
DROP POLICY IF EXISTS "Clients can view their invoices by email" ON public.invoices;

-- Create new secure policy using client_user_id instead of email matching
-- This prevents email enumeration attacks
CREATE POLICY "Clients can view invoices linked to their account"
ON public.invoices
FOR SELECT
TO authenticated
USING (auth.uid() = client_user_id);

-- Add comment explaining the security improvement
COMMENT ON COLUMN public.invoices.client_user_id IS 'Secure link to client user account, replacing email-based access to prevent enumeration attacks';