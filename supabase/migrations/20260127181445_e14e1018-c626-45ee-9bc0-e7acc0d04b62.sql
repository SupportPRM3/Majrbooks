-- Fix contractors table security: restrict to authenticated users only

-- Drop existing policies that allow anonymous access
DROP POLICY IF EXISTS "Users can view own contractors" ON public.contractors;
DROP POLICY IF EXISTS "Users can create own contractors" ON public.contractors;
DROP POLICY IF EXISTS "Users can update own contractors" ON public.contractors;
DROP POLICY IF EXISTS "Users can delete own contractors" ON public.contractors;

-- Create new policies that explicitly require authentication
CREATE POLICY "Authenticated users can view own contractors"
ON public.contractors
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create own contractors"
ON public.contractors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own contractors"
ON public.contractors
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own contractors"
ON public.contractors
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);