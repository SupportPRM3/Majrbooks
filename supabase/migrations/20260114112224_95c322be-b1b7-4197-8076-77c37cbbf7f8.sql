-- Remove the unused ssn column from employees table
-- This column is not used in any UI components and poses a security risk

ALTER TABLE public.employees DROP COLUMN IF EXISTS ssn;