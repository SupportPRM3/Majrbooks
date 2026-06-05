
-- Create a secure function to safely retrieve profile data without exposing sensitive fields
CREATE OR REPLACE FUNCTION public.get_safe_profile(_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  avatar_url text,
  business_name text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.business_name,
    p.created_at
  FROM public.profiles p
  WHERE p.id = _user_id
    AND (
      _user_id = auth.uid()
      OR public.has_app_role(auth.uid(), 'admin')
    );
$$;

-- Tighten SELECT policy to use the security definer function
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile or admin"
  ON public.profiles
  FOR SELECT
  USING (public.can_view_profile(id));
