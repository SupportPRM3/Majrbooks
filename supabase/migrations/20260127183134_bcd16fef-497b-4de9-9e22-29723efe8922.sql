-- Add RLS policy to allow clients to view invoices where their email matches client_email
CREATE POLICY "Clients can view their invoices by email"
ON public.invoices
FOR SELECT
TO authenticated
USING (
  client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);