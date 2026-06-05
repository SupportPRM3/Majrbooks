-- Fix employees table security: restrict to authenticated users only

-- Drop existing policies that allow anonymous access
DROP POLICY IF EXISTS "Users can view their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can create their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete their own employees" ON public.employees;

-- Create new policies that explicitly require authentication
CREATE POLICY "Authenticated users can view own employees"
ON public.employees
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create own employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own employees"
ON public.employees
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);