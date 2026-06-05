-- Make audit_logs immutable by adding explicit deny policies for UPDATE and DELETE
-- This ensures audit logs cannot be tampered with once created

-- Add explicit deny policy for UPDATE operations
CREATE POLICY "Audit logs cannot be updated"
ON public.audit_logs
FOR UPDATE
USING (false);

-- Add explicit deny policy for DELETE operations  
CREATE POLICY "Audit logs cannot be deleted"
ON public.audit_logs
FOR DELETE
USING (false);